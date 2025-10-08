import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { gradeSchema } from "@/lib/schemas";

enum UserRole {
    SUPER = "super",
    ADMIN = "admin",
    MANAGEMENT = "management",
    TEACHER = "teacher",
    STUDENT = "student",
    PARENT = "parent",
}

interface ListResponse {
    data: any[];
    total: number;
    message?: string;
}

const emptyList = (message = "No records found"): ListResponse => ({
    data: [],
    total: 0,
    message,
});

export async function GET(request: NextRequest): Promise<NextResponse> {
    // --- authorization ---
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json(
            { error: "Unauthorized", message: "You can't access this resource." },
            { status: 401 }
        );
    }

    const role = (session.user.role || "").toLowerCase() as UserRole;

    // --- build where filter for Grade ---
    const where: Prisma.GradeWhereInput = {};

    // --- role-based scoping ---
    if (role === UserRole.SUPER) {
        // SUPER: no extra scoping (sees everything)
    } else if (role === UserRole.ADMIN || role === UserRole.MANAGEMENT) {
        // ADMIN/MANAGEMENT: scope to their school (show all, published or not)
        const admin = await prisma.administration.findUnique({
            where: { id: session.user.id },
            select: { schoolid: true },
        });
        if (!admin || !admin.schoolid) return NextResponse.json(emptyList());
        where.schoolid = admin.schoolid;
    } else if (role === UserRole.TEACHER) {
        // TEACHER: scope to their school, only published grades
        const teacher = await prisma.teacher.findUnique({
            where: { id: session.user.id },
            select: { schoolid: true },
        });
        if (!teacher || !teacher.schoolid) return NextResponse.json(emptyList());
        where.schoolid = teacher.schoolid;
    } else if (role === UserRole.STUDENT) {
        // STUDENT: scope to their school, only published grades
        const student = await prisma.student.findUnique({
            where: { id: session.user.id },
            select: { schoolid: true },
        });
        if (!student || !student.schoolid) return NextResponse.json(emptyList());
        where.schoolid = student.schoolid;
        where.published = true;
    } else if (role === UserRole.PARENT) {
        // PARENT: find children's school ids, show published grades for those schools
        const children = await prisma.student.findMany({
            where: { parentid: session.user.id },
            select: { schoolid: true },
        });
        const schoolIds = [...new Set(children.map((c) => c.schoolid).filter(Boolean))];
        if (!schoolIds.length) return NextResponse.json(emptyList());
        where.schoolid = { in: schoolIds };
        where.published = true;
    } else {
        return NextResponse.json(emptyList());
    }

    // --- DATA FETCH ---
    try {
        const grades = await prisma.grade.findMany({
            where,
            include: {
                school: { select: { id: true, name: true } },
                gradings: {
                    select: {
                        id: true,
                        classid: true,
                        gradeid: true,
                    },
                },
                effective: { select: { id: true, studentid: true } },
                psychomotive: { select: { id: true, studentid: true } },
                _count: { select: { gradings: true, effective: true, psychomotive: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ data: grades, total: grades.length });
    } catch (err) {
        //console.error("Error fetching grades:", err);
        return NextResponse.json({ error: "SERVERERROR", message: "Internal server error - Failed to fetch grades" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user.role || "").toLowerCase() as UserRole;
        if (![UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN].includes(role)) {
            return NextResponse.json({ error: "Access denied - You can't create grade" }, { status: 403 });
        }

        const body = await request.json();
        const validated = gradeSchema.parse(body);

        // determine schoolId to use
        let schoolIdToUse: string;
        if (role === UserRole.SUPER) {
            if (!validated.schoolid) {
                return NextResponse.json({ error: "School ID is required for super users" }, { status: 400 });
            }
            schoolIdToUse = validated.schoolid;
        } else {
            const admin = await prisma.administration.findUnique({
                where: { id: session.user.id },
                select: { schoolid: true },
            });
            if (!admin || !admin.schoolid) {
                return NextResponse.json({ error: "Access denied - No school record found" }, { status: 403 });
            }
            schoolIdToUse = admin.schoolid;
        }

        // verify school exists
        const school = await prisma.school.findUnique({ where: { id: schoolIdToUse } });
        if (!school) {
            return NextResponse.json({ error: "School not found" }, { status: 400 });
        }

        const sessionValue = (validated.session || "").trim();
        const termValue = (validated.term || "").trim();

        const existing = await prisma.grade.findFirst({
            where: {
                schoolid: schoolIdToUse,
                session: sessionValue,
                term: termValue,
            },
            select: { id: true, title: true, session: true, term: true },
        });

        if (existing) {
            return NextResponse.json(
                {
                    error: "Conflict",
                    message: `Grade record already exists.`,
                    existingId: existing.id,
                },
                { status: 409 }
            );
        }

        // create the grade
        const newGrade = await prisma.grade.create({
            data: {
                title: validated.title,
                session: sessionValue,
                term: termValue,
                published: false,
                schoolid: schoolIdToUse,
            },
            include: {
                school: { select: { id: true, name: true } },
                _count: { select: { gradings: true, effective: true, psychomotive: true } },
            },
        });

        return NextResponse.json(newGrade, { status: 201 });
    } catch (err: any) {
        console.error("Error creating grade:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create grade" }, { status: 500 });
    }
}


export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user.role || "").toLowerCase() as UserRole;
        if (![UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN].includes(role)) {
            return NextResponse.json({ error: "Access", message: "You are not allowed to delete record." }, { status: 403 });
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (!ids.length) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        // Ensure all provided grade ids exist
        const existing = await prisma.grade.findMany({
            where: { id: { in: ids } },
            select: { id: true },
        });
        const existingIds = existing.map((e) => e.id);
        const missing = ids.filter((id) => !existingIds.includes(id));
        if (missing.length) {
            return NextResponse.json({ error: "Invalid", message: "Invalid grades provides", missing }, { status: 404 });
        }

        // Gather dependent ids
        const classGrades = await prisma.classGrade.findMany({
            where: { gradeid: { in: ids } },
            select: { id: true },
        });
        const classGradeIds = classGrades.map((c) => c.id);

        let subjectGradeIds: string[] = [];
        if (classGradeIds.length) {
            const subjectGrades = await prisma.subjectGrade.findMany({
                where: { classid: { in: classGradeIds } },
                select: { id: true },
            });
            subjectGradeIds = subjectGrades.map((s) => s.id);
        }

        // Delete in safe order inside a transaction
        const [
            deletedStudentGrades,
            deletedSubjectGrades,
            deletedClassGrades,
            deletedEffectiveDomains,
            deletedPsychomotiveDomains,
            deletedGrades,
        ] = await prisma.$transaction([
            // student grades (depend on subjectGrade)
            prisma.studentGrade.deleteMany({ where: { subjectgradeid: { in: subjectGradeIds.length ? subjectGradeIds : ["__NONE__"] } } }),
            // subject grades
            prisma.subjectGrade.deleteMany({ where: { id: { in: subjectGradeIds.length ? subjectGradeIds : ["__NONE__"] } } }),
            // class grades
            prisma.classGrade.deleteMany({ where: { id: { in: classGradeIds.length ? classGradeIds : ["__NONE__"] } } }),
            // effective domains
            prisma.effectiveDomain.deleteMany({ where: { gradeid: { in: ids } } }),
            // psychomotive domains
            prisma.psychomotiveDomain.deleteMany({ where: { gradeid: { in: ids } } }),
            // finally the grade(s)
            prisma.grade.deleteMany({ where: { id: { in: ids } } }),
        ]);

        return NextResponse.json({
            deleted: {
                grades: deletedGrades.count,
                classGrades: deletedClassGrades.count,
                subjectGrades: deletedSubjectGrades.count,
                studentGrades: deletedStudentGrades.count,
                effectiveDomains: deletedEffectiveDomains.count,
                psychomotiveDomains: deletedPsychomotiveDomains.count,
            },
        });
    } catch (error) {
        //console.error("Error deleting grades:", error);
        return NextResponse.json({ error: "Server", message: "Internal server error - failed to delete grades" }, { status: 500 });
    }
}

