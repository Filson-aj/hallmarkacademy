import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { teacherSchema } from "@/lib/schemas";
import { getUserSchoolId } from "@/lib/utils";

export async function GET(request: NextRequest): Promise<NextResponse> {
    // --- AUTHORIZATION ---
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // --- QUERY PARAMS ---
    const url = new URL(request.url)
    const getParam = (key: string) => url.searchParams.get(key)?.trim() || undefined

    const paramSchoolId = getParam('schoolId')
    const subjectId = getParam('subjectId')
    const userSchoolId = await getUserSchoolId(session)

    // choose the explicit param over the user’s own school
    const schoolIdToUse = paramSchoolId ?? userSchoolId

    // --- BUILD WHERE FILTER ---
    const where: Prisma.TeacherWhereInput = {}

    if (schoolIdToUse) {
        const schoolid = typeof userSchoolId === "string"
            ? userSchoolId
            : Array.isArray(userSchoolId)
                ? userSchoolId[0]
                : "";
        where.schoolid = schoolid
    }
    if (subjectId) {
        where.subjects = { some: { id: subjectId } }
    }

    // --- DATA FETCH ---
    try {
        const teachers = await prisma.teacher.findMany({
            where,
            include: {
                subjects: true,
                school: true,
            },
            orderBy: [
                { surname: 'asc' },
                { createdAt: 'desc' },
            ],
        })

        return NextResponse.json({ data: teachers, total: teachers.length })
    } catch (err) {
        console.error('Error fetching teachers:', err)
        return NextResponse.json(
            { error: 'Failed to fetch teachers' },
            { status: 500 }
        )
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
                    othername: validated.othername,
                    birthday: new Date(validated.birthday),
                    bloodgroup: validated.bloodgroup || null,
                    gender: validated.gender,
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
