import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { lessonSchema } from "@/lib/schemas";

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
        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
        }

        const lesson = await prisma.lesson.findUnique({
            where: { id: Number(id) },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                teacher: {
                    select: {
                        id: true,
                        firstname: true,
                        surname: true,
                    },
                },
            },
        });

        if (!lesson) {
            return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: lesson.id,
            name: lesson.name,
            day: lesson.day,
            startTime: lesson.startTime.toISOString(),
            endTime: lesson.endTime.toISOString(),
            classid: lesson.classid,
            teacherid: lesson.teacherid,
            subjectid: lesson.subjectid,
            subject: lesson.subject,
            class: lesson.class,
            teacher: lesson.teacher,
        });
    } catch (error) {
        console.error("Error fetching lesson:", error);
        return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 });
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
        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
        }

        const body = await request.json();
        const validated = lessonSchema.parse(body);

        const updateData: any = {};
        if (validated.name) updateData.name = validated.name;
        if (validated.day) updateData.day = validated.day;
        if (validated.startTime) updateData.startTime = new Date(validated.startTime);
        if (validated.endTime) updateData.endTime = new Date(validated.endTime);
        if (validated.subjectid) updateData.subject = { connect: { id: validated.subjectid } };
        if (validated.classid) updateData.class = { connect: { id: validated.classid } };
        if (validated.teacherid) updateData.teacher = { connect: { id: validated.teacherid } };

        const updatedLesson = await prisma.$transaction(async (tx) => {
            const lesson = await tx.lesson.findUnique({
                where: { id: Number(id) },
            });
            if (!lesson) {
                throw new Error("Lesson not found");
            }

            return tx.lesson.update({
                where: { id: Number(id) },
                data: updateData,
                include: {
                    subject: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    class: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    teacher: {
                        select: {
                            id: true,
                            firstname: true,
                            surname: true,
                        },
                    },
                },
            });
        });

        return NextResponse.json({
            id: updatedLesson.id,
            name: updatedLesson.name,
            day: updatedLesson.day,
            startTime: updatedLesson.startTime.toISOString(),
            endTime: updatedLesson.endTime.toISOString(),
            classid: updatedLesson.classid,
            teacherid: updatedLesson.teacherid,
            subjectid: updatedLesson.subjectid,
            subject: updatedLesson.subject,
            class: updatedLesson.class,
            teacher: updatedLesson.teacher,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error updating lesson:", error);
        return NextResponse.json(
            { error: "Failed to update lesson" },
            { status: error instanceof Error && error.message === "Lesson not found" ? 404 : 500 }
        );
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
        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
        }

        const deleted = await prisma.lesson.delete({
            where: { id: Number(id) },
        });

        return NextResponse.json({ message: "Lesson deleted", id: deleted.id });
    } catch (error) {
        console.error("Error deleting lesson:", error);
        return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
    }
}