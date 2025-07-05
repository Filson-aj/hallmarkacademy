import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { School, BookOpen, Calendar } from "lucide-react";

import { authOptions } from "@/lib/auth";
import Announcements from "@/components/Events/Announcements";
import BigCalendarContainer from "@/components/Calendar/BigCalendarContainer";
import EventCalendarContainer from "@/components/Calendar/EventCalendarContainer";
import UserCard from "@/components/Card/UserCard";

interface TeacherProps {
    searchParams: { [key: string]: string | undefined };
}

const Teacher = async ({ searchParams }: TeacherProps) => {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "teacher") {
        redirect("/auth/signin");
    }

    return (
        <section className="p-4 lg:p-6 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto flex gap-6 flex-col xl:flex-row">
                {/* LEFT COLUMN */}
                <div className="w-full xl:w-2/3 flex flex-col gap-8">
                    {/* USER CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <UserCard
                            type="student"
                            icon={School}
                            bgColor="bg-cyan-100"
                            color="text-cyan-600"
                            delta="24 new"
                            deltaLabel="since last visit"
                        />
                        <UserCard
                            type="subject"
                            icon={BookOpen}
                            bgColor="bg-orange-100"
                            color="text-orange-600"
                            delta="24 new"
                            deltaLabel="since last visit"
                        />
                        <UserCard
                            type="lesson"
                            icon={Calendar}
                            bgColor="bg-purple-100"
                            color="text-purple-600"
                            delta="24 new"
                            deltaLabel="since last visit"
                        />
                    </div>

                    {/* SCHEDULE */}
                    <div className="bg-white p-4 rounded-md">
                        <h2 className="text-xl font-semibold mb-4">Schedule</h2>
                        <BigCalendarContainer type="teacherid" id={session.user.id} />
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

export default Teacher;
