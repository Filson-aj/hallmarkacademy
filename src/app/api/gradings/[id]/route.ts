import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { gradeSchema } from "@/lib/schemas";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized", message: "You are not allowed to access this record" }, { status: 401 });
        }

        const { id } = await params;
        const grade = await prisma.grade.findUnique({
            where: { id },
            include: {
                school: { select: { id: true, name: true } },
                gradings: {
                    include: {
                        class: { select: { id: true, name: true } },
                        subjects: {
                            include: {
                                subject: { select: { id: true, name: true } },
                                _count: { select: { students: true } },
                            },
                        },
                    },
                },
                effective: {
                    include: { student: { select: { id: true, admissionnumber: true, firstname: true, surname: true, othername: true, } } },
                },
                psychomotive: {
                    include: { student: { select: { id: true, admissionnumber: true, firstname: true, surname: true, othername: true, } } },
                },
                _count: { select: { gradings: true, effective: true, psychomotive: true } },
            },
        });

        return NextResponse.json(grade);
    } catch (error) {
        //console.error("Error fetching grade:", error);
        return NextResponse.json({ error: "Server", message: "Internal server error - failed to fetch grades" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (
            !session ||
            !["admin", "super", "management"].includes((session.user.role || "").toLowerCase())
        ) {
            return NextResponse.json({ error: "Unauthorized", message: "You are not allowed to update this record" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validated = gradeSchema.parse(body);

        // if schoolid is being changed/provided, verify it exists
        if (validated.schoolid) {
            const school = await prisma.school.findUnique({
                where: { id: validated.schoolid },
            });
            if (!school) {
                return NextResponse.json({ error: "Invalid", message: "School record not found" }, { status: 400 });
            }
        }

        const data: any = {};
        if (validated.title) data.title = validated.title;
        if (validated.session) data.session = validated.session;
        if (validated.term) data.term = validated.term;
        // allow explicit published boolean or default to false when provided
        if (body.published) data.published = body.published;
        if (validated.schoolid) data.schoolid = validated.schoolid;

        const updated = await prisma.grade.update({
            where: { id },
            data,
            include: {
                school: { select: { id: true, name: true } },
                gradings: {
                    select: {
                        id: true,
                        classid: true,
                        gradeid: true,
                    },
                },
                _count: { select: { gradings: true, effective: true, psychomotive: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (err: any) {
        console.error("Error updating grade:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation", message: "Internal server error - validation error occured.", details: err.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Server", message: "Internal server error - failed to update record.", details: err.errors }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (
            !session ||
            !["admin", "super", "management"].includes((session.user.role || "").toLowerCase())
        ) {
            return NextResponse.json({ error: "Unauthorized", message: "You are not allowed to delete rhis record." }, { status: 401 });
        }

        const { id } = await params;

        // verify grade exists
        const existing = await prisma.grade.findUnique({ where: { id }, select: { id: true } });
        if (!existing) {
            return NextResponse.json({ error: "Invalid", message: "Grade record not found" }, { status: 404 });
        }

        // collect dependent ids
        const classGrades = await prisma.classGrade.findMany({
            where: { gradeid: id },
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

        // delete in safe order inside a transaction
        const [
            deletedStudentGrades,
            deletedSubjectGrades,
            deletedClassGrades,
            deletedEffectiveDomains,
            deletedPsychomotiveDomains,
            deletedGrades,
        ] = await prisma.$transaction([
            // student grades depend on subjectGrade
            subjectGradeIds.length
                ? prisma.studentGrade.deleteMany({ where: { subjectgradeid: { in: subjectGradeIds } } })
                : prisma.studentGrade.deleteMany({ where: { id: "__NONE__" } }),
            // subject grades
            subjectGradeIds.length
                ? prisma.subjectGrade.deleteMany({ where: { id: { in: subjectGradeIds } } })
                : prisma.subjectGrade.deleteMany({ where: { id: "__NONE__" } }),
            // class grades
            classGradeIds.length
                ? prisma.classGrade.deleteMany({ where: { id: { in: classGradeIds } } })
                : prisma.classGrade.deleteMany({ where: { id: "__NONE__" } }),
            // effective domains linked to grade
            prisma.effectiveDomain.deleteMany({ where: { gradeid: id } }),
            // psychomotive domains linked to grade
            prisma.psychomotiveDomain.deleteMany({ where: { gradeid: id } }),
            // finally the grade itself
            prisma.grade.deleteMany({ where: { id } }),
        ]);

        return NextResponse.json({
            message: "Grade deleted successfully",
            deleted: {
                grades: deletedGrades.count,
                classGrades: deletedClassGrades.count,
                subjectGrades: deletedSubjectGrades.count,
                studentGrades: deletedStudentGrades.count,
                effectiveDomains: deletedEffectiveDomains.count,
                psychomotiveDomains: deletedPsychomotiveDomains.count,
            },
        });
    } catch (error: any) {
        //console.error("Error deleting grade:", error);
        return NextResponse.json({ error: "Server", message: "Internal server error - failed to delete record.", details: error.errors }, { status: 500 });
    }
}
