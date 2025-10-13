import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { administrationSchema } from "@/lib/schemas";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const admin = await prisma.administration.findUnique({
            where: { id },
            select: { id: true, username: true, email: true, role: true, createdAt: true, updatedAt: true }
        });

        if (!admin) {
            return NextResponse.json({ error: "Administration not found" }, { status: 404 });
        }

        return NextResponse.json(admin);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch administration" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validated = administrationSchema.parse(body);

        // Unique check for username/email
        if (validated.username || validated.email) {
            const conflict = await prisma.administration.findFirst({
                where: {
                    OR: [
                        ...(validated.username ? [{ username: validated.username }] : []),
                        ...(validated.email ? [{ email: validated.email }] : [])
                    ],
                    id: { not: id }
                }
            });
            if (conflict) {
                return NextResponse.json({ error: "Username or email already exist" }, { status: 409 });
            }
        }

        // Hash new password if provided
        let hashed;
        if (validated.password) {
            hashed = await bcrypt.hash(validated.password, 12);
        }

        const updateData: any = { ...validated };
        if (hashed) updateData.password = hashed;

        const updated = await prisma.administration.update({
            where: { id },
            data: updateData,
            select: { id: true, username: true, email: true, role: true, createdAt: true, updatedAt: true }
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update administration" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await prisma.administration.delete({ where: { id } });

        return NextResponse.json({ message: "Administration deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete administration" }, { status: 500 });
    }
}
