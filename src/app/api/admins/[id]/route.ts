import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { administrationUpdateSchema } from "@/lib/schemas/index";

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
        const requesterRole = String(session.user?.role ?? "").toLowerCase();
        const requesterId = String(session.user?.id ?? "");

        // Only SUPER can view any administrator; others can only view their own record
        if (requesterRole !== "super" && id !== requesterId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const admin = await prisma.administration.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                active: true,
                avatar: true,
                schoolId: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { notifications: true } },
            },
        });

        if (!admin) {
            return NextResponse.json({ error: "Administrator not found" }, { status: 404 });
        }

        return NextResponse.json({ data: admin });
    } catch (error) {
        console.error("GET /api/administrations/[id] error:", error);
        return NextResponse.json({ error: "Failed to fetch administrator" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const requesterRole = String(session.user?.role ?? "").toLowerCase();
        const requesterId = String(session.user?.id ?? "");

        // Only SUPER may update any admin; other elevated users may only update their own record
        if (requesterRole !== "super" && id !== requesterId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await request.json();

        // Validate body with Zod (use partial update schema)
        const parsed = administrationUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
        }
        const validated = parsed.data;

        // Ensure admin exists
        const existingAdmin = await prisma.administration.findUnique({ where: { id } });
        if (!existingAdmin) {
            return NextResponse.json({ error: "Administrator not found" }, { status: 404 });
        }

        // Check for email/username conflicts (exclude current record)
        if (validated.email || validated.username) {
            const conflict = await prisma.administration.findFirst({
                where: {
                    OR: [
                        ...(validated.email ? [{ email: validated.email }] : []),
                        ...(validated.username ? [{ username: validated.username }] : []),
                    ],
                    id: { not: id },
                },
            });
            if (conflict) {
                return NextResponse.json({ error: "Username or email already exists" }, { status: 409 });
            }
        }

        // Non-super users cannot change their own role
        if (requesterRole !== "super" && validated.role && id === requesterId) {
            return NextResponse.json({ error: "Cannot change your own role" }, { status: 403 });
        }

        const updateData: any = {};

        if (validated.username !== undefined) updateData.username = validated.username;
        if (validated.role !== undefined) updateData.role = validated.role;
        if (validated.active !== undefined) updateData.active = validated.active;
        if (validated.avatar !== undefined) updateData.avatar = validated.avatar; // matches Prisma schema
        if (validated.schoolId !== undefined) updateData.schoolId = validated.schoolId;

        if (validated.password) {
            updateData.password = await bcrypt.hash(validated.password, 12);
        }

        const updated = await prisma.administration.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                active: true,
                avatar: true,
                schoolId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({ data: updated });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
        }
        console.error("PUT /api/administrations/[id] error:", error);
        return NextResponse.json({ error: "Failed to update administrator" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const requesterRole = String(session.user?.role ?? "").toLowerCase();
        const requesterId = String(session.user?.id ?? "");

        // Only SUPER can delete administrators
        if (requesterRole !== "super") {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Prevent deletion of current user
        if (id === requesterId) {
            return NextResponse.json({ error: "Invalid operation - You cannot delete your own account!" }, { status: 400 });
        }

        const admin = await prisma.administration.findUnique({ where: { id } });
        if (!admin) {
            return NextResponse.json({ error: "Administrator not found" }, { status: 404 });
        }

        await prisma.administration.delete({ where: { id } });

        return NextResponse.json({ message: "Administrator deleted successfully" });
    } catch (error) {
        console.error("DELETE /api/administrations/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete administrator" }, { status: 500 });
    }
}
