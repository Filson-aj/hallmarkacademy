import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { subjectSchema } from "@/lib/schemas";

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
        const subject = await prisma.subject.findUnique({
            where: { id },
            include: {
                school: {
                    select: { name: true },
                },
                teacher: {
                    select: {
                        id: true,
                        firstname: true,
                        othername: true,
                        surname: true,
                        title: true,
                    },
                },
                lessons: {
                    include: {
                        class: { select: { name: true } },
                        teacher: {
                            select: {
                                firstname: true,
                                surname: true,
                                title: true,
                            },
                        },
                    },
                },
                assignments: {
                    select: {
                        id: true,
                        title: true,
                        dueDate: true,
                        graded: true,
                    },
                },
                tests: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        testDate: true,
                    },
                },
                _count: {
                    select: {
                        assignments: true,
                        lessons: true,
                        tests: true,
                        studentGrades: true,
                    },
                },
            },
        });

        if (!subject) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }
        return NextResponse.json(subject);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch subject" },
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
        if (
            !session ||
            !["admin", "super", "management"].includes(session.user.role)
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validated = subjectSchema.parse(body);

        if (validated.schoolid) {
            const school = await prisma.school.findUnique({
                where: { id: validated.schoolid },
            });
            if (!school) {
                return NextResponse.json({ error: "School not found" }, { status: 400 });
            }
        }

        // optional: verify new teacher exists (or allow null)
        if (validated.teacherid) {
            const teacher = await prisma.teacher.findUnique({
                where: { id: validated.teacherid },
            });
            if (!teacher) {
                return NextResponse.json(
                    { error: "Teacher not found" },
                    { status: 400 }
                );
            }
        }

        const data: any = {};
        if (validated.name) data.name = validated.name;
        if (validated.category) data.category = validated.category;
        if (validated.schoolid) data.schoolid = validated.schoolid;
        if ("teacherid" in validated) {
            data.teacherid = validated.teacherid;
        }

        const updated = await prisma.subject.update({
            where: { id },
            data,
            include: {
                school: { select: { name: true } },
                teacher: {
                    select: {
                        id: true,
                        firstname: true,
                        othername: true,
                        surname: true,
                        title: true,
                    },
                },
                _count: {
                    select: {
                        lessons: true,
                        assignments: true,
                        tests: true,
                        studentGrades: true,
                    },
                },
            },
        });

        return NextResponse.json(updated);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: err.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to update subject" },
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
        if (
            !session ||
            !["admin", "super", "management"].includes(session.user.role)
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // ensure no related lessons/assignments/tests
        const [lessonCount, assignmentCount, testCount] = await Promise.all([
            prisma.lesson.count({ where: { subjectId: id } }),
            prisma.assignment.count({ where: { subjectId: id } }),
            prisma.test.count({ where: { subjectId: id } }),
        ]);

        if (lessonCount || assignmentCount || testCount) {
            return NextResponse.json(
                {
                    error:
                        "Cannot delete subject with existing lessons, assignments, or tests",
                },
                { status: 400 }
            );
        }

        await prisma.subject.delete({ where: { id } });
        return NextResponse.json({ message: "Subject deleted successfully" });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete subject" },
            { status: 500 }
        );
    }
}
