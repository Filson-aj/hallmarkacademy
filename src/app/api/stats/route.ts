import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

        // BASE STATS (scoped to school for non-super)
        const baseStats = {
            students: await prisma.student.count({ where: whereSchoolOrUndefined() }),
            teachers: await prisma.teacher.count({ where: whereSchoolOrUndefined() }),
            classes: await prisma.class.count({ where: whereSchoolOrUndefined() }),
            subjects: await prisma.subject.count({ where: whereSchoolOrUndefined() }),
        };

        // Role-specific stats
        let roleSpecificStats: any = {};

        switch (role) {
            case "super":
            case "management":
            case "admin": {
                // administration counts (scoped for non-super)
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

                // schools count (global for super, otherwise the one school)
                const schoolsCount = role === "super"
                    ? await prisma.school.count()
                    : await prisma.school.count({ where: { id: schoolId } });

                // parents in school: parents who have at least one student in the school
                const parentsCount = role === "super"
                    ? await prisma.parent.count()
                    : await prisma.parent.count({
                        where: {
                            students: { some: { schoolId } },
                        },
                    });

                roleSpecificStats = {
                    ...baseStats,
                    parents: parentsCount,
                    schools: schoolsCount,
                    admins: adminCount,
                    superAdmins: superCount,
                    managementUsers: managementCount,
                    administrations: adminCount + superCount + managementCount,

                    announcements:
                        role === "super"
                            ? await prisma.announcement.count()
                            : await prisma.announcement.count({
                                where: { class: { is: { schoolId } } },
                            }),

                    events:
                        role === "super"
                            ? await prisma.event.count()
                            : await prisma.event.count({
                                where: { class: { is: { schoolId } } },
                            }),

                    lessons:
                        role === "super"
                            ? await prisma.lesson.count()
                            : await prisma.lesson.count({
                                where: { class: { is: { schoolId } } },
                            }),

                    assignments:
                        role === "super"
                            ? await prisma.assignment.count()
                            : await prisma.assignment.count({
                                where: { subject: { is: { schoolId } } },
                            }),

                    tests:
                        role === "super"
                            ? await prisma.test.count()
                            : await prisma.test.count({
                                where: { subject: { is: { schoolId } } },
                            }),

                    // Gender distribution for students (school-scoped)
                    studentsByGender: await prisma.student.groupBy({
                        by: ["gender"],
                        where: schoolId ? { schoolId } : undefined,
                        _count: { _all: true },
                    }),

                    // Recent counts (last 30 days)
                    recentStudents: await prisma.student.count({
                        where: {
                            ...(schoolId ? { schoolId } : {}),
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                    }),
                    recentTeachers: await prisma.teacher.count({
                        where: {
                            ...(schoolId ? { schoolId } : {}),
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                    }),

                    // Payments
                    totalPayments: await prisma.payment.count({
                        where: schoolId ? { schoolId } : undefined,
                    }),
                    recentPayments: await prisma.payment.count({
                        where: {
                            ...(schoolId ? { schoolId } : {}),
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                    }),

                    // Payment setup count (school-scoped)
                    paymentSetups: await prisma.paymentSetup.count({
                        where: schoolId ? { schoolId } : undefined,
                    }),

                    // Grade and assessment counts (scoped via relations)
                    grades:
                        role === "super"
                            ? await prisma.grading.count()
                            : await prisma.grading.count({
                                where: { studentGrades: { some: { class: { is: { schoolId } } } } },
                            }),

                    submissions:
                        role === "super"
                            ? await prisma.submission.count()
                            : await prisma.submission.count({
                                where: { assignment: { subject: { is: { schoolId } } } },
                            }),

                    answers:
                        role === "super"
                            ? await prisma.answer.count()
                            : await prisma.answer.count({
                                where: { test: { subject: { is: { schoolId } } } },
                            }),
                };
                break;
            }

            case "teacher": {
                const teacherId = (session.user as any)?.id as string;

                const teacherSubjects = await prisma.subject.findMany({
                    where: {
                        teacherId,
                        ...(schoolId ? { schoolId } : {}),
                    },
                    include: {
                        _count: { select: { assignments: true, tests: true, lessons: true, studentAssessments: true } },
                        teacher: { select: { id: true, firstname: true, surname: true, title: true } },
                    },
                });

                const teacherLessons = await prisma.lesson.findMany({
                    where: {
                        teacherId,
                        ...(schoolId ? { class: { is: { schoolId } } } : {}),
                    },
                    include: {
                        class: { include: { _count: { select: { students: true } } } },
                    },
                });

                const uniqueClassIds = [...new Set(teacherLessons.map((l) => (l as any).classId))];
                const totalStudents = teacherLessons.reduce((total, lesson) => {
                    return total + (((lesson as any).class as any)?._count?.students || 0);
                }, 0);

                roleSpecificStats = {
                    mySubjects: teacherSubjects.length,
                    myLessons: teacherLessons.length,
                    myStudents: totalStudents,
                    myClasses: uniqueClassIds.length,
                    myAssignments: await prisma.assignment.count({
                        where: {
                            teacherId,
                            ...(schoolId ? { subject: { is: { schoolId } } } : {}),
                        },
                    }),
                    myTests: await prisma.test.count({
                        where: {
                            teacherId,
                            ...(schoolId ? { subject: { is: { schoolId } } } : {}),
                        },
                    }),
                    pendingTests: await prisma.test.count({
                        where: {
                            teacherId,
                            status: "Pending",
                            ...(schoolId ? { subject: { is: { schoolId } } } : {}),
                        },
                    }),
                    completedTests: await prisma.test.count({
                        where: {
                            teacherId,
                            status: "Completed",
                            ...(schoolId ? { subject: { is: { schoolId } } } : {}),
                        },
                    }),
                    mySubmissions: await prisma.submission.count({
                        where: {
                            assignment: {
                                teacherId,
                                ...(schoolId ? { subject: { is: { schoolId } } } : {}),
                            },
                        },
                    }),
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
                    const classmatesCount = await prisma.student.count({
                        where: { classId: studentData.classId, id: { not: studentId } },
                    });

                    const classAssignments = await prisma.assignment.count({
                        where: {
                            students: { some: { id: studentId } },
                            ...(schoolId ? { subject: { is: { schoolId } } } : {}),
                        },
                    });

                    const classTests = await prisma.test.count({
                        where: {
                            subject: {
                                lessons: { some: { classId: studentData.classId } },
                                ...(schoolId ? { schoolId } : {}),
                            },
                        },
                    });

                    roleSpecificStats = {
                        myClass: studentData.class?.name || "Not assigned",
                        classmates: classmatesCount,
                        myAssignments: classAssignments,
                        myTests: classTests,
                        myAttendance: await prisma.attendance.count({
                            where: {
                                studentId,
                                present: true,
                                date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                                ...(schoolId ? { schoolId } : {}),
                            },
                        }),
                        totalAttendanceDays: await prisma.attendance.count({
                            where: {
                                studentId,
                                date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                                ...(schoolId ? { schoolId } : {}),
                            },
                        }),
                        mySubmissions: await prisma.submission.count({ where: { studentId } }),
                        myAnswers: await prisma.answer.count({ where: { studentId } }),
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

                roleSpecificStats = {
                    children: children.length,
                    childrenDetails: children.map((child) => ({
                        id: child.id,
                        name: `${child.firstname} ${child.surname}`,
                        class: child.class?.name || "Not assigned",
                        admissionNumber: child.admissionNumber,
                        school: child.school?.name || "Unknown",
                    })),
                    totalPayments: await prisma.payment.count({
                        where: {
                            student: { parentId },
                            ...(schoolId ? { schoolId } : {}),
                        },
                    }),
                    totalFeesPaid: totalFees,
                    recentPayments: await prisma.payment.count({
                        where: {
                            student: { parentId },
                            ...(schoolId ? { schoolId } : {}),
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        },
                    }),
                    childrenAttendance: await prisma.attendance.count({
                        where: {
                            student: { parentId },
                            present: true,
                            date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                            ...(schoolId ? { schoolId } : {}),
                        },
                    }),
                    totalAttendanceDays: await prisma.attendance.count({
                        where: {
                            student: { parentId },
                            date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                            ...(schoolId ? { schoolId } : {}),
                        },
                    }),
                };
                break;
            }

            default:
                roleSpecificStats = baseStats;
        }

        // Attendance data for charts (last 7 days) — scoped to school if applicable
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const attendanceData = await prisma.attendance.findMany({
            where: {
                date: { gte: sevenDaysAgo },
                ...(schoolId ? { schoolId } : {}),
            },
            select: { date: true, present: true },
        });

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

        // Current term (global)
        const currentTerm = await prisma.term.findFirst({
            where: { status: "Active" },
            orderBy: { createdAt: "desc" },
        });

        // Recent announcements/events (scoped)
        const recentAnnouncements = await prisma.announcement.findMany({
            take: 3,
            orderBy: { date: "desc" },
            select: { id: true, title: true, description: true, date: true, classId: true },
            where: schoolId ? { class: { is: { schoolId } } } : undefined,
        });

        const recentEvents = await prisma.event.findMany({
            take: 5,
            orderBy: { startTime: "desc" },
            select: { id: true, title: true, description: true, startTime: true, endTime: true, classId: true },
            where: schoolId ? { class: { is: { schoolId } } } : undefined,
        });

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
