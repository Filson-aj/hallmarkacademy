export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { schoolSchema } from "@/lib/schemas";
import { deleteFromDropbox } from "@/lib/files.util";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const school = await prisma.school.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        students: true,
                        teachers: true,
                        subjects: true,
                        paymentsetups: true,
                        payments: true,
                    },
                },
            },
        });

        if (!school) {
            return NextResponse.json({ error: "School not found" }, { status: 404 });
        }
        return NextResponse.json({ data: school, });
    } catch (error) {
        console.error("Error fetching school:", error);
        return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // --- auth check ---
        const session = await getServerSession(authOptions);
        if (!session || !["super", "management", "admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // --- parse JSON body ---
        const body = await request.json();
        const validated = schoolSchema.parse(body);

        // --- fetch existing record to compare logos ---
        const existing = await prisma.school.findUnique({
            where: { id },
            select: { logo: true },
        });
        if (!existing) {
            return NextResponse.json({ error: "School not found" }, { status: 404 });
        }

        // --- if a new logo URL is provided and is different, delete the old from Dropbox ---
        if (validated.logo ?? body.logo) {
            try {
                console.log("Deleting old logo from Dropbox:", existing.logo);
                if (existing.logo) {
                    await deleteFromDropbox(existing.logo);
                }
            } catch (err) {
                console.warn("Failed to delete old logo on Dropbox:", err);
            }
        }

        // --- update the record ---
        const updated = await prisma.school.update({
            where: { id },
            data: {
                name: validated.name,
                subtitle: validated.subtitle || null,
                schooltype: validated.schooltype,
                email: validated.email,
                phone: validated.phone || null,
                address: validated.address,
                logo: validated.logo || existing.logo,
                contactperson: validated.contactperson || null,
                contactpersonphone: validated.contactpersonphone || null,
                contactpersonemail: validated.contactpersonemail || null,
                youtube: validated.youtube || null,
                facebook: validated.facebook || null,
                regnumbercount: validated.regnumbercount,
                regnumberprepend: validated.regnumberprepend || null,
                regnumberappend: validated.regnumberappend || null,
                updatedAt: new Date(),
            },
            include: {
                _count: {
                    select: {
                        students: true,
                        teachers: true,
                        subjects: true,
                        paymentsetups: true,
                        payments: true,
                    },
                },
            },
        });

        return NextResponse.json(updated);
    } catch (err: any) {
        console.error("Error updating school:", err);
        if (err.name === "ZodError") {
            return NextResponse.json(
                { error: err.errors.map((e: any) => e.message).join(", ") },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to update school" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // --- auth check ---
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // --- fetch logo ---
        const school = await prisma.school.findUnique({
            where: { id },
            select: { logo: true },
        });

        if (!school) {
            return NextResponse.json({ error: "School not found" }, { status: 404 });
        }

        // --- delete file from Dropbox ---
        if (school.logo) {
            try {
                await deleteFromDropbox(school.logo);
            } catch (err) {
                console.warn("Could not delete Dropbox file:", school.logo, err);
            }
        }

        // --- delete DB row ---
        await prisma.school.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("Error deleting school:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}