"use client";

import { DivideIcon as LucideIcon } from 'lucide-react';
import { Skeleton } from 'primereact/skeleton';

interface Props {
    type: string;
    icon: typeof LucideIcon;
    bgColor?: string;
    color?: string;
    delta?: string;
    deltaLabel?: string;
    data?: { count: number };
    loading?: boolean;
}

const UserCard: React.FC<Props> = ({
    type,
    icon: Icon,
    bgColor = 'bg-blue-100',
    color = 'text-blue-500',
    delta,
    deltaLabel,
    data,
    loading = false,
}) => {
    const title = type.charAt(0).toUpperCase() + type.slice(1) + 's';

    if (loading) {
        return (
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <Skeleton width="60%" height="1rem" className="mb-2" />
                        <Skeleton width="40%" height="2rem" />
                    </div>
                    <Skeleton shape="circle" size="3rem" />
                </div>
                <div className="flex justify-between items-center">
                    <Skeleton width="30%" height="0.8rem" />
                    <Skeleton width="40%" height="0.8rem" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 group">
            {/* Top: Title & Count with Icon */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <span className="block text-gray-600 font-medium text-sm mb-2 group-hover:text-gray-800 transition-colors">
                        {title}
                    </span>
                    <div className="text-gray-900 font-bold text-2xl lg:text-3xl">
                        {data?.count?.toLocaleString() || '0'}
                    </div>
                </div>
                <div className={`
                    flex items-center justify-center
                    ${bgColor} rounded-xl
                    w-12 h-12 lg:w-14 lg:h-14
                    group-hover:scale-110 transition-transform duration-300
                `}>
                    <Icon className={`${color} text-xl lg:text-2xl`} size={24} />
                </div>
            </div>

            {/* Bottom: Delta info */}
            {delta && deltaLabel && (
                <div className="flex justify-between items-center text-sm">
                    <span className="text-green-500 font-medium">
                        {delta}
                    </span>
                    <span className="text-gray-500">
                        {deltaLabel}
                    </span>
                </div>
            )}
        </div>
    );
};

export default UserCard;