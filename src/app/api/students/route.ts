import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getUserSchoolId } from '@/lib/utils';
import { studentSchema } from '@/lib/schemas';

/**
 * Generate a new admission number for a student.
 *
 * @param {string[]} existingAdmissions - An array of existing admission numbers.
 * @param {Date} currentDate - (Optional) Current date. Defaults to new Date().
 * @param {string} prefix - Prefix for the admission number (e.g., from school.regnumberprepend).
 * @returns {string} The newly generated admission number.
 */
const generateAdmissionNumber = (existingAdmissions: string[] = [], currentDate = new Date(), prefix: string = "HALL") => {
    const yearStr = currentDate.getFullYear().toString();
    const regex = new RegExp(`^${prefix}/${yearStr}/(\\d{5})$`);
    const sequences = existingAdmissions.reduce((acc: number[], admission: string) => {
        const match = admission.match(regex);
        if (match) {
            acc.push(parseInt(match[1], 10));
        }
        return acc;
    }, []);
    const baseSequence = 1;
    const nextSequence = sequences.length === 0 ? baseSequence : Math.max(...sequences) + 1;
    const paddedSequence = nextSequence.toString().padStart(5, '0');
    return `${prefix}/${yearStr}/${paddedSequence}`;
}

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

    if (session.user.role.toLowerCase() === 'teacher') {
        const teacher = await prisma.teacher.findUnique({
            where: { id: session.user.id },
            select: { classes: { where: { formmasterid: session.user.id }, select: { id: true } } },
        });
        if (teacher?.classes?.length) {
            where.classid = { in: teacher.classes.map(cls => cls.id) };
        } else {
            return NextResponse.json({ error: 'No assigned form master classes' }, { status: 403 });
        }
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
                submissions: true,
                grades: true,
                attendances: true,
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
        if (!session || !['super', 'admin', 'management', 'teacher'].includes(session.user.role.toLowerCase())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- VALIDATE REQUEST BODY ---
        const body = await request.json();
        const validated = studentSchema.parse(body);

        // --- ROLE-BASED VALIDATION ---
        if (session.user.role.toLowerCase() !== 'super') {
            const userSchoolId = await getUserSchoolId(session);
            if (!userSchoolId || validated.schoolid !== userSchoolId) {
                return NextResponse.json(
                    { error: 'You can only create students for your assigned school' },
                    { status: 403 }
                );
            }
        }

        if (session.user.role.toLowerCase() === 'teacher') {
            const teacher = await prisma.teacher.findUnique({
                where: { id: session.user.id },
                select: { classes: { where: { formmasterid: session.user.id }, select: { id: true } } },
            });
            if (!teacher?.classes.some(cls => cls.id === validated.classid)) {
                return NextResponse.json(
                    { error: 'You can only create students for your assigned form master class' },
                    { status: 403 }
                );
            }
        }

        // --- FETCH SCHOOL PREFIX ---
        const school = await prisma.school.findUnique({
            where: { id: validated.schoolid },
            select: { regnumberprepend: true },
        });

        if (!school) {
            return NextResponse.json(
                { error: 'School not found or regnumberprepend not defined' },
                { status: 400 }
            );
        }

        // --- CHECK CLASS CAPACITY ---
        const classDetails = await prisma.class.findUnique({
            where: { id: validated.classid },
            select: { capacity: true },
        });

        if (!classDetails) {
            return NextResponse.json(
                { error: 'Class not found' },
                { status: 400 }
            );
        }

        const studentCount = await prisma.student.count({
            where: { classid: validated.classid },
        });

        if (classDetails.capacity !== null && studentCount >= classDetails.capacity) {
            return NextResponse.json(
                { error: 'Class capacity reached. Cannot add more students.' },
                { status: 400 }
            );
        }

        // --- FETCH EXISTING ADMISSION NUMBERS ---
        const existingAdmissions = await prisma.student.findMany({
            where: { schoolid: validated.schoolid },
            select: { admissionnumber: true },
        });

        const admissionNumbers: string[] = existingAdmissions
            .map((student) => student.admissionnumber)
            .filter((num): num is string => num !== null);

        // --- GENERATE ADMISSION NUMBER ---
        const admissionNumber = generateAdmissionNumber(admissionNumbers, new Date(), school.regnumberprepend || '');

        // --- HASH PASSWORD ---
        const hashedPassword = validated.password
            ? await bcrypt.hash(validated.password, 12)
            : await bcrypt.hash('password', 12);

        // --- CREATE STUDENT ---
        const newStudent = await prisma.$transaction(async (tx) => {
            return tx.student.create({
                data: {
                    admissionnumber: admissionNumber,
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
        if (!session || !['super', 'admin', 'management', 'teacher'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- QUERY PARAMS ---
        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');
        if (ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // --- VALIDATE SCHOOL AND CLASS FOR NON-SUPER ROLES ---
        if (session.user.role.toLowerCase() !== 'super') {
            const userSchoolId = await getUserSchoolId(session);
            const students = await prisma.student.findMany({
                where: { id: { in: ids } },
                select: { schoolid: true, classid: true },
            });

            if (students.some(student => student.schoolid !== userSchoolId)) {
                return NextResponse.json(
                    { error: 'You can only delete students from your assigned school' },
                    { status: 403 }
                );
            }

            if (session.user.role.toLowerCase() === 'teacher') {
                const teacher = await prisma.teacher.findUnique({
                    where: { id: session.user.id },
                    select: { classes: { where: { formmasterid: session.user.id }, select: { id: true } } },
                });
                if (!teacher?.classes.some(cls => students.some(student => student.classid === cls.id))) {
                    return NextResponse.json(
                        { error: 'You can only delete students from your assigned form master class' },
                        { status: 403 }
                    );
                }
            }
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