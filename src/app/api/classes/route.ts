import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';
import { classSchema } from '@/lib/schemas';

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

    const role = (session.user.role || '').toLowerCase() as UserRole;

    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const minimal = url.searchParams.get("minimal") === "true";

    const page = pageParam ? Math.max(parseInt(pageParam, 10) || 1, 1) : undefined;
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 0), 500) : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    // --- BUILD WHERE FILTER ---
    const where: Prisma.ClassWhereInput = {};

    try {
        if (role === UserRole.SUPER) {
            // super => no school filter, return all classes
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
            // return classes where teacher is the form master
            where.formmasterId = session.user.id;
        } else if (role === UserRole.STUDENT) {
            const student = await prisma.student.findUnique({
                where: { id: session.user.id },
                select: { classId: true },
            });
            if (student?.classId) {
                where.id = student.classId;
            } else {
                return NextResponse.json({ data: [], total: 0, message: 'No records found' });
            }
        } else if (role === UserRole.PARENT) {
            const children = await prisma.student.findMany({
                where: { parentId: session.user.id },
                select: { classId: true },
            });
            const childClassIds = children.map((c) => c.classId).filter(Boolean);
            if (childClassIds.length > 0) {
                where.id = { in: childClassIds };
            } else {
                return NextResponse.json({ data: [], total: 0, message: 'No records found' });
            }
        } else {
            return NextResponse.json({ data: [], total: 0, message: 'No records found' });
        }

        // --- DATA FETCH ---
        const classes = await (async () => {
            if (minimal) {
                return prisma.class.findMany({
                    where,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        level: true,
                        capacity: true,
                        section: true,
                        school: { select: { id: true, name: true } },
                        formmaster: {
                            select: { id: true, title: true, firstname: true, surname: true, othername: true },
                        },
                    },
                    orderBy: [
                        { name: 'asc' },
                        { createdAt: 'desc' },
                    ],
                });
            }

            return prisma.class.findMany({
                where,
                skip,
                take: limit,
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
        })();

        const total = await prisma.class.count({ where });

        const response: ClassResponse = {
            data: classes,
            total,
        };

        return NextResponse.json(response);
    } catch (err) {
        console.error('Error fetching classes:', err);
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
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
        const validated = classSchema.parse(body);

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

        // --- CHECK FOR DUPLICATE CLASS ---
        const exists = await prisma.class.findFirst({
            where: {
                name: validated.name,
                category: validated.category || '',
                schoolId: schoolId,
            },
        });
        if (exists) {
            return NextResponse.json({ error: 'Class already exists' }, { status: 409 });
        }

        // --- VALIDATE FORM MASTER ---
        if (validated.formmasterid) {
            const formMaster = await prisma.teacher.findUnique({
                where: { id: validated.formmasterid },
                select: { id: true, schoolId: true },
            });
            if (!formMaster) {
                return NextResponse.json({ error: 'Form master not found' }, { status: 400 });
            }
            if (formMaster.schoolId !== schoolId) {
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
                    capacity: validated.capacity ?? null,
                    section: validated.section || null,
                    formmasterId: validated.formmasterid || null,
                    schoolId: schoolId,
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
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        console.error('Error creating class:', error);
        return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
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

        let allowedIds = ids;

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
        return NextResponse.json({ error: 'Failed to delete classes' }, { status: 500 });
    }
}
