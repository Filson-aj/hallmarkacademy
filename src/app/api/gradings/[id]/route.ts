import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { gradeSchema } from "@/lib/schemas";

const ALLOWED_ROLES = ["admin", "super", "management", "Admin", "Super", "Management"];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You are not allowed to access this record" },
                { status: 401 }
            );
        }

        const { id } = await params;

        const grading = await prisma.grading.findUnique({
            where: { id },
            include: {
                // basic school info
                school: { select: { id: true, name: true } },

                // policy that governs this grading (if any)
                gradingPolicy: { select: { id: true, title: true, passMark: true, maxScore: true } },

                // student grades for this grading
                studentGrades: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                admissionNumber: true,
                                firstname: true,
                                surname: true,
                                othername: true,
                            },
                        },
                        subject: { select: { id: true, name: true } },
                        class: { select: { id: true, name: true } },
                    },
                },

                // student traits (psychomotor/affective/etc.)
                studentTraits: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                admissionNumber: true,
                                firstname: true,
                                surname: true,
                                othername: true,
                            },
                        },
                        trait: { select: { id: true, name: true, category: true } },
                    },
                },

                // student assessments (assessments per grading)
                studentAssessments: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                admissionNumber: true,
                                firstname: true,
                                surname: true,
                                othername: true,
                            },
                        },
                        assessment: { select: { id: true, name: true, maxScore: true, weight: true } },
                        subject: { select: { id: true, name: true } },
                        class: { select: { id: true, name: true } },
                    },
                },

                // report cards generated for this grading
                reportCards: {
                    include: {
                        student: { select: { id: true, firstname: true, surname: true, admissionNumber: true } },
                        class: { select: { id: true, name: true } },
                    },
                },

                // counts for quick summary
                _count: {
                    select: {
                        studentGrades: true,
                        studentTraits: true,
                        studentAssessments: true,
                        reportCards: true,
                    },
                },
            },
        });

        if (!grading) {
            return NextResponse.json({ error: "NotFound", message: "Grading record not found" }, { status: 404 });
        }

        return NextResponse.json(grading);
    } catch (error) {
        console.error("Error fetching grading:", error);
        return NextResponse.json(
            { error: "Server", message: "Internal server error - failed to fetch grading" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const role = (session?.user?.role as string) || "";
        if (!session || !ALLOWED_ROLES.includes(role)) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You are not allowed to update this record" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        // validate using provided schema (best-effort: schema should match new field names)
        const validated = gradeSchema.parse(body);

        // accept either schoolId or schoolid from incoming payload (defensive)
        const schoolId = (validated as any).schoolId ?? (validated as any).schoolid ?? (body as any).schoolId ?? (body as any).schoolid;

        // if schoolId provided, confirm it exists
        if (schoolId) {
            const school = await prisma.school.findUnique({ where: { id: schoolId } });
            if (!school) {
                return NextResponse.json({ error: "Invalid", message: "School record not found" }, { status: 400 });
            }
        }

        const data: any = {};
        if ((validated as any).title) data.title = (validated as any).title;
        if ((validated as any).session) data.session = (validated as any).session;
        if ((validated as any).term) data.term = (validated as any).term;
        if ((validated as any).section !== undefined) data.section = (validated as any).section || null;
        if (schoolId) data.schoolId = schoolId;

        // handle boolean 'published' explicitly even if false
        if (Object.prototype.hasOwnProperty.call(body, "published")) {
            data.published = Boolean((body as any).published);
        }

        const updated = await prisma.grading.update({
            where: { id },
            data,
            include: {
                school: { select: { id: true, name: true } },
                gradingPolicy: { select: { id: true, title: true } },
                _count: { select: { studentGrades: true, studentTraits: true, studentAssessments: true, reportCards: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (err: any) {
        console.error("Error updating grading:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation", message: "Validation error occurred.", details: err.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Server", message: "Internal server error - failed to update record.", details: err?.message ?? err },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const role = (session?.user?.role as string) || "";
        if (!session || !ALLOWED_ROLES.includes(role)) {
            return NextResponse.json(
                { error: "Unauthorized", message: "You are not allowed to delete this record." },
                { status: 401 }
            );
        }

        const { id } = await params;

        // verify grading exists
        const existing = await prisma.grading.findUnique({ where: { id }, select: { id: true } });
        if (!existing) {
            return NextResponse.json({ error: "Invalid", message: "Grading record not found" }, { status: 404 });
        }

        // delete dependent records in safe order inside a transaction and return counts
        const [
            deletedStudentGrades,
            deletedStudentTraits,
            deletedStudentAssessments,
            deletedReportCards,
            deletedGradings,
        ] = await prisma.$transaction([
            prisma.studentGrade.deleteMany({ where: { gradingId: id } }),
            prisma.studentTrait.deleteMany({ where: { gradingId: id } }),
            prisma.studentAssessment.deleteMany({ where: { gradingId: id } }),
            prisma.reportCard.deleteMany({ where: { gradingId: id } }),
            prisma.grading.deleteMany({ where: { id } }),
        ]);

        return NextResponse.json({
            message: "Grading deleted successfully",
            deleted: {
                gradings: deletedGradings.count,
                studentGrades: deletedStudentGrades.count,
                studentTraits: deletedStudentTraits.count,
                studentAssessments: deletedStudentAssessments.count,
                reportCards: deletedReportCards.count,
            },
        });
    } catch (error: any) {
        console.error("Error deleting grading:", error);
        return NextResponse.json(
            { error: "Server", message: "Internal server error - failed to delete record.", details: error?.message ?? error },
            { status: 500 }
        );
    }
}
