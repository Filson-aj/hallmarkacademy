import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/generated/prisma";

import prisma from "@/lib/prisma";

const Announcements = async () => {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const role = session?.user?.role;

    // Strongly type each role-to-filter mapping
    const roleConditions: Record<
        "teacher" | "student" | "parent",
        Prisma.ClassWhereInput
    > = {
        teacher: { lessons: { some: { teacherid: userId! } } },
        student: { students: { some: { id: userId! } } },
        parent: { students: { some: { parentid: userId! } } },
    };

    //Type guard: narrow `role` so TS knows it's one of the keys
    function isRoleKey(
        r: string | undefined
    ): r is keyof typeof roleConditions {
        return !!r && r in roleConditions;
    }

    //Build a typed `where` object
    const where: Prisma.AnnouncementWhereInput = {};

    if (role !== "admin" && role !== "super" && role !== "management" && isRoleKey(role)) {
        where.OR = [
            { classId: null },
            { class: roleConditions[role] },
        ];
    }

    const data = await prisma.announcement.findMany({
        take: 3,
        orderBy: { date: "desc" },
        where,
    });

    return (
        <div className="bg-white p-4 rounded-md">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Announcements</h1>
                <span className="text-xs text-gray-400">View All</span>
            </div>
            <div className="flex flex-col gap-4 mt-4">
                {data.map((ann, idx) => {
                    const bg =
                        idx === 0 ? "bg-lamaSkyLight" :
                            idx === 1 ? "bg-lamaPurpleLight" :
                                "bg-lamaYellowLight";

                    return (
                        <div key={ann.id} className={`${bg} rounded-md p-4`}>
                            <div className="flex items-center justify-between">
                                <h2 className="font-medium">{ann.title}</h2>
                                <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                                    {new Intl.DateTimeFormat("en-GB").format(ann.date)}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                                {ann.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Announcements;