"use client";

import { useSession } from "next-auth/react";
import { Skeleton } from "primereact/skeleton";
import {
    Home,
    Users,
    GraduationCap,
    UserCheck,
    BookOpen,
    School,
    Calendar,
    ClipboardList,
    FileText,
    BarChart3,
    MessageSquare,
    Megaphone,
    User,
    Settings,
    HelpCircle,
    Shield,
    Bell,
    Palette,
    Database,
    Key,
    CalendarDays

} from "lucide-react";
import LinkItem from './LinkItem';

const menuItems = [
    {
        title: 'DASHBOARD',
        items: [
            {
                icon: Home,
                label: 'Dashboard',
                href: (role: string) => `/dashboard/${role}`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: BarChart3,
                label: 'Analytics',
                href: '/dashboard/analytics',
                visible: ['admin', 'super', 'management']
            },
        ],
    },
    {
        title: 'MANAGEMENT',
        items: [
            {
                icon: Users,
                label: 'Teachers',
                href: (role: string) => `/${role}/teachers`,
                visible: ['admin', 'super', 'management']
            },
            {
                icon: GraduationCap,
                label: 'Students',
                href: (role: string) => `/${role}/students`,
                visible: ['admin', 'super', 'management', 'teacher']
            },
            {
                icon: UserCheck,
                label: 'Parents',
                href: (role: string) => `/${role}/parents`,
                visible: ['admin', 'super', 'management', 'teacher']
            },
            {
                icon: BookOpen,
                label: 'Subjects',
                href: (role: string) => `/${role}/subjects`,
                visible: ['admin', 'super', 'management']
            },
            {
                icon: GraduationCap,
                label: 'Classes',
                href: (role: string) => `/${role}/classes`,
                visible: ['admin', 'super', 'management', 'teacher']
            },
            {
                icon: CalendarDays,
                label: 'Terms',
                href: (role: string) => `/${role}/terms`,
                visible: ['admin', 'super', 'management',]
            },
            {
                icon: School,
                label: 'Schools',
                href: (role: string) => `/${role}/schools`,
                visible: ['super', 'management']
            },
        ],
    },
    {
        title: 'ACADEMICS',
        items: [
            {
                icon: Calendar,
                label: 'Lessons',
                href: (role: string) => `/${role}/lessons`,
                visible: ['admin', 'super', 'management', 'teacher']
            },
            {
                icon: ClipboardList,
                label: 'Exams',
                href: (role: string) => `/${role}/exams`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: FileText,
                label: 'Assignments',
                href: (role: string) => `/${role}/assignments`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: BarChart3,
                label: 'Results',
                href: (role: string) => `/${role}/results`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: UserCheck,
                label: 'Attendance',
                href: (role: string) => `/${role}/attendance`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
        ],
    },
    {
        title: 'COMMUNICATION',
        items: [
            {
                icon: Calendar,
                label: 'Events',
                href: (role: string) => `/${role}/events`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: MessageSquare,
                label: 'Messages',
                href: (role: string) => `/${role}/messages`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Megaphone,
                label: 'Announcements',
                href: (role: string) => `/${role}/announcements`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
        ],
    },
    {
        title: 'SETTINGS',
        items: [
            {
                icon: User,
                label: 'Profile',
                href: (role: string) => `/${role}/settings/profile`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Settings,
                label: 'Preferences',
                href: (role: string) => `/${role}/settings/preferences`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Bell,
                label: 'Notifications',
                href: (role: string) => `/${role}/settings/notifications`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Shield,
                label: 'Security',
                href: (role: string) => `/${role}/settings/security`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Palette,
                label: 'Appearance',
                href: (role: string) => `/${role}/settings/appearance`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Database,
                label: 'Data & Privacy',
                href: (role: string) => `/${role}/settings/privacy`,
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Key,
                label: 'API Keys',
                href: (role: string) => `/${role}/settings/api`,
                visible: ['admin', 'super', 'management']
            },
            {
                icon: HelpCircle,
                label: 'Help & Support',
                href: '/dashboard/help',
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
        ],
    },
];

interface MenuProps {
    isCollapsed: boolean;
    onMobileItemClick?: () => void;
}

const Menu = ({ isCollapsed, onMobileItemClick }: MenuProps) => {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <aside className={`h-full space-y-6 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
                {/* Toggle Button Skeleton */}
                <div className="flex justify-end p-3">
                    <Skeleton shape="circle" size="2rem" />
                </div>

                {[1, 2, 3].map((section) => (
                    <div key={section} className="px-3">
                        {!isCollapsed && <Skeleton width="60%" height="0.8rem" className="mb-3" />}
                        <div className="space-y-2">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="flex items-center gap-3 p-2">
                                    <Skeleton shape="circle" size="1.5rem" />
                                    {!isCollapsed && <Skeleton width="70%" height="1rem" />}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </aside>
        );
    }

    const role = session?.user?.role || 'guest';

    return (
        <aside className={`h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
            <nav className="p-3 space-y-6">
                {menuItems.map(section => {
                    const visibleItems = section.items.filter(item => item.visible.includes(role));

                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={section.title}>
                            {!isCollapsed && (
                                <h3 className="text-white/70 uppercase tracking-wider text-xs mb-3 px-3 font-semibold">
                                    {section.title}
                                </h3>
                            )}
                            <ul className="space-y-1">
                                {visibleItems.map(item => (
                                    <li key={item.label}>
                                        <LinkItem
                                            item={{
                                                ...item,
                                                href: typeof item.href === 'function' ? item.href(role) : item.href
                                            }}
                                            isCollapsed={isCollapsed}
                                            onMobileClick={onMobileItemClick}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Menu;