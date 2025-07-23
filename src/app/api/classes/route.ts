import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { classSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

        switch (session.user.role) {
            case "teacher": {
                const lessons = await prisma.lesson.findMany({
                    where: { teacherid: session.user.id },
                    select: { classid: true },
                    distinct: ['classid'],
                });
                const classIds = lessons.map(l => l.classid);
                where.OR = where.OR || [];
                where.OR.push({ id: { in: classIds } }, { formmasterid: session.user.id });
                break;
            }
            case "student": {
                const student = await prisma.student.findUnique({
                    where: { id: session.user.id },
                    select: { classid: true },
                });
                if (student) where.id = student.classid;
                break;
            }
            case "parent": {
                const children = await prisma.student.findMany({
                    where: { parentid: session.user.id },
                    select: { classid: true },
                });
                const childClassIds = children.map(c => c.classid);
                where.id = { in: childClassIds };
                break;
            }
        }

        const classes = await prisma.class.findMany({
            where,
            include: {
                formmaster: {
                    select: { id: true, title: true, firstname: true, surname: true, othername: true },
                },
                _count: { select: { students: true, lessons: true } },
            },
            orderBy: [
                { name: "asc" },
                { createdAt: "desc" }
            ],
        });

        return NextResponse.json({ data: classes, total: classes.length });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["admin", "super", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = classSchema.parse(body);

        // Check duplicate
        const exists = await prisma.class.findFirst({
            where: { name: validated.name, category: validated.category },
        });
        if (exists) {
            return NextResponse.json({ error: "Class already exists" }, { status: 409 });
        }

        // Validate form master
        if (validated.formmasterid) {
            const fm = await prisma.teacher.findUnique({ where: { id: validated.formmasterid } });
            if (!fm) {
                return NextResponse.json({ error: "Form master not found" }, { status: 400 });
            }
        }

        const newClass = await prisma.class.create({
            data: {
                name: validated.name,
                category: validated.category,
                level: validated.level,
                capacity: validated.capacity || null,
                formmasterid: validated.formmasterid || null,
            },
            include: {
                formmaster: { select: { id: true, title: true, firstname: true, surname: true } },
                _count: { select: { students: true, lessons: true } },
            },
        });

        return NextResponse.json(newClass, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["admin", "super", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (!ids.length) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        // Fetch student counts for each class
        const counts = await prisma.class.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                _count: { select: { students: true } }
            }
        });

        // Partition into deletable vs. blocked
        const canDelete = counts.filter(c => c._count.students === 0).map(c => c.id);
        const blocked = counts.filter(c => c._count.students > 0).map(c => c.id);

        if (!canDelete.length) {
            return NextResponse.json(
                { error: "Cannot delete class(es) with students enrolled", blocked },
                { status: 400 }
            );
        }

        // Delete only those with zero students
        const result = await prisma.class.deleteMany({
            where: { id: { in: canDelete } }
        });

        return NextResponse.json({
            deleted: result.count,
            blocked,
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete classes" },
            { status: 500 }
        );
    }
}
