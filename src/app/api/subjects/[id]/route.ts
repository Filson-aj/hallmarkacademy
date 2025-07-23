import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const subjectUpdateSchema = z.object({
    name: z.string().min(1, "Subject name is required").optional(),
    category: z.string().min(1, "Category is required").optional(),
    schoolid: z.string().min(1, "School ID is required").optional(),
    teachers: z.array(z.string()).optional(),
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

        const subject = await prisma.subject.findUnique({
            where: { id },
            include: {
                school: {
                    select: {
                        name: true,
                    }
                },
                teachers: {
                    select: {
                        id: true,
                        firstname: true,
                        surname: true,
                        title: true,
                    }
                },
                lessons: {
                    include: {
                        class: {
                            select: {
                                name: true,
                            }
                        },
                        teacher: {
                            select: {
                                firstname: true,
                                surname: true,
                                title: true,
                            }
                        }
                    }
                },
                assignments: {
                    select: {
                        id: true,
                        title: true,
                        duedate: true,
                        graded: true,
                    }
                },
                tests: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        testdate: true,
                    }
                },
                _count: {
                    select: {
                        teachers: true,
                        assignments: true,
                        lessons: true,
                        tests: true,
                    }
                }
            }
        });

        if (!subject) {
            return NextResponse.json(
                { error: "Subject not found" },
                { status: 404 }
            );
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
        if (!session || !["admin", "super", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = subjectUpdateSchema.parse(body);

        // Verify school exists if provided
        if (validatedData.schoolid) {
            const school = await prisma.school.findUnique({
                where: { id: validatedData.schoolid }
            });
            if (!school) {
                return NextResponse.json(
                    { error: "School not found" },
                    { status: 400 }
                );
            }
        }

        // Verify teachers exist if provided
        if (validatedData.teachers && validatedData.teachers.length > 0) {
            const teachersCount = await prisma.teacher.count({
                where: { id: { in: validatedData.teachers } }
            });
            if (teachersCount !== validatedData.teachers.length) {
                return NextResponse.json(
                    { error: "One or more teachers not found" },
                    { status: 400 }
                );
            }
        }

        const updateData: any = {};
        if (validatedData.name) updateData.name = validatedData.name;
        if (validatedData.category) updateData.category = validatedData.category;
        if (validatedData.schoolid) updateData.schoolid = validatedData.schoolid;

        if (validatedData.teachers !== undefined) {
            updateData.teachers = {
                set: validatedData.teachers.map(id => ({ id }))
            };
        }

        const updatedSubject = await prisma.subject.update({
            where: { id },
            data: updateData,
            include: {
                school: {
                    select: {
                        name: true,
                    }
                },
                teachers: {
                    select: {
                        id: true,
                        firstname: true,
                        surname: true,
                        title: true,
                    }
                },
                _count: {
                    select: {
                        teachers: true,
                        assignments: true,
                        lessons: true,
                        tests: true,
                    }
                }
            }
        });

        return NextResponse.json(updatedSubject);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
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
        if (!session || !["admin", "super", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Check if subject has lessons, assignments, or tests
        const [lessonsCount, assignmentsCount, testsCount] = await Promise.all([
            prisma.lesson.count({ where: { subjectid: id } }),
            prisma.assignment.count({ where: { subjectid: id } }),
            prisma.test.count({ where: { subjectid: id } }),
        ]);

        if (lessonsCount > 0 || assignmentsCount > 0 || testsCount > 0) {
            return NextResponse.json(
                { error: "Cannot delete subject with existing lessons, assignments, or tests" },
                { status: 400 }
            );
        }

        await prisma.subject.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Subject deleted successfully" });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete subject" },
            { status: 500 }
        );
    }
}