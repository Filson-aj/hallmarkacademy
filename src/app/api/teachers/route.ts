import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { teacherSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Optionally filter by school or subject
        const { searchParams } = new URL(request.url);
        const schoolId = searchParams.get("schoolId");
        const subjectId = searchParams.get("subjectId");

        const where: Record<string, any> = {};
        if (schoolId) where.schoolid = schoolId;
        if (subjectId)
            where.subjects = { some: { id: subjectId } };

        const teachers = await prisma.teacher.findMany({
            where,
            include: {
                subjects: true,
                school: true,
            },
            orderBy: [
                { surname: "asc" },
                { createdAt: "desc" },
            ],
        });

        return NextResponse.json({ data: teachers, total: teachers.length });
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = teacherSchema.parse(body);

        if (!validated.password) {
            validated.password = "password";
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(validated.password, 12);

        const newTeacher = await prisma.$transaction(async (tx) => {
            return tx.teacher.create({
                data: {
                    username: validated.email,
                    title: validated.title,
                    firstname: validated.firstname,
                    surname: validated.surname,
                    othername: validated.othername || null,
                    birthday: new Date(validated.birthday),
                    bloodgroup: validated.bloodgroup || null,
                    gender: validated.sex,
                    state: validated.state,
                    lga: validated.lga,
                    email: validated.email,
                    phone: validated.phone || null,
                    address: validated.address,
                    avarta: validated.avarta || null,
                    password: hashedPassword,
                    schoolid: validated.schoolid,
                    subjects: {
                        connect: validated.subjects?.map((id) => ({ id })) || []
                    }
                },
                include: { subjects: true, school: true },
            });
        });

        return NextResponse.json(newTeacher, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error creating teacher:", error);
        return NextResponse.json(
            { error: "Failed to create teacher" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        const result = await prisma.teacher.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ deleted: result.count }, { status: 200 });
    } catch (error) {
        console.error("Error deleting teachers:", error);
        return NextResponse.json(
            { error: "Failed to delete teachers" },
            { status: 500 }
        );
    }
}
