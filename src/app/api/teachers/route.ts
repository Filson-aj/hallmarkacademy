import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { teacherSchema } from "@/lib/schemas";

// response type
interface TeacherResponse {
    data: any[];
    total: number;
}

// role enum
enum UserRole {
    SUPER = 'super',
    ADMIN = 'admin',
    MANAGEMENT = 'management',
    TEACHER = 'teacher',
    STUDENT = 'student',
    PARENT = 'parent',
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    // --- AUTHORIZATION ---
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user.role || '').toLowerCase() as UserRole;

    // --- BUILD WHERE FILTER ---
    const where: Prisma.TeacherWhereInput = {};

    try {
        if (role === UserRole.SUPER) {
            // super can access all teachers
        } else if (role === UserRole.ADMIN || role === UserRole.MANAGEMENT) {
            // retrieve schoolId from Administration record
            const admin = await prisma.administration.findUnique({
                where: { id: session.user.id },
                select: { schoolId: true },
            });
            if (!admin || !admin.schoolId) {
                return NextResponse.json({ data: [], total: 0, message: 'No records found' });
            }
            where.schoolId = admin.schoolId;
        } else if (role === UserRole.TEACHER) {
            // teachers can only access their own record
            where.id = session.user.id;
        } else if (role === UserRole.STUDENT) {
            // students can access teachers of their class
            const student = await prisma.student.findUnique({
                where: { id: session.user.id },
                select: { classId: true },
            });
            if (student?.classId) {
                where.classes = { some: { id: student.classId } };
            } else {
                return NextResponse.json({ data: [], total: 0, message: 'No records found' });
            }
        } else if (role === UserRole.PARENT) {
            // parents can access teachers of their children's classes
            const children = await prisma.student.findMany({
                where: { parentId: session.user.id },
                select: { classId: true },
            });
            const childClassIds = children.map((c) => c.classId).filter(Boolean);
            if (childClassIds.length > 0) {
                where.classes = { some: { id: { in: childClassIds } } };
            } else {
                return NextResponse.json({ data: [], total: 0, message: 'No records found' });
            }
        } else {
            return NextResponse.json({ data: [], total: 0, message: 'No records found' });
        }

        // --- DATA FETCH ---
        const teachers = await prisma.teacher.findMany({
            where,
            include: {
                subjects: { select: { id: true, name: true } },
                school: { select: { id: true, name: true } },
                _count: { select: { classes: true, subjects: true, lessons: true } },
            },
            orderBy: [
                { surname: 'asc' },
                { createdAt: 'desc' },
            ],
        });

        const response: TeacherResponse = {
            data: teachers,
            total: teachers.length,
        };

        return NextResponse.json(response);
    } catch (err) {
        console.error('Error fetching teachers:', err);
        return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // --- AUTHORIZATION ---
        const session = await getServerSession(authOptions);
        if (!session || ![UserRole.ADMIN, UserRole.SUPER, UserRole.MANAGEMENT].includes((session.user.role || '').toLowerCase() as UserRole)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- VALIDATE REQUEST BODY ---
        const body = await request.json();
        const validated = teacherSchema.parse(body);

        // --- RESOLVE SCHOOL ID ---
        let schoolId: string;
        const role = (session.user.role || '').toLowerCase() as UserRole;

        if (role === UserRole.SUPER) {
            // super must supply schoolId in payload
            if (!validated.schoolid) {
                return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
            }
            schoolId = validated.schoolid;
        } else {
            // admin / management: fetch their administration record for schoolId
            const admin = await prisma.administration.findUnique({
                where: { id: session.user.id },
                select: { schoolId: true },
            });
            if (!admin || !admin.schoolId) {
                return NextResponse.json(
                    { error: 'Access denied - No school record found' },
                    { status: 403 }
                );
            }
            schoolId = admin.schoolId;
        }

        // --- VALIDATE SCHOOL ---
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { id: true },
        });
        if (!school) {
            return NextResponse.json({ error: 'School record not found' }, { status: 404 });
        }

        // --- CHECK FOR DUPLICATE TEACHER ---
        const exists = await prisma.teacher.findFirst({
            where: {
                OR: [
                    { email: validated.email },
                    validated.phone ? { phone: validated.phone } : {},
                ],
                schoolId: schoolId,
            },
        });
        if (exists) {
            return NextResponse.json(
                { error: 'Teacher with this email, or phone already exists' },
                { status: 409 }
            );
        }

        // --- HASH PASSWORD ---
        const password = validated.password || 'password';
        const hashedPassword = await bcrypt.hash(password, 12);

        // --- CREATE TEACHER ---
        const newTeacher = await prisma.$transaction(async (tx) => {
            return tx.teacher.create({
                data: {
                    username: validated.email,
                    title: validated.title,
                    firstname: validated.firstname,
                    surname: validated.surname,
                    othername: validated.othername,
                    birthday: validated.birthday ? new Date(validated.birthday) : null,
                    bloodgroup: validated.bloodgroup || null,
                    gender: validated.gender,
                    state: validated.state || null,
                    lga: validated.lga || null,
                    email: validated.email,
                    phone: validated.phone || null,
                    address: validated.address || null,
                    avatar: validated.avarta || null,
                    password: hashedPassword,
                    schoolId: schoolId,
                    subjects: {
                        connect: validated.subjects?.map((id) => ({ id })) || [],
                    },
                },
                include: {
                    subjects: { select: { id: true, name: true } },
                    school: { select: { id: true, name: true } },
                    _count: { select: { classes: true, subjects: true, lessons: true } },
                },
            });
        });

        return NextResponse.json(newTeacher, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error creating teacher:', error);
        return NextResponse.json({ error: 'Failed to create teacher' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        // --- AUTHORIZATION ---
        const session = await getServerSession(authOptions);
        if (!session || ![UserRole.ADMIN, UserRole.SUPER, UserRole.MANAGEMENT].includes((session.user.role || '').toLowerCase() as UserRole)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- QUERY PARAMS ---
        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');
        if (ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        // --- CHECK TEACHER RELATIONSHIPS ---
        const counts = await prisma.teacher.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                surname: true,
                firstname: true,
                title: true,
                _count: {
                    select: {
                        classes: true,
                        subjects: true,
                        lessons: true,
                        assignments: true,
                        tests: true,
                    },
                },
                classes: { select: { id: true, name: true } },
                subjects: { select: { id: true, name: true } },
                lessons: { select: { id: true, name: true } },
                assignments: { select: { id: true, title: true } },
                tests: { select: { id: true, title: true } },
            },
        });

        const canDelete = counts
            .filter(
                (t) =>
                    t._count.classes === 0 &&
                    t._count.subjects === 0 &&
                    t._count.lessons === 0 &&
                    t._count.assignments === 0 &&
                    t._count.tests === 0
            )
            .map((t) => t.id);

        const blocked = counts
            .filter(
                (t) =>
                    t._count.classes > 0 ||
                    t._count.subjects > 0 ||
                    t._count.lessons > 0 ||
                    t._count.assignments > 0 ||
                    t._count.tests > 0
            )
            .map((t) => ({
                id: t.id,
                name: `${t.title} ${t.firstname} ${t.surname}`,
                relationships: {
                    classes: t.classes.map((c) => ({ id: c.id, name: c.name })),
                    subjects: t.subjects.map((s) => ({ id: s.id, name: s.name })),
                    lessons: t.lessons.map((l) => ({ id: l.id, name: l.name })),
                    assignments: t.assignments.map((a) => ({ id: a.id, title: a.title })),
                    tests: t.tests.map((test) => ({ id: test.id, title: test.title })),
                },
            }));

        if (!canDelete.length) {
            return NextResponse.json(
                {
                    error: 'Cannot delete teacher(s) with active relationships',
                    blocked,
                    message: 'All selected teachers have active relationships with classes, subjects, lessons, assignments, or tests. Please reassign or remove these relationships before deleting.',
                },
                { status: 400 }
            );
        }

        // --- DELETE TEACHERS ---
        const result = await prisma.$transaction(async (tx) => {
            return tx.teacher.deleteMany({
                where: { id: { in: canDelete } },
            });
        });

        return NextResponse.json({
            deleted: result.count,
            blocked,
            message: blocked.length > 0
                ? `Deleted ${result.count} teachers. ${blocked.length} teachers could not be deleted due to active relationships.`
                : `Successfully deleted ${result.count} teachers.`,
        });
    } catch (error) {
        console.error('Error deleting teachers:', error);
        return NextResponse.json({ error: 'Failed to delete teachers' }, { status: 500 });
    }
}