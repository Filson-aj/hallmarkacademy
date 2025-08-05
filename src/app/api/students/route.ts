import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getUserSchoolId } from '@/lib/utils';
import { studentSchema } from '@/lib/schemas';

// response type
interface StudentResponse {
    data: any[];
    total: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    // --- AUTHORIZATION ---
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- QUERY PARAMS ---
    const url = new URL(request.url);
    const getParam = (key: string) => url.searchParams.get(key)?.trim() || undefined;

    const search = getParam('search');
    const paramClassId = getParam('classid');
    const paramSchoolId = getParam('schoolid');
    const userSchoolId = await getUserSchoolId(session);

    // Choose explicit schoolId over user's school
    const schoolIdToUse = paramSchoolId ?? userSchoolId;

    // --- BUILD WHERE FILTER ---
    const where: Prisma.StudentWhereInput = {};

    if (schoolIdToUse) {
        const schoolId = typeof schoolIdToUse === 'string'
            ? schoolIdToUse
            : Array.isArray(schoolIdToUse)
                ? schoolIdToUse[0]
                : '';
        where.schoolid = schoolId;
    }

    if (search) {
        where.OR = [
            { firstname: { contains: search, mode: 'insensitive' } },
            { surname: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { admissionnumber: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (paramClassId) {
        where.classid = paramClassId;
    }

    // --- DATA FETCH ---
    try {
        const students = await prisma.student.findMany({
            where,
            include: {
                class: true,
                parent: true,
                school: { select: { name: true } },
            },
            orderBy: [
                { surname: 'asc' },
                { createdAt: 'desc' },
            ],
        });

        // Prepare response
        const response: StudentResponse = {
            data: students,
            total: students.length,
        };

        return NextResponse.json(response);
    } catch (err) {
        console.error('Error fetching students:', err);
        return NextResponse.json(
            { error: 'Failed to fetch students' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // --- AUTHORIZATION ---
        const session = await getServerSession(authOptions);
        const role = session?.user.role.toLowerCase();
        if (!session || !['super', 'admin', 'management'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- VALIDATE REQUEST BODY ---
        const body = await request.json();
        const validated = studentSchema.parse(body);

        // --- HASH PASSWORD ---
        const hashedPassword = validated.password
            ? await bcrypt.hash(validated.password, 12)
            : await bcrypt.hash('password', 12);

        // --- CREATE STUDENT ---
        const newStudent = await prisma.$transaction(async (tx) => {
            return tx.student.create({
                data: {
                    admissionnumber: validated.admissionnumber,
                    firstname: validated.firstname,
                    surname: validated.surname,
                    othername: validated.othername || null,
                    birthday: new Date(validated.birthday),
                    gender: validated.gender,
                    religion: validated.religion || null,
                    studenttype: validated.studenttype,
                    house: validated.house,
                    bloodgroup: validated.bloodgroup,
                    email: validated.email,
                    phone: validated.phone || null,
                    address: validated.address,
                    state: validated.state,
                    lga: validated.lga,
                    avarta: validated.avarta || null,
                    password: hashedPassword,
                    parentid: validated.parentid,
                    schoolid: validated.schoolid,
                    classid: validated.classid,
                },
                include: {
                    class: true,
                    parent: true,
                    school: { select: { name: true } },
                },
            });
        });

        return NextResponse.json(newStudent, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error creating student:', error);
        return NextResponse.json(
            { error: 'Failed to create student' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        // --- AUTHORIZATION ---
        const session = await getServerSession(authOptions);
        if (!session || !['super', 'admin', 'management'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- QUERY PARAMS ---
        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');
        if (ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // --- DELETE STUDENTS ---
        const result = await prisma.student.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ deleted: result.count }, { status: 200 });
    } catch (error) {
        console.error('Error deleting students:', error);
        return NextResponse.json(
            { error: 'Failed to delete students' },
            { status: 500 }
        );
    }
}