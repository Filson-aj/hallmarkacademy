"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Users, GraduationCap, School, BookOpen, TrendingUp, Calendar, DollarSign } from "lucide-react";

import UserCard from "@/components/Card/UserCard";
import CountChartContainer from "@/components/Charts/CountChartContainer";
import AttendanceChartContainer from "@/components/Charts/AttendanceChartContainer";
import FinanceChart from "@/components/Charts/FinanceChart";
import EventCalendarContainer from "@/components/Calendar/EventCalendarContainer";
import Announcements from "@/components/Events/Announcements";

interface DashboardData {
    stats: {
        students: number;
        teachers: number;
        parents: number;
        classes: number;
        subjects: number;
        schools: number;
        admins: number;
        superAdmins: number;
        managementUsers: number;
        announcements: number;
        events: number;
        lessons: number;
        assignments: number;
        tests: number;
        recentStudents: number;
        recentTeachers: number;
        totalPayments: number;
        recentPayments: number;
        paymentSetups: number;
        grades: number;
        submissions: number;
        answers: number;
        studentsByGender: Array<{ gender: string; _count: { _all: number } }>;
    };
    charts: {
        attendance: Array<{ name: string; present: number; absent: number }>;
        studentsByGender: Array<{ gender: string; _count: { _all: number } }>;
    };
    recentActivity: {
        announcements: Array<{
            id: string;
            title: string;
            description: string;
            date: string;
            classId: string | null;
        }>;
        events: Array<{
            id: string;
            title: string;
            description: string;
            startTime: string;
            endTime: string;
            classid: string | null;
        }>;
    };
    currentTerm: {
        id: string;
        session: string;
        term: string;
        start: string;
        end: string;
        nextterm: string;
        daysOpen: number;
        status: string;
    } | null;
    timestamp: string;
}

const Management = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Memoize searchParams to prevent unnecessary re-renders
    const searchParams = useMemo(() => {
        if (typeof window !== 'undefined') {
            return new URLSearchParams(window.location.search);
        }
        return new URLSearchParams();
    }, []);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/auth/signin");
            return;
        }

        if (session.user.role !== "management") {
            router.push(`/dashboard/${session.user.role}`);
            return;
        }

        fetchDashboardData();
    }, [session, status, router]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/stats?role=management`, {
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

            if (data.success) {
                setDashboardData(data);
            } else {
                throw new Error(data.details || 'Failed to fetch dashboard data');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error instanceof Error ? error.message : 'Failed to load dashboard data');

            // Set fallback data to prevent blank dashboard
            setDashboardData({
                stats: {
                    students: 0,
                    teachers: 0,
                    parents: 0,
                    classes: 0,
                    subjects: 0,
                    schools: 0,
                    admins: 0,
                    superAdmins: 0,
                    managementUsers: 0,
                    announcements: 0,
                    events: 0,
                    lessons: 0,
                    assignments: 0,
                    tests: 0,
                    recentStudents: 0,
                    recentTeachers: 0,
                    totalPayments: 0,
                    recentPayments: 0,
                    paymentSetups: 0,
                    grades: 0,
                    submissions: 0,
                    answers: 0,
                    studentsByGender: []
                },
                charts: {
                    attendance: [],
                    studentsByGender: []
                },
                recentActivity: {
                    announcements: [],
                    events: []
                },
                currentTerm: null,
                timestamp: new Date().toISOString()
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

    if (!session || session.user.role !== "management") {
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
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                            <TrendingUp className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                                Welcome back, {session.user.name}
                            </h1>
                            <p className="text-gray-600">
                                Here's your management overview for {dashboardData?.currentTerm?.term} Term {dashboardData?.currentTerm?.session || 'Current'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 flex-col xl:flex-row">
                    {/* LEFT COLUMN */}
                    <div className="w-full xl:w-2/3 flex flex-col gap-8">
                        {/* USER CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            <UserCard
                                type="school"
                                icon={School}
                                bgColor="bg-blue-100"
                                color="text-blue-600"
                                delta={`${dashboardData?.stats.schools || 0} total`}
                                deltaLabel="managed"
                                data={{ count: dashboardData?.stats.schools || 0 }}
                            />
                            <UserCard
                                type="teacher"
                                icon={GraduationCap}
                                bgColor="bg-green-100"
                                color="text-green-600"
                                delta={`${dashboardData?.stats.recentTeachers || 0} new`}
                                deltaLabel="this month"
                                data={{ count: dashboardData?.stats.teachers || 0 }}
                            />
                            <UserCard
                                type="student"
                                icon={Users}
                                bgColor="bg-purple-100"
                                color="text-purple-600"
                                delta={`${dashboardData?.stats.recentStudents || 0} new`}
                                deltaLabel="this month"
                                data={{ count: dashboardData?.stats.students || 0 }}
                            />
                            <UserCard
                                type="payment"
                                icon={DollarSign}
                                bgColor="bg-orange-100"
                                color="text-orange-600"
                                delta={`${dashboardData?.stats.recentPayments || 0} recent`}
                                deltaLabel="this month"
                                data={{ count: dashboardData?.stats.totalPayments || 0 }}
                            />
                        </div>

                        {/* MIDDLE CHARTS */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-2 h-[450px]">
                                <CountChartContainer data={dashboardData?.charts.studentsByGender} />
                            </div>
                            <div className="lg:col-span-3 h-[450px]">
                                <AttendanceChartContainer />
                            </div>
                        </div>

                        {/* BOTTOM CHART */}
                        <div className="w-full h-[500px]">
                            <FinanceChart />
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="w-full xl:w-1/3 flex flex-col gap-8">
                        <EventCalendarContainer searchParams={Object.fromEntries(searchParams)} />
                        <Announcements />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Management;