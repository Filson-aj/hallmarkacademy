import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const classSchema = z.object({
    name: z.string().min(1, "Class name is required"),
    category: z.string().min(1, "Category is required"),
    level: z.string().min(1, "Level is required"),
    capacity: z.number().int().min(1).optional(),
    formmasterid: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const level = searchParams.get("level");

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
                { level: { contains: search, mode: "insensitive" } },
            ];
        }
        if (level) where.level = level;

        // Role-based filtering
        let includeFormmaster = true;
        switch (session.user.role) {
            case "teacher":
                // Teachers can see classes they teach or are form masters of
                const teacherLessons = await prisma.lesson.findMany({
                    where: { teacherid: session.user.id },
                    select: { classid: true },
                    distinct: ['classid']
                });
                const classIds = teacherLessons.map(l => l.classid);
                where.OR = [
                    { id: { in: classIds } },
                    { formmasterid: session.user.id }
                ];
                break;
            case "student":
                // Students can only see their own class
                const student = await prisma.student.findUnique({
                    where: { id: session.user.id },
                    select: { classid: true }
                });
                if (student) {
                    where.id = student.classid;
                }
                break;
            case "parent":
                // Parents can see their children's classes
                const children = await prisma.student.findMany({
                    where: { parentid: session.user.id },
                    select: { classid: true }
                });
                const childClassIds = children.map(c => c.classid);
                where.id = { in: childClassIds };
                break;
            // admin, super, management can see all classes
        }

        const classes = await prisma.class.findMany({
            where,
            include: {
                formmaster: includeFormmaster ? {
                    select: {
                        id: true,
                        firstname: true,
                        surname: true,
                        title: true,
                    }
                } : false,
                _count: {
                    select: {
                        students: true,
                        lessons: true,
                    }
                }
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({
            data: classes,
            total: classes.length,
        });
    } catch (error) {
        console.error("Error fetching classes:", error);
        return NextResponse.json(
            { error: "Failed to fetch classes" },
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
        const validatedData = classSchema.parse(body);

        // Verify form master exists if provided
        if (validatedData.formmasterid) {
            const formmaster = await prisma.teacher.findUnique({
                where: { id: validatedData.formmasterid }
            });
            if (!formmaster) {
                return NextResponse.json(
                    { error: "Form master not found" },
                    { status: 400 }
                );
            }
        }

        const newClass = await prisma.class.create({
            data: {
                name: validatedData.name,
                category: validatedData.category,
                level: validatedData.level,
                capacity: validatedData.capacity,
                formmasterid: validatedData.formmasterid || null,
            },
            include: {
                formmaster: {
                    select: {
                        id: true,
                        firstname: true,
                        surname: true,
                        title: true,
                    }
                },
                _count: {
                    select: {
                        students: true,
                        lessons: true,
                    }
                }
            }
        });

        return NextResponse.json(newClass, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error creating class:", error);
        return NextResponse.json(
            { error: "Failed to create class" },
            { status: 500 }
        );
    }
}