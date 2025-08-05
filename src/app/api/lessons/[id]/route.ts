import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { lessonSchema } from "@/lib/schemas";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = params.id;
        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
        }

        const lesson = await prisma.lesson.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                name: true,
                day: true,
                startTime: true,
                endTime: true,
                classid: true,
                teacherid: true,
                subjectid: true,
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
            success: true,
            lesson: {
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
            },
        });
    } catch (error) {
        console.error("Error fetching lesson:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch lesson",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = params.id;
        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
        }

        const body = await request.json();
        const validated = lessonSchema.parse(body);

        const updatedLesson = await prisma.$transaction(async (tx) => {
            const lesson = await tx.lesson.findUnique({
                where: { id: Number(id) },
            });
            if (!lesson) {
                throw new Error("Lesson not found");
            }

            return tx.lesson.update({
                where: { id: Number(id) },
                data: {
                    name: validated.name,
                    day: validated.day,
                    startTime: new Date(validated.startTime),
                    endTime: new Date(validated.endTime),
                    subject: {
                        connect: { id: validated.subjectid },
                    },
                    class: {
                        connect: { id: validated.classid },
                    },
                    teacher: {
                        connect: { id: validated.teacherid },
                    },
                },
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
            success: true,
            lesson: {
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
            },
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
            {
                error: "Failed to update lesson",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: error instanceof Error && error.message === "Lesson not found" ? 404 : 500 }
        );
    }
}