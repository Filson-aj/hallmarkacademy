import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Users, GraduationCap, School } from "lucide-react";

import { authOptions } from "@/lib/auth";
import UserCard from "@/components/Card/UserCard";
import CountChartContainer from "@/components/Charts/CountChartContainer";
import AttendanceChartContainer from "@/components/Charts/AttendanceChartContainer";
import FinanceChart from "@/components/Charts/FinanceChart";
import EventCalendarContainer from "@/components/Calendar/EventCalendarContainer";
import Announcements from "@/components/Events/Announcements";

interface DashboardStats {
    students: number;
    teachers: number;
    classes: number;
    subjects: number;
    parents: number;
    admins: number;
    recentStudents: number;
    recentTeachers: number;
    studentsByGender: Array<{ gender: string; _count: { _all: number } }>;
}

interface ManagementProps {
    searchParams: { [key: string]: string | undefined };
}

const Management = async ({ searchParams }: ManagementProps) => {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "management") {
        redirect("/auth/signin");
    }

    // Fetch stats for management dashboard
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/stats?role=management`,
        { cache: 'no-store' }
    );
    if (!res.ok) {
        redirect(`/dashboard/error?code=${res.status}`);
    }
    const { stats } = (await res.json()) as { stats: DashboardStats };

    return (
        <section className="p-4 lg:p-6 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto flex gap-6 flex-col xl:flex-row">
                {/* LEFT COLUMN */}
                <div className="w-full xl:w-2/3 flex flex-col gap-8">
                    {/* USER CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <UserCard
                            type="admin"
                            icon={Users}
                            bgColor="bg-blue-100"
                            color="text-blue-600"
                            delta={`${stats.admins} total`}
                            deltaLabel="administrators"
                            data={{ count: stats.admins }}
                        />
                        <UserCard
                            type="teacher"
                            icon={GraduationCap}
                            bgColor="bg-green-100"
                            color="text-green-600"
                            delta={`${stats.recentTeachers} new`}
                            deltaLabel="this month"
                            data={{ count: stats.teachers }}
                        />
                        <UserCard
                            type="student"
                            icon={School}
                            bgColor="bg-purple-100"
                            color="text-purple-600"
                            delta={`${stats.recentStudents} new`}
                            deltaLabel="this month"
                            data={{ count: stats.students }}
                        />
                        <UserCard
                            type="parent"
                            icon={Users}
                            bgColor="bg-orange-100"
                            color="text-orange-600"
                            delta={`${stats.parents} total`}
                            deltaLabel="registered"
                            data={{ count: stats.parents }}
                        />
                    </div>

                    {/* MIDDLE CHARTS */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-2 h-[450px]">
                            <CountChartContainer data={stats.studentsByGender} />
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
                    <EventCalendarContainer searchParams={searchParams} />
                    <Announcements />
                </div>
            </div>
        </section>
    );
};

export default Management;
