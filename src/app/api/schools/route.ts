export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { schoolSchema } from "@/lib/schemas";
import { deleteFromDropbox } from "@/lib/files.util";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const schools = await prisma.school.findMany({
            include: {
                _count: {
                    select: {
                        students: true,
                        teachers: true,
                        subjects: true,
                        paymentsetups: true,
                        payments: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(schools);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Expect JSON with logo URL instead of multipart
        const body = await request.json();
        const validated = schoolSchema.parse(body);

        const school = await prisma.school.create({
            data: {
                name: validated.name,
                subtitle: validated.subtitle || null,
                schooltype: validated.schooltype,
                email: validated.email,
                phone: validated.phone || null,
                address: validated.address,
                logo: validated.logo,  // URL from client/upload
                contactperson: validated.contactperson || null,
                contactpersonphone: validated.contactpersonphone || null,
                contactpersonemail: validated.contactpersonemail || null,
                youtube: validated.youtube || null,
                facebook: validated.facebook || null,
                regnumbercount: validated.regnumbercount,
                regnumberprepend: validated.regnumberprepend || null,
                regnumberappend: validated.regnumberappend || null,
            }
        });

        return NextResponse.json(school, { status: 201 });
    } catch (err: any) {
        console.error("Error creating school:", err);
        if (err.name === 'ZodError') {
            return NextResponse.json({ error: err.errors.map((e: any) => e.message).join(', ') }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "management", "admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (ids.length === 0 || ids.some(id => !id)) {
            return NextResponse.json({ error: "Valid school ID(s) are required" }, { status: 400 });
        }

        // fetch logo URLs for each record
        const schools = await prisma.school.findMany({
            where: { id: { in: ids } },
            select: { logo: true }
        });

        // delete each file from Dropbox
        await Promise.all(
            schools.map(async ({ logo }) => {
                if (logo) {
                    try {
                        await deleteFromDropbox(logo);
                    } catch (error) {
                        console.warn(`Could not delete Dropbox file ${logo}:`, error);
                    }
                }
            })
        );

        // bulk delete DB records
        await prisma.school.deleteMany({
            where: { id: { in: ids } }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting schools:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
