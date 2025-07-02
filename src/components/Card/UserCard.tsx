import prisma from '@/lib/prisma';
import { IconType } from 'react-icons';

type UserType = 'super' | 'management' | 'admin' | 'teacher' | 'student' | 'parent' | 'class' | 'lesson' | 'subject';

interface Props {
    type: UserType;
    icon: IconType;
    bgColor?: string;
    color?: string;
    delta?: string;
    deltaLabel?: string;
}

const modelMap: Record<UserType, any> = {
    super: prisma.administration,
    management: prisma.administration,
    admin: prisma.administration,
    teacher: prisma.teacher,
    student: prisma.student,
    parent: prisma.parent,
    class: prisma.class,
    lesson: prisma.lesson,
    subject: prisma.subject,
};

const capitalize = (str = "") =>
    str.length > 0
        ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
        : "";

const UserCard: React.FC<Props> = async ({
    type,
    icon: Icon,
    bgColor = 'bg-blue-100',
    color = 'text-blue-500',
    delta,
    deltaLabel,
}) => {
    let count = 0;
    if (type === 'super' || type === 'management' || type === 'admin') {
        count = await modelMap[type].count({
            where: { role: capitalize(type) }
        });
    } else {
        count = await modelMap[type].count();
    }

    const title = capitalize(type) + (type === 'parent' ? 's' : 's');

    return (
        <div className="surface-0 shadow-lg p-3 bg-white border border-gray-100 rounded-lg flex flex-col justify-between hover:shadow-2xl hover:border-blue-600 transition-all duration-200 ease-in-out">
            {/* Top: Title & Count with Icon */}
            <div className="flex justify-between mb-3">
                <div className='flex flex-col justify-between gap-3'>
                    <span className="block text-gray-600 font-semibold mb-3">{title}</span>
                    <div className="text-gray-900 font-bold text-2xl">{count}</div>
                </div>
                <div
                    className={`
                        flex items-center justify-center
                        ${bgColor} rounded-md
                        w-10 h-10
                    `}
                >
                    <Icon className={`${color} text-xl`} />
                </div>
            </div>

            {/* Bottom: Delta info */}
            {delta && deltaLabel && (
                <div className='flex  justify-between text-sm'>
                    <span className="text-green-500 font-medium">{delta} </span>
                    <span className="text-gray-500">{deltaLabel}</span>
                </div>
            )}
        </div>
    );
};

export default UserCard;