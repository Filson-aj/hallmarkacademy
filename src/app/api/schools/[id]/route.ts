import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { schoolSchema } from "@/lib/schemas";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = schoolSchema.parse(body);

        const school = await prisma.school.update({
            where: { id },
            data: {
                name: validatedData.name,
                subtitle: validatedData.subtitle || null,
                schooltype: validatedData.schooltype,
                email: validatedData.email,
                phone: validatedData.phone || null,
                address: validatedData.address,
                logo: validatedData.logo || null,
                contactperson: validatedData.contactperson || null,
                contactpersonphone: validatedData.contactpersonphone || null,
                contactpersonemail: validatedData.contactpersonemail || null,
                youtube: validatedData.youtube || null,
                facebook: validatedData.facebook || null,
                regnumbercount: validatedData.regnumbercount || undefined,
                regnumberprepend: validatedData.regnumberprepend || null,
                regnumberappend: validatedData.regnumberappend || null,
                updateAt: new Date(),
            }
        });

        return NextResponse.json(school);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update school" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await prisma.school.delete({
            where: { id }
        });

        return NextResponse.json({ message: "School deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete school" }, { status: 500 });
    }
}