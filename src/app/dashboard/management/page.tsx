import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FiUsers } from "react-icons/fi";
import { FaChalkboardTeacher, FaUserGraduate } from "react-icons/fa";
import { MdFamilyRestroom } from "react-icons/md";

import { authOptions } from "@/lib/auth";
import UserCard from "@/components/Card/UserCard";
import CountChartContainer from "@/components/Charts/CountChartContainer";
import AttendanceChartContainer from "@/components/Charts/AttendanceChartContainer";
import FinanceChart from "@/components/Charts/FinanceChart";
import EventCalendarContainer from "@/components/Calendar/EventCalendarContainer";
import Announcements from "@/components/Events/Announcements";

interface ManagementProps {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}

const Management = async ({ searchParams }: ManagementProps) => {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "management") {
        redirect("/auth/signin");
    }

    return (
        <section className="p-4 flex gap-4 flex-col md:flex-row">
            {/* LEFT */}
            <div className="w-full lg:w-2.5/3 flex flex-col gap-8">
                {/* USER CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <UserCard
                        type="admin"
                        icon={FiUsers}
                        bgColor=" bg-blue-100"
                        color="text-blue-500"
                        delta="24 new"
                        deltaLabel="since last visit"
                    />
                    <UserCard
                        type="teacher"
                        icon={FaChalkboardTeacher}
                        bgColor=" bg-orange-100"
                        color="text-orange-500"
                        delta="24 new"
                        deltaLabel="since last visit"
                    />
                    <UserCard
                        type="student"
                        icon={FaUserGraduate}
                        bgColor=" bg-cyan-100"
                        color="text-cyan-500"
                        delta="24 new"
                        deltaLabel="since last visit"
                    />
                    <UserCard
                        type="parent"
                        icon={MdFamilyRestroom}
                        bgColor=" bg-purple-100"
                        color="text-purple-500"
                        delta="24 new"
                        deltaLabel="since last visit"
                    />
                </div>

                {/* MIDDLE CHARTS */}
                <div className="flex gap-4 flex-col lg:flex-row">
                    <div className="w-full lg:w-2/5 h-[450px]">
                        <CountChartContainer />
                    </div>
                    <div className="w-full lg:w-3/5 h-[450px]">
                        <AttendanceChartContainer />
                    </div>
                </div>

                {/* BOTTOM CHART */}
                <div className="w-full h-[500px]">
                    <FinanceChart />
                </div>
            </div>

            {/* RIGHT */}
            <div className="w-full lg:w-1/3 flex flex-col gap-8">
                <EventCalendarContainer searchParams={searchParams} />
                <Announcements />
            </div>
        </section>
    );
};

export default Management;