import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import prisma from './prisma';

// IT APPEARS THAT BIG CALENDAR SHOWS THE LAST WEEK WHEN THE CURRENT DAY IS A WEEKEND.
// FOR THIS REASON WE'LL GET THE LAST WEEK AS THE REFERENCE WEEK.

const getLatestMonday = (): Date => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const latestMonday = today;
    latestMonday.setDate(today.getDate() - daysSinceMonday);
    return latestMonday;
};

export const adjustScheduleToCurrentWeek = (
    lessons: { title: string; start: Date; end: Date }[]
): { title: string; start: Date; end: Date }[] => {
    const latestMonday = getLatestMonday();

    return lessons.map((lesson) => {
        const lessonDayOfWeek = lesson.start.getDay();

        const daysFromMonday = lessonDayOfWeek === 0 ? 6 : lessonDayOfWeek - 1;

        const adjustedStartDate = new Date(latestMonday);

        adjustedStartDate.setDate(latestMonday.getDate() + daysFromMonday);
        adjustedStartDate.setHours(
            lesson.start.getHours(),
            lesson.start.getMinutes(),
            lesson.start.getSeconds()
        );
        const adjustedEndDate = new Date(adjustedStartDate);
        adjustedEndDate.setHours(
            lesson.end.getHours(),
            lesson.end.getMinutes(),
            lesson.end.getSeconds()
        );

        return {
            title: lesson.title,
            start: adjustedStartDate,
            end: adjustedEndDate,
        };
    });
};



export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export // Helper function to get user's school ID based on their role
    async function getUserSchoolId(session: any) {
    const { user } = session;

    switch (user.role.toLowerCase()) {
        case 'super':
            return null;

        case 'management':
        case 'admin':
            const admin = await prisma.administration.findUnique({
                where: { id: user.id },
                select: { schoolId: true }
            });
            return admin?.schoolId || null;

        case 'teacher':
            const teacher = await prisma.teacher.findUnique({
                where: { id: user.id },
                select: { schoolId: true }
            });
            return teacher?.schoolId || null;

        case 'student':
            const student = await prisma.student.findUnique({
                where: { id: user.id },
                select: { schoolId: true }
            });
            return student?.schoolId || null;

        case 'parent':
            const parent = await prisma.parent.findUnique({
                where: { id: user.id },
                include: {
                    students: {
                        select: { schoolId: true }
                    }
                }
            });
            return parent?.students.map(s => s.schoolId) || [];

        default:
            return null;
    }
}
