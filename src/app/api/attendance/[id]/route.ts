import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const attendanceUpdateSchema = z.object({
    present: z.boolean(),
    date: z.string().datetime().optional(),
});

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

        const attendance = await prisma.attendance.findUnique({
            where: { id: parseInt(id) },
            include: {
                student: {
                    select: {
                        id: true,
                        firstname: true,
                        surname: true,
                        admissionnumber: true,
                        class: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                lesson: {
                    select: {
                        name: true,
                        subject: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!attendance) {
            return NextResponse.json(
                { error: "Attendance record not found" },
                { status: 404 }
            );
        }

        // Role-based access control
        switch (session.user.role) {
            case "student":
                if (attendance.studentId !== session.user.id) {
                    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
                }
                break;
            case "parent":
                const student = await prisma.student.findUnique({
                    where: { id: attendance.studentId },
                    select: { parentid: true }
                });
                if (student?.parentid !== session.user.id) {
                    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
                }
                break;
            case "teacher":
                const lesson = await prisma.lesson.findUnique({
                    where: { id: attendance.lessonId },
                    select: { teacherid: true }
                });
                if (lesson?.teacherid !== session.user.id) {
                    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
                }
                break;
            // admin, super, management can access all
        }

        return NextResponse.json(attendance);
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return NextResponse.json(
            { error: "Failed to fetch attendance record" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["admin", "super", "management", "teacher"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = attendanceUpdateSchema.parse(body);

        const updateData: any = {
            present: validatedData.present,
        };

        if (validatedData.date) {
            updateData.date = new Date(validatedData.date);
        }

        const attendance = await prisma.attendance.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                student: {
                    select: {
                        firstname: true,
                        surname: true,
                        admissionnumber: true
                    }
                },
                lesson: {
                    select: {
                        name: true,
                        subject: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(attendance);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error updating attendance:", error);
        return NextResponse.json(
            { error: "Failed to update attendance record" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["admin", "super", "management", "teacher"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await prisma.attendance.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Attendance record deleted successfully" });
    } catch (error) {
        console.error("Error deleting attendance:", error);
        return NextResponse.json(
            { error: "Failed to delete attendance record" },
            { status: 500 }
        );
    }
}