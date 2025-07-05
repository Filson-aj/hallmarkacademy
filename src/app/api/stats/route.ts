import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get("role") || session.user.role;

        // Base stats that all roles can see
        const baseStats = {
            students: await prisma.student.count(),
            teachers: await prisma.teacher.count(),
            classes: await prisma.class.count(),
            subjects: await prisma.subject.count(),
        };

        // Role-specific stats
        let roleSpecificStats = {};

        switch (role) {
            case "super":
            case "management":
            case "admin":
                // Get administration counts by role
                const [adminCount, superCount, managementCount] = await Promise.all([
                    prisma.administration.count({ where: { role: "Admin" } }),
                    prisma.administration.count({ where: { role: "Super" } }),
                    prisma.administration.count({ where: { role: "Management" } })
                ]);

                // Get schools count
                const schoolsCount = await prisma.school.count();

                roleSpecificStats = {
                    ...baseStats,
                    parents: await prisma.parent.count(),
                    schools: schoolsCount,
                    admins: adminCount,
                    superAdmins: superCount,
                    managementUsers: managementCount,
                    announcements: await prisma.announcement.count(),
                    events: await prisma.event.count(),
                    lessons: await prisma.lesson.count(),
                    assignments: await prisma.assignment.count(),
                    tests: await prisma.test.count(),

                    // Gender distribution for students
                    studentsByGender: await prisma.student.groupBy({
                        by: ['gender'],
                        _count: { _all: true },
                    }),

                    // Recent activity (last 30 days)
                    recentStudents: await prisma.student.count({
                        where: {
                            createdAt: {
                                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            }
                        }
                    }),
                    recentTeachers: await prisma.teacher.count({
                        where: {
                            createdAt: {
                                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            }
                        }
                    }),

                    // Payment statistics
                    totalPayments: await prisma.payment.count(),
                    recentPayments: await prisma.payment.count({
                        where: {
                            createdAt: {
                                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            }
                        }
                    }),

                    // Payment setup count
                    paymentSetups: await prisma.paymentSetup.count(),

                    // Grade and assessment counts
                    grades: await prisma.grade.count(),
                    submissions: await prisma.submission.count(),
                    answers: await prisma.answer.count(),
                };
                break;

            case "teacher":
                // Get teacher-specific data using proper relations
                const teacherSubjects = await prisma.subject.findMany({
                    where: {
                        teachers: {
                            some: { id: session.user.id }
                        }
                    },
                    include: {
                        _count: {
                            select: {
                                assignments: true,
                                tests: true,
                                lessons: true
                            }
                        }
                    }
                });

                const teacherLessons = await prisma.lesson.findMany({
                    where: { teacherid: session.user.id },
                    include: {
                        class: {
                            include: {
                                _count: {
                                    select: { students: true }
                                }
                            }
                        }
                    }
                });

                // Get unique classes taught by this teacher
                const uniqueClassIds = [...new Set(teacherLessons.map(lesson => lesson.classid))];

                const totalStudents = teacherLessons.reduce((total, lesson) => {
                    return total + (lesson.class._count.students || 0);
                }, 0);

                roleSpecificStats = {
                    mySubjects: teacherSubjects.length,
                    myLessons: teacherLessons.length,
                    myStudents: totalStudents,
                    myClasses: uniqueClassIds.length,
                    myAssignments: await prisma.assignment.count({
                        where: { teacherid: session.user.id }
                    }),
                    myTests: await prisma.test.count({
                        where: { teacherid: session.user.id }
                    }),
                    pendingTests: await prisma.test.count({
                        where: {
                            teacherid: session.user.id,
                            status: "Pending"
                        }
                    }),
                    completedTests: await prisma.test.count({
                        where: {
                            teacherid: session.user.id,
                            status: "Completed"
                        }
                    }),
                    mySubmissions: await prisma.submission.count({
                        where: {
                            assignment: {
                                teacherid: session.user.id
                            }
                        }
                    }),
                };
                break;

            case "student":
                const studentData = await prisma.student.findUnique({
                    where: { id: session.user.id },
                    include: {
                        class: true,
                        parent: {
                            select: {
                                firstname: true,
                                surname: true,
                                phone: true,
                                email: true
                            }
                        },
                        school: {
                            select: {
                                name: true
                            }
                        }
                    }
                });

                if (studentData) {
                    const classmatesCount = await prisma.student.count({
                        where: {
                            classid: studentData.classid,
                            id: { not: session.user.id } // Exclude self
                        }
                    });

                    // Get assignments for this student's class
                    const classAssignments = await prisma.assignment.count({
                        where: {
                            students: {
                                some: { id: session.user.id }
                            }
                        }
                    });

                    // Get tests for this student's subjects
                    const classTests = await prisma.test.count({
                        where: {
                            subject: {
                                lessons: {
                                    some: {
                                        classid: studentData.classid
                                    }
                                }
                            }
                        }
                    });

                    roleSpecificStats = {
                        myClass: studentData.class?.name || "Not assigned",
                        classmates: classmatesCount,
                        myAssignments: classAssignments,
                        myTests: classTests,
                        myAttendance: await prisma.attendance.count({
                            where: {
                                studentId: session.user.id,
                                present: true,
                                date: {
                                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                                }
                            }
                        }),
                        totalAttendanceDays: await prisma.attendance.count({
                            where: {
                                studentId: session.user.id,
                                date: {
                                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                                }
                            }
                        }),
                        mySubmissions: await prisma.submission.count({
                            where: { studentId: session.user.id }
                        }),
                        myAnswers: await prisma.answer.count({
                            where: { studentid: session.user.id }
                        }),
                        parentInfo: {
                            name: `${studentData.parent.firstname} ${studentData.parent.surname}`,
                            phone: studentData.parent.phone,
                            email: studentData.parent.email
                        },
                        schoolInfo: {
                            name: studentData.school?.name || "Unknown"
                        }
                    };
                }
                break;

            case "parent":
                const children = await prisma.student.findMany({
                    where: { parentid: session.user.id },
                    include: {
                        class: {
                            select: {
                                name: true
                            }
                        },
                        school: {
                            select: {
                                name: true
                            }
                        },
                        payments: {
                            select: {
                                amount: true,
                                createdAt: true
                            }
                        }
                    }
                });

                const totalFees = children.reduce((total, child) => {
                    return total + child.payments.reduce((sum, payment) => sum + payment.amount, 0);
                }, 0);

                roleSpecificStats = {
                    children: children.length,
                    childrenDetails: children.map(child => ({
                        id: child.id,
                        name: `${child.firstname} ${child.surname}`,
                        class: child.class?.name || "Not assigned",
                        admissionNumber: child.admissionnumber,
                        school: child.school?.name || "Unknown"
                    })),
                    totalPayments: await prisma.payment.count({
                        where: {
                            student: {
                                parentid: session.user.id
                            }
                        }
                    }),
                    totalFeesPaid: totalFees,
                    recentPayments: await prisma.payment.count({
                        where: {
                            student: {
                                parentid: session.user.id
                            },
                            createdAt: {
                                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            }
                        }
                    }),
                    childrenAttendance: await prisma.attendance.count({
                        where: {
                            student: {
                                parentid: session.user.id
                            },
                            present: true,
                            date: {
                                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            }
                        }
                    }),
                    totalAttendanceDays: await prisma.attendance.count({
                        where: {
                            student: {
                                parentid: session.user.id
                            },
                            date: {
                                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            }
                        }
                    }),
                };
                break;

            default:
                roleSpecificStats = baseStats;
        }

        // Attendance data for charts (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const attendanceData = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: sevenDaysAgo
                }
            },
            select: {
                date: true,
                present: true,
            }
        });

        // Process attendance for chart
        const attendanceByDay = attendanceData.reduce((acc: any, record) => {
            const day = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' });
            if (!acc[day]) acc[day] = { present: 0, absent: 0 };
            if (record.present) {
                acc[day].present++;
            } else {
                acc[day].absent++;
            }
            return acc;
        }, {});

        const chartData = Object.entries(attendanceByDay).map(([day, data]: [string, any]) => ({
            name: day,
            present: data.present,
            absent: data.absent,
        }));

        // Get current term information
        const currentTerm = await prisma.term.findFirst({
            where: { status: "Active" },
            orderBy: { createdAt: "desc" }
        });

        // Get recent announcements
        const recentAnnouncements = await prisma.announcement.findMany({
            take: 3,
            orderBy: { date: "desc" },
            select: {
                id: true,
                title: true,
                description: true,
                date: true,
                classId: true
            }
        });

        // Get recent events
        const recentEvents = await prisma.event.findMany({
            take: 5,
            orderBy: { startTime: "desc" },
            select: {
                id: true,
                title: true,
                description: true,
                startTime: true,
                endTime: true,
                classId: true
            }
        });

        // Ensure studentsByGender is always present for charts
        if (!('studentsByGender' in roleSpecificStats)) {
            (roleSpecificStats as any).studentsByGender = [];
        }

        return NextResponse.json({
            success: true,
            role,
            stats: roleSpecificStats,
            charts: {
                attendance: chartData,
                studentsByGender: (roleSpecificStats as any).studentsByGender,
            },
            currentTerm: currentTerm ? {
                id: currentTerm.id,
                session: currentTerm.session,
                term: currentTerm.term,
                start: currentTerm.start,
                end: currentTerm.end,
                nextterm: currentTerm.nextterm,
                daysOpen: currentTerm.daysopen,
                status: currentTerm.status
            } : null,
            recentActivity: {
                announcements: recentAnnouncements,
                events: recentEvents
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch statistics",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}