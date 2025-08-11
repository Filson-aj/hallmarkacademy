"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Users, DollarSign, Calendar, TrendingUp, Clock, BookOpen } from "lucide-react";

import Announcements from "@/components/Events/Announcements";
import BigCalendarContainer from "@/components/Calendar/BigCalendarContainer";
import EventCalendarContainer from "@/components/Calendar/EventCalendarContainer";
import UserCard from "@/components/Card/UserCard";

interface ParentDashboardData {
    role: string;
    stats: {
        children: number;
        totalPayments: number;
        totalFeesPaid: number;
        recentPayments: number;
        childrenAttendance: number;
        totalAttendanceDays: number;
        childrenDetails: Array<{
            id: string;
            name: string;
            class: string;
            admissionNumber: string;
            school: string;
        }>;
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

const Parent = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Memoize searchParams to prevent unnecessary re-renders
    const searchParams = useMemo(() => {
        if (typeof window !== "undefined") {
            return new URLSearchParams(window.location.search);
        }
        return new URLSearchParams();
    }, []);

    // Guard to avoid repeated automatic fetches
    const fetchedRef = useRef(false);

    // Stable fetch function
    const fetchDashboardData = useCallback(async () => {
        fetchedRef.current = true;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/stats?role=parent`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                cache: "default",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setDashboardData(data);
            } else {
                throw new Error(data.details || "Failed to fetch dashboard data");
            }
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError(err instanceof Error ? err.message : "Failed to load dashboard data");

            // Set fallback data to prevent blank dashboard
            setDashboardData({
                role: "parent",
                stats: {
                    children: 0,
                    totalPayments: 0,
                    totalFeesPaid: 0,
                    recentPayments: 0,
                    childrenAttendance: 0,
                    totalAttendanceDays: 0,
                    childrenDetails: [],
                },
                charts: {
                    attendance: [],
                    studentsByGender: [],
                },
                recentActivity: {
                    announcements: [],
                    events: [],
                },
                currentTerm: null,
                timestamp: new Date().toISOString(),
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/auth/signin");
            return;
        }

        if (session.user?.role !== "parent") {
            router.push(`/dashboard/${session.user?.role}`);
            return;
        }

        if (!fetchedRef.current) {
            fetchDashboardData();
        }
    }, [status, session?.user?.role, router, fetchDashboardData]);

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

    if (!session || session.user?.role !== "parent") {
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
                        onClick={() => {
                            fetchedRef.current = false;
                            fetchDashboardData();
                        }}
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
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <TrendingUp className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                                Welcome back, {session.user?.name}
                            </h1>
                            <p className="text-gray-600">
                                Monitor your {dashboardData?.stats.children || 0} child{dashboardData?.stats.children !== 1 ? 'ren' : ''}'s progress for {dashboardData?.currentTerm?.term} Term {dashboardData?.currentTerm?.session || "Current"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* USER CARDS */}
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <UserCard
                        type="children"
                        icon={Users}
                        bgColor="bg-blue-100"
                        color="text-blue-600"
                        delta="enrolled"
                        deltaLabel="students"
                        data={{ count: dashboardData?.stats.children || 0 }}
                    />
                    <UserCard
                        type="payment"
                        icon={DollarSign}
                        bgColor="bg-green-100"
                        color="text-green-600"
                        delta={`₦${(dashboardData?.stats.totalFeesPaid || 0).toLocaleString()}`}
                        deltaLabel="total paid"
                        data={{ count: dashboardData?.stats.totalPayments || 0 }}
                    />
                    <UserCard
                        type="attendance"
                        icon={Clock}
                        bgColor="bg-orange-100"
                        color="text-orange-600"
                        delta={`${dashboardData?.stats.totalAttendanceDays ? Math.round((dashboardData.stats.childrenAttendance / dashboardData.stats.totalAttendanceDays) * 100) : 0}%`}
                        deltaLabel="attendance rate"
                        data={{ count: dashboardData?.stats.childrenAttendance || 0 }}
                    />
                    <UserCard
                        type="recent"
                        icon={BookOpen}
                        bgColor="bg-purple-100"
                        color="text-purple-600"
                        delta={`${dashboardData?.stats.recentPayments || 0} recent`}
                        deltaLabel="this month"
                        data={{ count: dashboardData?.stats.totalPayments || 0 }}
                    />
                </div>

                <div className="flex gap-6 flex-col xl:flex-row">
                    {/* LEFT COLUMN */}
                    <div className="w-full xl:w-2/3 flex flex-col gap-8">
                        {/* CHILDREN SCHEDULES */}
                        <div className="space-y-6">
                            {dashboardData?.stats.childrenDetails && dashboardData.stats.childrenDetails.length > 0 ? (
                                dashboardData.stats.childrenDetails.map((child) => (
                                    <div key={child.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Calendar className="text-blue-600" size={24} />
                                            <div>
                                                <h2 className="text-xl font-semibold text-gray-800">
                                                    {child.name}'s Schedule
                                                </h2>
                                                <p className="text-gray-600 text-sm">
                                                    {child.class} • {child.admissionNumber} • {child.school}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="h-[400px]">
                                            <BigCalendarContainer type="classid" id={child.id} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="text-center py-12">
                                        <Users size={48} className="mx-auto mb-4 text-gray-300" />
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Children Found</h3>
                                        <p className="text-gray-600">No student records found for your account.</p>
                                    </div>
                                </div>
                            )}
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

export default Parent;