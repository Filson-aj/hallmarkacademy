// src/app/api/schools/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { schoolSchema } from "@/lib/schemas";
import { deleteFromDropbox } from "@/lib/files.util";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // --- auth check ---
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin"].includes(session.user.role)) {
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
        if (
            validated.logo ?? body.logo
        ) {
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
                updateAt: new Date(),
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
    request: NextRequest
) {
    try {
        // --- auth check ---
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // --- get ?ids=... ---
        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (!ids.length || ids.some((i) => !i)) {
            return NextResponse.json(
                { error: "Valid school ID(s) are required" },
                { status: 400 }
            );
        }

        // --- fetch logos for each record ---
        const schools = await prisma.school.findMany({
            where: { id: { in: ids } },
            select: { logo: true },
        });

        // --- delete each file from Dropbox ---
        await Promise.all(
            schools.map(async ({ logo }) => {
                if (logo) {
                    try {
                        await deleteFromDropbox(logo);
                    } catch (err) {
                        console.warn("Could not delete Dropbox file:", logo, err);
                    }
                }
            })
        );

        // --- bulk delete the DB rows ---
        await prisma.school.deleteMany({
            where: { id: { in: ids } },
        });

        return new NextResponse(null, { status: 204 });
    } catch (err) {
        console.error("Error deleting schools:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
