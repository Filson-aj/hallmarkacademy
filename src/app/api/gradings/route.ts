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

    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const minimal = url.searchParams.get("minimal") === "true";

    const page = pageParam ? Math.max(parseInt(pageParam, 10) || 1, 1) : undefined;
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 0), 500) : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    // --- build where filter for Grading ---
    const where: Prisma.GradingWhereInput = {};

    // --- role-based scoping ---
    try {
        if (role === UserRole.SUPER) {
            // SUPER: no extra scoping (sees everything)
        } else if (role === UserRole.ADMIN || role === UserRole.MANAGEMENT) {
            // ADMIN/MANAGEMENT: scope to their school (show all)
            const admin = await prisma.administration.findUnique({
                where: { id: session.user.id },
                select: { schoolId: true },
            });
            if (!admin || !admin.schoolId) return NextResponse.json(emptyList());
            where.schoolId = admin.schoolId;
        } else if (role === UserRole.TEACHER) {
            // TEACHER: scope to their school
            const teacher = await prisma.teacher.findUnique({
                where: { id: session.user.id },
                select: { schoolId: true },
            });
            if (!teacher || !teacher.schoolId) return NextResponse.json(emptyList());
            where.schoolId = teacher.schoolId;
        } else if (role === UserRole.STUDENT) {
            // STUDENT: scope to their school, only published grades
            const student = await prisma.student.findUnique({
                where: { id: session.user.id },
                select: { schoolId: true },
            });
            if (!student || !student.schoolId) return NextResponse.json(emptyList());
            where.schoolId = student.schoolId;
            where.published = true;
        } else if (role === UserRole.PARENT) {
            // PARENT: find children's school ids, show published grades for those schools
            const children = await prisma.student.findMany({
                where: { parentId: session.user.id },
                select: { schoolId: true },
            });
            const schoolIds = [...new Set(children.map((c) => c.schoolId).filter(Boolean))];
            if (!schoolIds.length) return NextResponse.json(emptyList());
            where.schoolId = { in: schoolIds };
            where.published = true;
        } else {
            return NextResponse.json(emptyList());
        }

        // --- DATA FETCH ---
        const gradings = await (async () => {
            if (minimal) {
                return prisma.grading.findMany({
                    where,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        title: true,
                        session: true,
                        term: true,
                        published: true,
                        section: true,
                        school: { select: { id: true, name: true } },
                        gradingPolicy: { select: { id: true, title: true } },
                    },
                    orderBy: { createdAt: "desc" },
                });
            }

            return prisma.grading.findMany({
                where,
                skip,
                take: limit,
                include: {
                    school: { select: { id: true, name: true } },
                    gradingPolicy: { select: { id: true, title: true } },
                    // For listing we return counts (avoid returning large nested arrays)
                    _count: {
                        select: {
                            studentGrades: true,
                            studentTraits: true,
                            studentAssessments: true,
                            reportCards: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
        })();

        const total = await prisma.grading.count({ where });

        return NextResponse.json({ data: gradings, total });
    } catch (err: any) {
        console.error("Error fetching gradings:", err);
        return NextResponse.json(
            { error: "SERVERERROR", message: "Internal server error - Failed to fetch gradings" },
            { status: 500 }
        );
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
            return NextResponse.json({ error: "Access denied - You can't create grading" }, { status: 403 });
        }

        const body = await request.json();
        const validated = gradeSchema.parse(body);

        // determine schoolId to use
        let schoolIdToUse: string;
        if (role === UserRole.SUPER) {
            // super must provide schoolId
            const provided = (validated as any).schoolId ?? (validated as any).schoolid ?? (body as any).schoolId ?? (body as any).schoolid;
            if (!provided) {
                return NextResponse.json({ error: "School ID is required for super users" }, { status: 400 });
            }
            schoolIdToUse = provided;
        } else {
            const admin = await prisma.administration.findUnique({
                where: { id: session.user.id },
                select: { schoolId: true },
            });
            if (!admin || !admin.schoolId) {
                return NextResponse.json({ error: "Access denied - No school record found" }, { status: 403 });
            }
            schoolIdToUse = admin.schoolId;
        }

        // verify school exists
        const school = await prisma.school.findUnique({ where: { id: schoolIdToUse } });
        if (!school) {
            return NextResponse.json({ error: "School not found" }, { status: 400 });
        }

        const sessionValue = ((validated as any).session || "").trim();
        const termValue = ((validated as any).term || "").trim();
        const gradingPolicyId = (validated as any).gradingPolicyId ?? (validated as any).gradingpolicyid ?? null;

        // check for duplicates:
        let existing;
        if (gradingPolicyId) {
            existing = await prisma.grading.findFirst({
                where: {
                    gradingPolicyId,
                    session: sessionValue,
                    term: termValue,
                },
                select: { id: true, title: true, session: true, term: true },
            });
        } else {
            // fallback: check a combination of school + session + term to avoid accidental duplicates
            existing = await prisma.grading.findFirst({
                where: {
                    schoolId: schoolIdToUse,
                    session: sessionValue,
                    term: termValue,
                },
                select: { id: true, title: true, session: true, term: true },
            });
        }

        if (existing) {
            return NextResponse.json(
                {
                    error: "Conflict",
                    message: `Grading record already exists.`,
                    existingId: existing.id,
                },
                { status: 409 }
            );
        }

        // create the grading
        const createData: any = {
            title: (validated as any).title,
            session: sessionValue,
            term: termValue,
            published: false,
            schoolId: schoolIdToUse,
            section: (validated as any).section ?? null,
        };
        if (gradingPolicyId) createData.gradingPolicyId = gradingPolicyId;

        const newGrading = await prisma.grading.create({
            data: createData,
            include: {
                school: { select: { id: true, name: true } },
                _count: { select: { studentGrades: true, studentTraits: true, studentAssessments: true, reportCards: true } },
            },
        });

        return NextResponse.json(newGrading, { status: 201 });
    } catch (err: any) {
        console.error("Error creating grading:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create grading" }, { status: 500 });
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
        const ids = url.searchParams.getAll("ids").filter(Boolean);
        if (!ids.length) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        // Ensure all provided grading ids exist
        const existing = await prisma.grading.findMany({
            where: { id: { in: ids } },
            select: { id: true },
        });
        const existingIds = existing.map((e) => e.id);
        const missing = ids.filter((id) => !existingIds.includes(id));
        if (missing.length) {
            return NextResponse.json({ error: "Invalid", message: "Invalid gradings provided", missing }, { status: 404 });
        }

        // Delete dependent records in safe order inside a transaction
        // (studentGrade, studentTrait, studentAssessment, reportCard => then grading)
        const [
            deletedStudentGrades,
            deletedStudentTraits,
            deletedStudentAssessments,
            deletedReportCards,
            deletedGradings,
        ] = await prisma.$transaction([
            prisma.studentGrade.deleteMany({ where: { gradingId: { in: ids } } }),
            prisma.studentTrait.deleteMany({ where: { gradingId: { in: ids } } }),
            prisma.studentAssessment.deleteMany({ where: { gradingId: { in: ids } } }),
            prisma.reportCard.deleteMany({ where: { gradingId: { in: ids } } }),
            prisma.grading.deleteMany({ where: { id: { in: ids } } }),
        ]);

        return NextResponse.json({
            deleted: {
                gradings: deletedGradings.count,
                studentGrades: deletedStudentGrades.count,
                studentTraits: deletedStudentTraits.count,
                studentAssessments: deletedStudentAssessments.count,
                reportCards: deletedReportCards.count,
            },
        });
    } catch (error: any) {
        console.error("Error deleting gradings:", error);
        return NextResponse.json(
            { error: "Server", message: "Internal server error - failed to delete gradings" },
            { status: 500 }
        );
    }
}
