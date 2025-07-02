import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FaUserGraduate } from "react-icons/fa";
import { MdLibraryBooks, MdSubject } from "react-icons/md";

import { authOptions } from "@/lib/auth";
import Announcements from "@/components/Events/Announcements";
import BigCalendarContainer from "@/components/Calendar/BigCalendarContainer";
import EventCalendarContainer from "@/components/Calendar/EventCalendarContainer";
import UserCard from "@/components/Card/UserCard";

interface TeacherProps {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}

const Teacher = async ({ searchParams }: TeacherProps) => {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "teacher") {
        redirect("/auth/signin");
    }

    return (
        <section className="flex-1 p-4 flex flex-col xl:flex-row gap-4">
            {/* LEFT */}
            <div className="w-full xl:w-2/3 flex flex-col gap-8">
                {/* USER CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <UserCard
                        type="student"
                        icon={FaUserGraduate}
                        bgColor=" bg-cyan-100"
                        color="text-cyan-500"
                        delta="24 new"
                        deltaLabel="since last visit"
                    />
                    <UserCard
                        type="subject"
                        icon={MdSubject}
                        bgColor=" bg-orange-100"
                        color="text-orange-500"
                        delta="24 new"
                        deltaLabel="since last visit"
                    />
                    <UserCard
                        type="lesson"
                        icon={MdLibraryBooks}
                        bgColor=" bg-purple-100"
                        color="text-purple-500"
                        delta="24 new"
                        deltaLabel="since last visit"
                    />
                </div>

                {/* SCHEDULE */}
                <div className="h-full bg-white p-4 rounded-md">
                    <h1 className="text-xl font-semibold">Schedule</h1>
                    <BigCalendarContainer type="teacherid" id={session.user.id} />
                </div>
            </div>

            {/* RIGHT */}
            <div className="w-full xl:w-1/3 flex flex-col gap-8">
                <EventCalendarContainer searchParams={searchParams} />
                <Announcements />
            </div>
        </section>
    );
};

export default Teacher;