"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Users, Calendar, TrendingUp, Award, Clock } from "lucide-react";

import Announcements from "@/components/Events/Announcements";
import BigCalendarContainer from "@/components/Calendar/BigCalendarContainer";
import EventCalendar from "@/components/Calendar/EventCalendar";
import UserCard from "@/components/Card/UserCard";

interface StudentDashboardData {
    overview: {
        class: string;
        classmates: number;
        assignments: number;
        tests: number;
        submissions: number;
        answers: number;
    };
    attendance: {
        present: number;
        total: number;
        percentage: number;
    };
    profile: {
        parent: {
            name: string;
            phone: string;
            email: string;
        };
        school: {
            name: string;
        };
    };
}

const Student = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [classId, setClassId] = useState<string>("");

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/auth/signin");
            return;
        }

        if (session.user.role !== "student") {
            router.push(`/dashboard/${session.user.role}`);
            return;
        }

        fetchDashboardData();
    }, [session, status, router]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/stats?role=student`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'default'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.data) {
                setDashboardData(data.data);
                // Get class ID for schedule
                const studentResponse = await fetch(`/api/students/${session?.user.id}`);
                if (studentResponse.ok) {
                    const studentData = await studentResponse.json();
                    setClassId(studentData.classid);
                }
            } else {
                throw new Error(data.details || 'Failed to fetch dashboard data');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error instanceof Error ? error.message : 'Failed to load dashboard data');

            // Set fallback data to prevent blank dashboard
            setDashboardData({
                overview: {
                    class: "Not assigned",
                    classmates: 0,
                    assignments: 0,
                    tests: 0,
                    submissions: 0,
                    answers: 0,
                },
                attendance: {
                    present: 0,
                    total: 0,
                    percentage: 0,
                },
                profile: {
                    parent: {
                        name: "Unknown",
                        phone: "",
                        email: "",
                    },
                    school: {
                        name: "Unknown",
                    },
                },
            });
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "student") {
        return null;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <section className="p-4 lg:p-6 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <TrendingUp className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                                Welcome back, {session.user.name}
                            </h1>
                            <p className="text-gray-600">
                                Class: {dashboardData?.overview.class || "Not assigned"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 flex-col xl:flex-row">
                    {/* LEFT COLUMN */}
                    <div className="w-full xl:w-2/3 flex flex-col gap-8">
                        {/* OVERVIEW CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            <UserCard
                                type="assignment"
                                icon={BookOpen}
                                bgColor="bg-blue-100"
                                color="text-blue-600"
                                delta={`${dashboardData?.overview.submissions || 0} submitted`}
                                deltaLabel="assignments"
                                data={{ count: dashboardData?.overview.assignments || 0 }}
                            />
                            <UserCard
                                type="test"
                                icon={Award}
                                bgColor="bg-green-100"
                                color="text-green-600"
                                delta={`${dashboardData?.overview.answers || 0} completed`}
                                deltaLabel="tests"
                                data={{ count: dashboardData?.overview.tests || 0 }}
                            />
                            <UserCard
                                type="classmate"
                                icon={Users}
                                bgColor="bg-purple-100"
                                color="text-purple-600"
                                delta="in your class"
                                deltaLabel="students"
                                data={{ count: dashboardData?.overview.classmates || 0 }}
                            />
                            <UserCard
                                type="attendance"
                                icon={Clock}
                                bgColor="bg-orange-100"
                                color="text-orange-600"
                                delta={`${dashboardData?.attendance.percentage || 0}%`}
                                deltaLabel="attendance rate"
                                data={{ count: dashboardData?.attendance.present || 0 }}
                            />
                        </div>

                        {/* SCHEDULE */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <Calendar className="text-blue-600" size={24} />
                                <h2 className="text-xl font-semibold text-gray-800">
                                    My Schedule ({dashboardData?.overview.class || "No Class"})
                                </h2>
                            </div>
                            <div className="h-[500px]">
                                {classId ? (
                                    <BigCalendarContainer type="classid" id={classId} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <div className="text-center">
                                            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                                            <p>No class schedule available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="w-full xl:w-1/3 flex flex-col gap-8">
                        <EventCalendar />
                        <Announcements />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Student;