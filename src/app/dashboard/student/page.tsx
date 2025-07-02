import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import Announcements from "@/components/Events/Announcements";
import BigCalendarContainer from "@/components/Calendar/BigCalendarContainer";
import EventCalendar from "@/components/Calendar/EventCalendar";
import prisma from "@/lib/prisma";

const Student = async () => {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "student") {
        redirect("/auth/signin");
    }

    const classItem = await prisma.class.findMany({
        where: {
            students: { some: { id: session.user.id } },
        },
    });

    return (
        <div className="p-4 flex gap-4 flex-col xl:flex-row">
            {/* LEFT */}
            <div className="w-full xl:w-2/3">
                <div className="h-full bg-white p-4 rounded-md">
                    <h1 className="text-xl font-semibold">Schedule ({classItem[0]?.name || "No Class"})</h1>
                    <BigCalendarContainer type="classid" id={classItem[0]?.id || ""} />
                </div>
            </div>
            {/* RIGHT */}
            <div className="w-full xl:w-1/3 flex flex-col gap-8">
                <EventCalendar />
                <Announcements />
            </div>
        </div>
    );
};

export default Student;