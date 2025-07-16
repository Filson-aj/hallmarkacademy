import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const subjectSchema = z.object({
    name: z.string().min(1, "Subject name is required"),
    category: z.string().min(1, "Category is required"),
    schoolid: z.string().min(1, "School ID is required"),
    teachers: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const category = searchParams.get("category");
        const schoolid = searchParams.get("schoolid");

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
            ];
        }
        if (category) where.category = category;
        if (schoolid) where.schoolid = schoolid;

        // Role-based filtering
        switch (session.user.role) {
            case "teacher":
                // Teachers can see subjects they teach
                where.teachers = {
                    some: { id: session.user.id }
                };
                break;
            case "student":
                // Students can see subjects for their class
                const student = await prisma.student.findUnique({
                    where: { id: session.user.id },
                    select: { classid: true }
                });
                if (student) {
                    where.lessons = {
                        some: { classid: student.classid }
                    };
                }
                break;
            case "parent":
                // Parents can see subjects for their children's classes
                const children = await prisma.student.findMany({
                    where: { parentid: session.user.id },
                    select: { classid: true }
                });
                const childClassIds = children.map(c => c.classid);
                where.lessons = {
                    some: { classid: { in: childClassIds } }
                };
                break;
            // admin, super, management can see all subjects
        }

        const subjects = await prisma.subject.findMany({
            where,
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
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({
            data: subjects,
            total: subjects.length,
        });
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return NextResponse.json(
            { error: "Failed to fetch subjects" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["admin", "super", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = subjectSchema.parse(body);

        // Verify school exists
        const school = await prisma.school.findUnique({
            where: { id: validatedData.schoolid }
        });
        if (!school) {
            return NextResponse.json(
                { error: "School not found" },
                { status: 400 }
            );
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

        const newSubject = await prisma.subject.create({
            data: {
                name: validatedData.name,
                category: validatedData.category,
                schoolid: validatedData.schoolid,
                teachers: validatedData.teachers ? {
                    connect: validatedData.teachers.map(id => ({ id }))
                } : undefined,
            },
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

        return NextResponse.json(newSubject, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error creating subject:", error);
        return NextResponse.json(
            { error: "Failed to create subject" },
            { status: 500 }
        );
    }
}