import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PostType } from "@/generated/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        // normalize requested role; fallback to session role
        const requestedRole = (searchParams.get("role") || (session.user as any)?.role || "").toString();
        const role = requestedRole.toLowerCase();

        // Helper: fetch school id from DB based on the current user role & id
        const resolveSchoolId = async (): Promise<string | null> => {
            const sessUser: any = session.user;
            const uid = sessUser?.id;
            if (!uid) return null;

            if (role === "admin" || role === "management") {
                const admin = await prisma.administration.findUnique({
                    where: { id: uid },
                    select: { schoolId: true },
                });
                return admin?.schoolId ?? null;
            }

            if (role === "teacher") {
                const teacher = await prisma.teacher.findUnique({
                    where: { id: uid },
                    select: { schoolId: true },
                });
                return teacher?.schoolId ?? null;
            }

            if (role === "student") {
                const student = await prisma.student.findUnique({
                    where: { id: uid },
                    select: { schoolId: true },
                });
                return student?.schoolId ?? null;
            }

            if (role === "parent") {
                // derive parent's school from the first child (if any)
                const child = await prisma.student.findFirst({
                    where: { parentId: uid },
                    select: { schoolId: true },
                });
                return child?.schoolId ?? null;
            }

            return null;
        };

        // For all non-super roles, scope to a school
        let schoolId: string | undefined = undefined;
        if (role !== "super") {
            const resolved = await resolveSchoolId();
            if (!resolved) {
                return NextResponse.json(
                    { error: "No school associated with user. Cannot fetch school-specific statistics." },
                    { status: 403 }
                );
            }
            schoolId = resolved;
        }

        // small helper to conditionally build where objects for direct schoolId fields
        const whereSchoolOrUndefined = (additional: Record<string, any> = {}) =>
            schoolId ? { ...additional, schoolId } : undefined;

        const postWhereByType = (type: PostType) =>
            schoolId
                ? {
                    type,
                    OR: [
                        { schoolId },
                        { class: { is: { schoolId } } },
                    ],
                }
                : { type };

        // BASE STATS (scoped to school for non-super)
        const [studentsCount, teachersCount, classesCount, subjectsCount] = await Promise.all([
            prisma.student.count({ where: whereSchoolOrUndefined() }),
            prisma.teacher.count({ where: whereSchoolOrUndefined() }),
            prisma.class.count({ where: whereSchoolOrUndefined() }),
            prisma.subject.count({ where: whereSchoolOrUndefined() }),
        ]);

        const baseStats = {
            students: studentsCount,
            teachers: teachersCount,
            classes: classesCount,
            subjects: subjectsCount,
        };

        // Role-specific stats
        let roleSpecificStats: any = {};

        switch (role) {
            case "super":
            case "management":
            case "admin": {
                const [adminCount, superCount, managementCount] = await Promise.all([
                    prisma.administration.count({
                        where: schoolId ? { role: "Admin", schoolId } : { role: "Admin" },
                    }),
                    prisma.administration.count({
                        where: schoolId ? { role: "Super", schoolId } : { role: "Super" },
                    }),
                    prisma.administration.count({
                        where: schoolId ? { role: "Management", schoolId } : { role: "Management" },
                    }),
                ]);

                const [
                    schoolsCount,
                    parentsCount,
                    announcementsCount,
                    eventsCount,
                    lessonsCount,
                    assignmentsCount,
                    testsCount,
                    studentsByGender,
                    recentStudents,
                    recentTeachers,
                    totalPayments,
                    recentPayments,
                    paymentSetups,
                    gradesCount,
                    submissionsCount,
                    answersCount,
                ] = await Promise.all([
                    role === "super"
                        ? prisma.school.count()
                        : prisma.school.count({ where: { id: schoolId } }),
                    role === "super"
                        ? prisma.parent.count()
                        : prisma.parent.count({ where: { students: { some: { schoolId } } } }),
                    prisma.post.count({ where: postWhereByType(PostType.ANNOUNCEMENT) }),
                    prisma.post.count({ where: postWhereByType(PostType.EVENT) }),
                    role === "super"
                        ? prisma.lesson.count()
                        : prisma.lesson.count({ where: { class: { is: { schoolId } } } }),
                    role === "super"
                        ? prisma.assignment.count()
                        : prisma.assignment.count({ where: { subject: { is: { schoolId } } } }),
                    role === "super"
                        ? prisma.test.count()
                        : prisma.test.count({ where: { subject: { is: { schoolId } } } }),
                    prisma.student.groupBy({
                        by: ["gender"],
                        where: schoolId ? { schoolId } : undefined,
                        _count: { _all: true },
                    }),
                    prisma.student.count({
                        where: {
                            ...(schoolId ? { schoolId } : {}),
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                    }),
                    prisma.teacher.count({
                        where: {
                            ...(schoolId ? { schoolId } : {}),
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                    }),
                    prisma.payment.count({
                        where: schoolId ? { schoolId } : undefined,
                    }),
                    prisma.payment.count({
                        where: {
                            ...(schoolId ? { schoolId } : {}),
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                    }),
                    prisma.paymentSetup.count({
                        where: schoolId ? { schoolId } : undefined,
                    }),
                    role === "super"
                        ? prisma.grading.count()
                        : prisma.grading.count({
                            where: { studentGrades: { some: { class: { is: { schoolId } } } } },
                        }),
                    role === "super"
                        ? prisma.submission.count()
                        : prisma.submission.count({
                            where: { assignment: { subject: { is: { schoolId } } } },
                        }),
                    role === "super"
                        ? prisma.answer.count()
                        : prisma.answer.count({
                            where: { test: { subject: { is: { schoolId } } } },
                        }),
                ]);

                roleSpecificStats = {
                    ...baseStats,
                    parents: parentsCount,
                    schools: schoolsCount,
                    admins: adminCount,
                    superAdmins: superCount,
                    managementUsers: managementCount,
                    administrations: adminCount + superCount + managementCount,
                    announcements: announcementsCount,
                    events: eventsCount,
                    lessons: lessonsCount,
                    assignments: assignmentsCount,
                    tests: testsCount,
                    studentsByGender,
                    recentStudents,
                    recentTeachers,
                    totalPayments,
                    recentPayments,
                    paymentSetups,
                    grades: gradesCount,
                    submissions: submissionsCount,
                    answers: answersCount,
                };
                break;
            }

            case "teacher": {
                const teacherId = (session.user as any)?.id as string;

                const [teacherSubjects, teacherLessons] = await Promise.all([
                    prisma.subject.findMany({
                        where: {
                            teacherId,
                            ...(schoolId ? { schoolId } : {}),
                        },
                        include: {
                            _count: { select: { assignments: true, tests: true, lessons: true, studentAssessments: true } },
                            teacher: { select: { id: true, firstname: true, surname: true, title: true } },
                        },
                    }),
                    prisma.lesson.findMany({
                        where: {
                            teacherId,
                            ...(schoolId ? { class: { is: { schoolId } } } : {}),
                        },
                        include: {
                            class: { include: { _count: { select: { students: true } } } },
                        },
                    }),
                ]);

                const uniqueClassIds = [...new Set(teacherLessons.map((l) => (l as any).classId))];
                const totalStudents = teacherLessons.reduce((total, lesson) => {
                    return total + (((lesson as any).class as any)?._count?.students || 0);
                }, 0);

                const [
                    myAssignments,
                    myTests,
                    pendingTests,
                    completedTests,
                    mySubmissions,
                ] = await Promise.all([
                    prisma.assignment.count({
                        where: {
                            teacherId,
                            ...(schoolId ? { subject: { is: { schoolId } } } : {}),
                        },
                    }),
                    prisma.test.count({
                        where: {
                            teacherId,
                            ...(schoolId ? { subject: { is: { schoolId } } } : {}),
                        },
                    }),
                    prisma.test.count({
                        where: {
                            teacherId,
                            status: "Pending",
                            ...(schoolId ? { subject: { is: { schoolId } } } : {}),
                        },
                    }),
                    prisma.test.count({
                        where: {
                            teacherId,
                            status: "Completed",
                            ...(schoolId ? { subject: { is: { schoolId } } } : {}),
                        },
                    }),
                    prisma.submission.count({
                        where: {
                            assignment: {
                                teacherId,
                                ...(schoolId ? { subject: { is: { schoolId } } } : {}),
                            },
                        },
                    }),
                ]);

                roleSpecificStats = {
                    mySubjects: teacherSubjects.length,
                    myLessons: teacherLessons.length,
                    myStudents: totalStudents,
                    myClasses: uniqueClassIds.length,
                    myAssignments,
                    myTests,
                    pendingTests,
                    completedTests,
                    mySubmissions,
                };
                break;
            }

            case "student": {
                const studentId = (session.user as any)?.id as string;
                const studentData = await prisma.student.findUnique({
                    where: { id: studentId },
                    include: {
                        class: true,
                        parent: { select: { firstname: true, surname: true, phone: true, email: true } },
                        school: { select: { name: true } },
                    },
                });

                if (studentData) {
                    const [
                        classmatesCount,
                        classAssignments,
                        classTests,
                        myAttendance,
                        totalAttendanceDays,
                        mySubmissions,
                        myAnswers,
                    ] = await Promise.all([
                        prisma.student.count({
                            where: { classId: studentData.classId, id: { not: studentId } },
                        }),
                        prisma.assignment.count({
                            where: {
                                students: { some: { id: studentId } },
                                ...(schoolId ? { subject: { is: { schoolId } } } : {}),
                            },
                        }),
                        prisma.test.count({
                            where: {
                                subject: {
                                    lessons: { some: { classId: studentData.classId } },
                                    ...(schoolId ? { schoolId } : {}),
                                },
                            },
                        }),
                        prisma.attendance.count({
                            where: {
                                studentId,
                                present: true,
                                date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                                ...(schoolId ? { schoolId } : {}),
                            },
                        }),
                        prisma.attendance.count({
                            where: {
                                studentId,
                                date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                                ...(schoolId ? { schoolId } : {}),
                            },
                        }),
                        prisma.submission.count({ where: { studentId } }),
                        prisma.answer.count({ where: { studentId } }),
                    ]);

                    roleSpecificStats = {
                        myClass: studentData.class?.name || "Not assigned",
                        classmates: classmatesCount,
                        myAssignments: classAssignments,
                        myTests: classTests,
                        myAttendance,
                        totalAttendanceDays,
                        mySubmissions,
                        myAnswers,
                        parentInfo: {
                            name: studentData.parent ? `${studentData.parent.firstname} ${studentData.parent.surname}` : null,
                            phone: studentData.parent?.phone ?? null,
                            email: studentData.parent?.email ?? null,
                        },
                        schoolInfo: { name: studentData.school?.name || "Unknown" },
                    };
                }
                break;
            }

            case "parent": {
                const parentId = (session.user as any)?.id as string;

                const children = await prisma.student.findMany({
                    where: {
                        parentId,
                        ...(schoolId ? { schoolId } : {}),
                    },
                    include: {
                        class: { select: { name: true } },
                        school: { select: { name: true } },
                        payments: { select: { amount: true, createdAt: true } },
                    },
                });

                const totalFees = children.reduce(
                    (total, c) => total + (c.payments?.reduce((s, p) => s + p.amount, 0) || 0),
                    0
                );

                const [
                    totalPayments,
                    recentPayments,
                    childrenAttendance,
                    totalAttendanceDays,
                ] = await Promise.all([
                    prisma.payment.count({
                        where: {
                            student: { parentId },
                            ...(schoolId ? { schoolId } : {}),
                        },
                    }),
                    prisma.payment.count({
                        where: {
                            student: { parentId },
                            ...(schoolId ? { schoolId } : {}),
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                    }),
                    prisma.attendance.count({
                        where: {
                            student: { parentId },
                            present: true,
                            date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                            ...(schoolId ? { schoolId } : {}),
                        },
                    }),
                    prisma.attendance.count({
                        where: {
                            student: { parentId },
                            date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                            ...(schoolId ? { schoolId } : {}),
                        },
                    }),
                ]);

                roleSpecificStats = {
                    children: children.length,
                    childrenDetails: children.map((child) => ({
                        id: child.id,
                        name: `${child.firstname} ${child.surname}`,
                        class: child.class?.name || "Not assigned",
                        admissionNumber: child.admissionNumber,
                        school: child.school?.name || "Unknown",
                    })),
                    totalPayments,
                    totalFeesPaid: totalFees,
                    recentPayments,
                    childrenAttendance,
                    totalAttendanceDays,
                };
                break;
            }

            default:
                roleSpecificStats = baseStats;
        }

        // Attendance data for charts (last 7 days) — scoped to school if applicable
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [attendanceData, currentTerm, recentAnnouncements, recentEvents] = await Promise.all([
            prisma.attendance.findMany({
                where: {
                    date: { gte: sevenDaysAgo },
                    ...(schoolId ? { schoolId } : {}),
                },
                select: { date: true, present: true },
            }),
            prisma.term.findFirst({
                where: { status: "Active" },
                orderBy: { createdAt: "desc" },
            }),
            prisma.post.findMany({
                take: 3,
                orderBy: { date: "desc" },
                select: { id: true, title: true, description: true, date: true, classId: true },
                where: postWhereByType(PostType.ANNOUNCEMENT),
            }),
            prisma.post.findMany({
                take: 5,
                orderBy: { startTime: "desc" },
                select: { id: true, title: true, description: true, startTime: true, endTime: true, classId: true },
                where: postWhereByType(PostType.EVENT),
            }),
        ]);

        const attendanceByDay = attendanceData.reduce((acc: any, record) => {
            const day = new Date(record.date).toLocaleDateString("en-US", { weekday: "short" });
            if (!acc[day]) acc[day] = { present: 0, absent: 0 };
            if (record.present) acc[day].present++;
            else acc[day].absent++;
            return acc;
        }, {});

        const chartData = Object.entries(attendanceByDay).map(([day, data]: [string, any]) => ({
            name: day,
            present: data.present,
            absent: data.absent,
        }));

        // Ensure studentsByGender present
        if (!("studentsByGender" in roleSpecificStats)) {
            (roleSpecificStats as any).studentsByGender = await prisma.student.groupBy({
                by: ["gender"],
                where: schoolId ? { schoolId } : undefined,
                _count: { _all: true },
            });
        }

        return NextResponse.json({
            success: true,
            role,
            stats: roleSpecificStats,
            charts: {
                attendance: chartData,
                studentsByGender: (roleSpecificStats as any).studentsByGender,
            },
            currentTerm: currentTerm
                ? {
                    id: currentTerm.id,
                    session: currentTerm.session,
                    term: currentTerm.term,
                    start: currentTerm.start,
                    end: currentTerm.end,
                    nextTerm: currentTerm.nextTerm,
                    daysOpen: currentTerm.daysOpen,
                    status: currentTerm.status,
                }
                : null,
            recentActivity: {
                announcements: recentAnnouncements,
                events: recentEvents,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch statistics",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
