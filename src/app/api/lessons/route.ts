import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { lessonSchema } from "@/lib/schemas";

export async function GET(request: NextRequest): Promise<NextResponse> {
    // --- AUTHORIZATION ---
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- QUERY PARAMS ---
    const url = new URL(request.url);
    const getParam = (key: string) => url.searchParams.get(key)?.trim() || undefined;

    const classId = getParam("classId");
    const teacherId = getParam("teacherId");
    const subjectId = getParam("subjectId");

    // --- BUILD WHERE FILTER ---
    const where: Prisma.LessonWhereInput = {};

    if (classId) {
        where.classid = classId;
    }
    if (teacherId) {
        where.teacherid = teacherId;
    }
    if (subjectId) {
        where.subjectid = subjectId;
    }

    // --- DATA FETCH ---
    try {
        const lessons = await prisma.lesson.findMany({
            where,
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
            orderBy: [
                { day: "asc" },
                { startTime: "asc" },
            ],
        });

        return NextResponse.json({ data: lessons, total: lessons.length });
    } catch (err) {
        console.error("Error fetching lessons:", err);
        return NextResponse.json(
            { error: "Failed to fetch lessons" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management", "teacher"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = lessonSchema.parse(body);

        const newLesson = await prisma.$transaction(async (tx) => {
            return tx.lesson.create({
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

        return NextResponse.json(newLesson, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error creating lesson:", error);
        return NextResponse.json(
            { error: "Failed to create lesson" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management", "teacher"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        const result = await prisma.lesson.deleteMany({
            where: { id: { in: ids.map(Number) } },
        });

        return NextResponse.json({ deleted: result.count }, { status: 200 });
    } catch (error) {
        console.error("Error deleting lessons:", error);
        return NextResponse.json(
            { error: "Failed to delete lessons" },
            { status: 500 }
        );
    }
}