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
    LogOut,
    HelpCircle,
    Shield,
    Bell,
    Palette,
    Database,
    Key,
    ChevronLeft,
    ChevronRight
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
                href: '/dashboard/list/teachers',
                visible: ['admin', 'super', 'management']
            },
            {
                icon: GraduationCap,
                label: 'Students',
                href: '/dashboard/list/students',
                visible: ['admin', 'super', 'management', 'teacher']
            },
            {
                icon: UserCheck,
                label: 'Parents',
                href: '/dashboard/list/parents',
                visible: ['admin', 'super', 'management', 'teacher']
            },
            {
                icon: BookOpen,
                label: 'Subjects',
                href: '/dashboard/list/subjects',
                visible: ['admin', 'super', 'management']
            },
            {
                icon: School,
                label: 'Classes',
                href: '/dashboard/list/classes',
                visible: ['admin', 'super', 'management', 'teacher']
            },
        ],
    },
    {
        title: 'ACADEMICS',
        items: [
            {
                icon: Calendar,
                label: 'Lessons',
                href: '/dashboard/list/lessons',
                visible: ['admin', 'super', 'management', 'teacher']
            },
            {
                icon: ClipboardList,
                label: 'Exams',
                href: '/dashboard/list/exams',
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: FileText,
                label: 'Assignments',
                href: '/dashboard/list/assignments',
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: BarChart3,
                label: 'Results',
                href: '/dashboard/list/results',
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: UserCheck,
                label: 'Attendance',
                href: '/dashboard/list/attendance',
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
                href: '/dashboard/list/events',
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: MessageSquare,
                label: 'Messages',
                href: '/dashboard/list/messages',
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Megaphone,
                label: 'Announcements',
                href: '/dashboard/list/announcements',
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
                href: '/dashboard/profile',
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Settings,
                label: 'Preferences',
                href: '/dashboard/settings/preferences',
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Bell,
                label: 'Notifications',
                href: '/dashboard/settings/notifications',
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Shield,
                label: 'Security',
                href: '/dashboard/settings/security',
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Palette,
                label: 'Appearance',
                href: '/dashboard/settings/appearance',
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Database,
                label: 'Data & Privacy',
                href: '/dashboard/settings/privacy',
                visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent']
            },
            {
                icon: Key,
                label: 'API Keys',
                href: '/dashboard/settings/api',
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
    onToggle: () => void;
    onMobileItemClick?: () => void;
}

const Menu = ({ isCollapsed, onToggle, onMobileItemClick }: MenuProps) => {
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
            {/* Toggle Button - Only show on desktop */}
            <div className="hidden md:flex justify-end p-3 border-b border-gray-700">
                <button
                    onClick={onToggle}
                    className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors duration-200"
                    title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

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