import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { parentSchema } from "@/lib/schemas";

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
        const parent = await prisma.parent.findUnique({
            where: { id },
            include: {
                students: {
                    select: {
                        id: true,
                        firstname: true,
                        othername: true,
                        surname: true,
                    },
                },
            },
        });

        if (!parent) {
            return NextResponse.json({ error: "Parent not found" }, { status: 404 });
        }

        return NextResponse.json(parent);
    } catch (error) {
        console.error("Error fetching parent:", error);
        return NextResponse.json({ error: "Failed to fetch parent" }, { status: 500 });
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
        const validated = parentSchema.parse(body);

        // Prepare update payload
        const updateData: any = {};
        if (validated.username) updateData.username = validated.username;
        if (validated.title) updateData.title = validated.title;
        if (validated.firstname) updateData.firstname = validated.firstname;
        if (validated.surname) updateData.surname = validated.surname;
        if (validated.othername !== undefined) updateData.othername = validated.othername;
        if (validated.birthday !== undefined) updateData.birthday = validated.birthday ? new Date(validated.birthday) : null;
        if (validated.bloodgroup !== undefined) updateData.bloodgroup = validated.bloodgroup;
        if (validated.gender) updateData.gender = validated.gender;
        if (validated.occupation !== undefined) updateData.occupation = validated.occupation;
        if (validated.religion !== undefined) updateData.religion = validated.religion;
        if (validated.state !== undefined) updateData.state = validated.state;
        if (validated.lga !== undefined) updateData.lga = validated.lga;
        if (validated.email) {
            updateData.email = validated.email;
            updateData.username = validated.username || validated.email;
        }
        if (validated.phone !== undefined) updateData.phone = validated.phone;
        if (validated.address !== undefined) updateData.address = validated.address;

        // Hash password if provided
        if (validated.password) {
            const hash = await bcrypt.hash(validated.password, 12);
            updateData.password = hash;
        }

        // Transactional update for students
        const result = await prisma.$transaction(async (tx) => {
            if (validated.students) {
                // Disconnect all and reconnect to match array
                await tx.parent.update({
                    where: { id },
                    data: { students: { set: validated.students.map((s) => ({ id: s })) } },
                });
            }

            const updated = await tx.parent.update({
                where: { id },
                data: updateData,
                include: {
                    students: {
                        select: {
                            id: true,
                            firstname: true,
                            othername: true,
                            surname: true,
                        },
                    },
                },
            });

            return updated;
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
        }
        console.error("Error updating parent:", error);
        return NextResponse.json({ error: "Failed to update parent" }, { status: 500 });
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
        const deleted = await prisma.parent.delete({ where: { id } });

        return NextResponse.json({ message: "Parent deleted", id: deleted.id });
    } catch (error) {
        console.error("Error deleting parent:", error);
        return NextResponse.json({ error: "Failed to delete parent" }, { status: 500 });
    }
}