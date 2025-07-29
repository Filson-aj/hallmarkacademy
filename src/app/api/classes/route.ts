import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { classSchema } from "@/lib/schemas";
import { getUserSchoolId } from "@/lib/utils";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const level = searchParams.get("level");

        const userSchoolId = await getUserSchoolId(session);

        // Build the base where clause with school filtering
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
                { level: { contains: search, mode: "insensitive" } },
            ];
        }
        if (level) where.level = level;

        // Apply school-level filtering for non-super users
        if (session.user.role.toLowerCase() !== 'super') {
            if (!userSchoolId) {
                return NextResponse.json({
                    error: "Access denied - no school association found"
                }, { status: 403 });
            }

            // For parents who might have children in multiple schools
            if (Array.isArray(userSchoolId)) {
                where.schoolid = { in: userSchoolId };
            } else {
                where.schoolid = userSchoolId;
            }
        }

        // Apply role-specific filtering within the school
        switch (session.user.role.toLowerCase()) {
            case "teacher": {
                // Teachers can see classes they teach or are form masters of
                const lessons = await prisma.lesson.findMany({
                    where: { teacherid: session.user.id },
                    select: { classid: true },
                    distinct: ['classid'],
                });
                const classIds = lessons.map(l => l.classid);

                // Combine with existing OR conditions or create new ones
                const teacherConditions = [
                    { id: { in: classIds } },
                    { formmasterid: session.user.id }
                ];

                if (where.OR) {
                    // If there are existing OR conditions (from search), we need to combine them properly
                    where.AND = [
                        { OR: where.OR }, // Search conditions
                        { OR: teacherConditions } // Teacher access conditions
                    ];
                    delete where.OR;
                } else {
                    where.OR = teacherConditions;
                }
                break;
            }
            case "student": {
                const student = await prisma.student.findUnique({
                    where: { id: session.user.id },
                    select: { classid: true },
                });
                if (student) {
                    where.id = student.classid;
                } else {
                    // Student not found, return empty result
                    return NextResponse.json({ data: [], total: 0 });
                }
                break;
            }
            case "parent": {
                const children = await prisma.student.findMany({
                    where: { parentid: session.user.id },
                    select: { classid: true },
                });
                const childClassIds = children.map(c => c.classid);
                if (childClassIds.length > 0) {
                    where.id = { in: childClassIds };
                } else {
                    // Parent has no children, return empty result
                    return NextResponse.json({ data: [], total: 0 });
                }
                break;
            }
            // For super, management, and admin roles, no additional filtering needed
        }

        const classes = await prisma.class.findMany({
            where,
            include: {
                school: {
                    select: {
                        id: true,
                        name: true
                    }
                },
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
        console.error("Error fetching classes:", error);
        return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["admin", "super", "management"].includes(session.user.role.toLowerCase())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = classSchema.parse(body);

        const userSchoolId = await getUserSchoolId(session);

        // Assign schoolid based on user role and permissions
        let schoolId: string;
        if (session.user.role.toLowerCase() !== 'super') {
            if (!userSchoolId) {
                return NextResponse.json({
                    error: "Access denied - no school association found"
                }, { status: 403 });
            }

            if (Array.isArray(userSchoolId)) {
                // Use the first school ID if multiple are associated (or validate against validated.schoolid)
                if (!validated.schoolid || !userSchoolId.includes(validated.schoolid)) {
                    return NextResponse.json({
                        error: "Access denied - you can only create classes for your associated schools"
                    }, { status: 403 });
                }
                schoolId = validated.schoolid;
            } else {
                if (validated.schoolid && validated.schoolid !== userSchoolId) {
                    return NextResponse.json({
                        error: "Access denied - you can only create classes for your school"
                    }, { status: 403 });
                }
                schoolId = userSchoolId;
            }
        } else {
            // For super users, schoolid must be provided in the request body
            if (!validated.schoolid) {
                return NextResponse.json({
                    error: "School ID is required"
                }, { status: 400 });
            }
            schoolId = validated.schoolid;
        }

        // Verify the school exists
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { id: true }
        });

        if (!school) {
            return NextResponse.json({
                error: "School not found"
            }, { status: 404 });
        }

        // Check duplicate within the same school
        const exists = await prisma.class.findFirst({
            where: {
                name: validated.name,
                category: validated.category || "", // Provide default empty string if undefined
                schoolid: schoolId
            },
        });
        if (exists) {
            return NextResponse.json({ error: "Class already exists in this school" }, { status: 409 });
        }

        // Validate form master belongs to the same school
        if (validated.formmasterid) {
            const fm = await prisma.teacher.findUnique({
                where: { id: validated.formmasterid },
                select: { id: true, schoolid: true }
            });
            if (!fm) {
                return NextResponse.json({ error: "Form master not found" }, { status: 400 });
            }
            if (fm.schoolid !== schoolId) {
                return NextResponse.json({
                    error: "Form master must belong to the same school"
                }, { status: 400 });
            }
        }

        const newClass = await prisma.class.create({
            data: {
                name: validated.name,
                category: validated.category || "", // Provide default empty string if undefined
                level: validated.level,
                capacity: validated.capacity || null,
                formmasterid: validated.formmasterid || null,
                schoolid: schoolId,
            },
            include: {
                school: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                formmaster: {
                    select: { id: true, title: true, firstname: true, surname: true, othername: true }
                },
                _count: { select: { students: true, lessons: true } },
            },
        });

        return NextResponse.json(newClass, { status: 201 });
    } catch (error) {
        console.error("Error creating class:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: "Validation failed",
                details: error.errors
            }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["admin", "super", "management"].includes(session.user.role.toLowerCase())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (!ids.length) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        const userSchoolId = await getUserSchoolId(session);

        // Filter IDs based on user role and permissions
        let allowedIds = ids;

        if (session.user.role.toLowerCase() !== 'super') {
            if (!userSchoolId) {
                return NextResponse.json({
                    error: "Access denied - no school association found"
                }, { status: 403 });
            }

            // Get classes that belong to user's school(s)
            const userClasses = await prisma.class.findMany({
                where: {
                    id: { in: ids },
                    schoolid: Array.isArray(userSchoolId)
                        ? { in: userSchoolId }
                        : userSchoolId
                },
                select: { id: true }
            });

            allowedIds = userClasses.map(cls => cls.id);

            if (allowedIds.length === 0) {
                return NextResponse.json({
                    error: "Access denied - you can only delete classes from your school"
                }, { status: 403 });
            }
        }

        // Fetch student counts for each allowed class
        const counts = await prisma.class.findMany({
            where: { id: { in: allowedIds } },
            select: {
                id: true,
                name: true,
                _count: { select: { students: true } }
            }
        });

        // Partition into deletable vs. blocked
        const canDelete = counts.filter(c => c._count.students === 0).map(c => c.id);
        const blocked = counts.filter(c => c._count.students > 0).map(c => ({
            id: c.id,
            name: c.name,
            studentCount: c._count.students
        }));

        if (!canDelete.length) {
            return NextResponse.json(
                {
                    error: "Cannot delete class(es) with students enrolled",
                    blocked,
                    message: "All selected classes have enrolled students"
                },
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
            message: blocked.length > 0
                ? `Deleted ${result.count} classes. ${blocked.length} classes could not be deleted due to enrolled students.`
                : `Successfully deleted ${result.count} classes.`
        });
    } catch (error) {
        console.error("Error deleting classes:", error);
        return NextResponse.json(
            { error: "Failed to delete classes" },
            { status: 500 }
        );
    }
}