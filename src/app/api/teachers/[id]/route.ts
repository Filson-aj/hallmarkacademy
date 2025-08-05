import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { teacherSchema } from "@/lib/schemas";

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
        const teacher = await prisma.teacher.findUnique({
            where: { id },
            include: { subjects: true, school: true },
        });

        if (!teacher) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        return NextResponse.json(teacher);
    } catch (error) {
        console.error("Error fetching teacher:", error);
        return NextResponse.json({ error: "Failed to fetch teacher" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validated = teacherSchema.parse(body);

        // Prepare update payload
        const updateData: any = {};
        if (validated.title) updateData.title = validated.title;
        if (validated.firstname) updateData.firstname = validated.firstname;
        if (validated.surname) updateData.surname = validated.surname;
        if (validated.othername !== undefined) updateData.othername = validated.othername;
        if (validated.birthday) updateData.birthday = new Date(validated.birthday);
        if (validated.bloodgroup) updateData.bloodgroup = validated.bloodgroup;
        if (validated.gender) updateData.gender = validated.gender;
        if (validated.state) updateData.state = validated.state;
        if (validated.lga) updateData.lga = validated.lga;
        if (validated.email) {
            updateData.email = validated.email;
            updateData.username = validated.email;
        }
        if (validated.phone !== undefined) updateData.phone = validated.phone;
        if (validated.address) updateData.address = validated.address;
        if (validated.avarta !== undefined) updateData.avarta = validated.avarta;
        if (validated.schoolid) updateData.schoolid = validated.schoolid;

        // Hash password if provided
        if (validated.password) {
            const hash = await bcrypt.hash(validated.password, 12);
            updateData.password = hash;
        }

        // Transactional update for subjects
        const result = await prisma.$transaction(async (tx) => {
            if (validated.subjects) {
                // Disconnect all and reconnect to match array
                await tx.teacher.update({
                    where: { id },
                    data: { subjects: { set: validated.subjects.map((s) => ({ id: s })) } },
                });
            }

            const updated = await tx.teacher.update({
                where: { id },
                data: updateData,
                include: { subjects: true, school: true },
            });

            return updated;
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
        }
        console.error("Error updating teacher:", error);
        return NextResponse.json({ error: "Failed to update teacher" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const deleted = await prisma.teacher.delete({ where: { id } });

        return NextResponse.json({ message: "Teacher deleted", id: deleted.id });
    } catch (error) {
        console.error("Error deleting teacher:", error);
        return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
    }
}
