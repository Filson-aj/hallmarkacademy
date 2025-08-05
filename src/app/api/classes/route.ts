import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';
import { classSchema } from '@/lib/schemas';
import { getUserSchoolId } from '@/lib/utils';

// response type
interface ClassResponse {
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

    // --- QUERY PARAMS ---
    const url = new URL(request.url);
    const getParam = (key: string) => url.searchParams.get(key)?.trim() || undefined;

    const search = getParam('search');
    const level = getParam('level');
    const userSchoolId = await getUserSchoolId(session);
    const role = session.user.role.toLowerCase() as UserRole;

    // --- BUILD WHERE FILTER ---
    const where: Prisma.ClassWhereInput = {};

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
            { level: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (level) {
        where.level = level;
    }

    // Apply school-level filtering for non-super users
    if (role !== UserRole.SUPER) {
        if (!userSchoolId) {
            return NextResponse.json(
                { error: 'Access denied - no school association found' },
                { status: 403 }
            );
        }
        where.schoolid = Array.isArray(userSchoolId) ? { in: userSchoolId } : userSchoolId;
    }

    // --- ROLE-BASED FILTERING ---
    switch (role) {
        case UserRole.TEACHER: {
            const lessons = await prisma.lesson.findMany({
                where: { teacherid: session.user.id },
                select: { classid: true },
                distinct: ['classid'],
            });
            const classIds = lessons.map((l) => l.classid);

            const teacherConditions = [
                { id: { in: classIds } },
                { formmasterid: session.user.id },
            ];

            if (where.OR) {
                where.AND = [{ OR: where.OR }, { OR: teacherConditions }];
                delete where.OR;
            } else {
                where.OR = teacherConditions;
            }
            break;
        }
        case UserRole.STUDENT: {
            const student = await prisma.student.findUnique({
                where: { id: session.user.id },
                select: { classid: true },
            });
            if (student?.classid) {
                where.id = student.classid;
            } else {
                return NextResponse.json({ data: [], total: 0 });
            }
            break;
        }
        case UserRole.PARENT: {
            const children = await prisma.student.findMany({
                where: { parentid: session.user.id },
                select: { classid: true },
            });
            const childClassIds = children.map((c) => c.classid).filter(Boolean);
            if (childClassIds.length > 0) {
                where.id = { in: childClassIds };
            } else {
                return NextResponse.json({ data: [], total: 0 });
            }
            break;
        }
        default:
            break;
    }

    // --- DATA FETCH ---
    try {
        const classes = await prisma.class.findMany({
            where,
            include: {
                school: { select: { id: true, name: true } },
                formmaster: {
                    select: { id: true, title: true, firstname: true, surname: true, othername: true },
                },
                _count: { select: { students: true, lessons: true } },
            },
            orderBy: [
                { name: 'asc' },
                { createdAt: 'desc' },
            ],
        });

        // Prepare response
        const response: ClassResponse = {
            data: classes,
            total: classes.length,
        };

        return NextResponse.json(response);
    } catch (err) {
        console.error('Error fetching classes:', err);
        return NextResponse.json(
            { error: 'Failed to fetch classes' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // --- AUTHORIZATION ---
        const session = await getServerSession(authOptions);
        if (!session || ![UserRole.ADMIN, UserRole.SUPER, UserRole.MANAGEMENT].includes(session.user.role.toLowerCase() as UserRole)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- VALIDATE REQUEST BODY ---
        const body = await request.json();
        const validated = classSchema.parse(body);
        const userSchoolId = await getUserSchoolId(session);

        // --- RESOLVE SCHOOL ID ---
        let schoolId: string;
        if (session.user.role.toLowerCase() !== UserRole.SUPER) {
            if (!userSchoolId) {
                return NextResponse.json(
                    { error: 'Access denied - no school association found' },
                    { status: 403 }
                );
            }

            if (Array.isArray(userSchoolId)) {
                schoolId = userSchoolId[0];
            } else {
                schoolId = userSchoolId;
            }
        } else {
            if (!validated.schoolid) {
                return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
            }
            schoolId = validated.schoolid;
        }

        // --- VALIDATE SCHOOL ---
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { id: true },
        });
        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        // --- CHECK FOR DUPLICATE CLASS ---
        const exists = await prisma.class.findFirst({
            where: {
                name: validated.name,
                category: validated.category || '',
                schoolid: schoolId,
            },
        });
        if (exists) {
            return NextResponse.json(
                { error: 'Class already exists' },
                { status: 409 }
            );
        }

        // --- VALIDATE FORM MASTER ---
        if (validated.formmasterid) {
            const formMaster = await prisma.teacher.findUnique({
                where: { id: validated.formmasterid },
                select: { id: true, schoolid: true },
            });
            if (!formMaster) {
                return NextResponse.json({ error: 'Form master not found' }, { status: 400 });
            }
            if (formMaster.schoolid !== schoolId) {
                return NextResponse.json(
                    { error: 'Invalid form master - form master must belong to the same school' },
                    { status: 400 }
                );
            }
        }

        // --- CREATE CLASS ---
        const newClass = await prisma.$transaction(async (tx) => {
            return tx.class.create({
                data: {
                    name: validated.name,
                    category: validated.category || '',
                    level: validated.level,
                    capacity: validated.capacity || null,
                    formmasterid: validated.formmasterid || null,
                    schoolid: schoolId,
                },
                include: {
                    school: { select: { id: true, name: true } },
                    formmaster: {
                        select: { id: true, title: true, firstname: true, surname: true, othername: true },
                    },
                    _count: { select: { students: true, lessons: true } },
                },
            });
        });

        return NextResponse.json(newClass, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Error creating class:', error);
        return NextResponse.json(
            { error: 'Failed to create class' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        // --- AUTHORIZATION ---
        const session = await getServerSession(authOptions);
        if (!session || ![UserRole.ADMIN, UserRole.SUPER, UserRole.MANAGEMENT].includes(session.user.role.toLowerCase() as UserRole)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- QUERY PARAMS ---
        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');
        if (ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
        }

        const userSchoolId = await getUserSchoolId(session);

        // --- FILTER ALLOWED IDS ---
        let allowedIds = ids;
        if (session.user.role.toLowerCase() !== UserRole.SUPER) {
            if (!userSchoolId) {
                return NextResponse.json(
                    { error: 'Access denied - no school association found' },
                    { status: 403 }
                );
            }

            const userClasses = await prisma.class.findMany({
                where: {
                    id: { in: ids },
                    schoolid: Array.isArray(userSchoolId) ? { in: userSchoolId } : userSchoolId,
                },
                select: { id: true },
            });

            allowedIds = userClasses.map((cls) => cls.id);
            if (allowedIds.length === 0) {
                return NextResponse.json(
                    { error: 'Access denied - you can only delete classes from your school' },
                    { status: 403 }
                );
            }
        }

        // --- CHECK FOR ENROLLED STUDENTS ---
        const counts = await prisma.class.findMany({
            where: { id: { in: allowedIds } },
            select: {
                id: true,
                name: true,
                _count: { select: { students: true } },
            },
        });

        const canDelete = counts.filter((c) => c._count.students === 0).map((c) => c.id);
        const blocked = counts
            .filter((c) => c._count.students > 0)
            .map((c) => ({
                id: c.id,
                name: c.name,
                studentCount: c._count.students,
            }));

        if (!canDelete.length) {
            return NextResponse.json(
                {
                    error: 'Cannot delete class(es) with students enrolled',
                    blocked,
                    message: 'All selected classes have enrolled students',
                },
                { status: 400 }
            );
        }

        // --- DELETE CLASSES ---
        const result = await prisma.class.deleteMany({
            where: { id: { in: canDelete } },
        });

        return NextResponse.json({
            deleted: result.count,
            blocked,
            message: blocked.length > 0
                ? `Deleted ${result.count} classes. ${blocked.length} classes could not be deleted due to enrolled students.`
                : `Successfully deleted ${result.count} classes.`,
        });
    } catch (error) {
        console.error('Error deleting classes:', error);
        return NextResponse.json(
            { error: 'Failed to delete classes' },
            { status: 500 }
        );
    }
}