import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { lessonSchema } from "@/lib/schemas";

enum UserRole {
    SUPER = "super",
    ADMIN = "admin",
    MANAGEMENT = "management",
    TEACHER = "teacher",
    STUDENT = "student",
    PARENT = "parent",
}

interface ListResponse {
    data: any[];
    total: number;
    message?: string;
}

const emptyList = (message = "No records found"): ListResponse => ({
    data: [],
    total: 0,
    message,
});

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

        const role = (session.user.role || "").toLowerCase() as UserRole;
        if (![UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN].includes(role)) {
            return NextResponse.json({ error: "Access denied - You can't create subject" }, { status: 403 });
        }


        const body = await request.json();
        const validated = lessonSchema.parse(body);

        let schoolIdToUse: string;

        if (role === UserRole.SUPER) {
            // super must supply schoolid in payload
            if (!validated.schoolid) {
                return NextResponse.json({ error: "School ID is required" }, { status: 400 });
            }
            schoolIdToUse = validated.schoolid;
        } else {
            // management/admin: use their administration record for schoolid
            const admin = await prisma.administration.findUnique({
                where: { id: session.user.id },
                select: { schoolid: true },
            });
            if (!admin || !admin.schoolid) {
                return NextResponse.json({ error: "Access denied - No school record found" }, { status: 403 });
            }
            schoolIdToUse = admin.schoolid;
        }

        // Verify school exists
        const school = await prisma.school.findUnique({ where: { id: schoolIdToUse } });
        if (!school) {
            return NextResponse.json({ error: "School not found" }, { status: 400 });
        }


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
                    school: {
                        connect: { id: schoolIdToUse, }
                    }
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