import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import LinkItem from './LinkItem';

const menuItems = [
    {
        title: 'MENU',
        items: [
            { icon: '/assets/home.png', label: 'Home', href: '/', visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent'] },
            { icon: '/assets/teacher.png', label: 'Teachers', href: '/dashboard/list/teachers', visible: ['admin', 'super', 'management', 'teacher'] },
            { icon: '/assets/student.png', label: 'Students', href: '/dashboard/list/students', visible: ['admin', 'super', 'management', 'teacher'] },
            { icon: '/assets/parent.png', label: 'Parents', href: '/dashboard/list/parents', visible: ['admin', 'super', 'management', 'teacher'] },
            { icon: '/assets/subject.png', label: 'Subjects', href: '/dashboard/list/subjects', visible: ['admin'] },
            { icon: '/assets/class.png', label: 'Classes', href: '/dashboard/list/classes', visible: ['admin', 'super', 'management', 'teacher'] },
            { icon: '/assets/lesson.png', label: 'Lessons', href: '/dashboard/list/lessons', visible: ['admin', 'super', 'management', 'teacher'] },
            { icon: '/assets/exam.png', label: 'Exams', href: '/dashboard/list/exams', visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent'] },
            { icon: '/assets/assignment.png', label: 'Assignments', href: '/dashboard/list/assignments', visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent'] },
            { icon: '/assets/result.png', label: 'Results', href: '/dashboard/list/results', visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent'] },
            { icon: '/assets/attendance.png', label: 'Attendance', href: '/dashboard/list/attendance', visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent'] },
            { icon: '/assets/calendar.png', label: 'Events', href: '/dashboard/list/events', visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent'] },
            { icon: '/assets/message.png', label: 'Messages', href: '/dashboard/list/messages', visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent'] },
            { icon: '/assets/announcement.png', label: 'Announcements', href: '/dashboard/list/announcements', visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent'] },
        ],
    },
    {
        title: 'OTHER',
        items: [
            { icon: '/assets/profile.png', label: 'Profile', href: '/dashboard/profile', visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent'] },
            { icon: '/assets/setting.png', label: 'Settings', href: '/dashboard/settings', visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent'] },
            { icon: '/assets/logout.png', label: 'Logout', href: '/auth/signout', visible: ['admin', 'super', 'management', 'teacher', 'student', 'parent'] },
        ],
    },
];

const Menu = async () => {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || 'guest';

    return (
        <aside
            className="
        p-4 h-[calc(100vh-2rem)] max-h-screen
        overflow-y-auto
        scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700
      "
        >
            <nav className="space-y-6">
                {menuItems.map(section => (
                    <div key={section.title}>
                        <h3 className="text-white/80 uppercase tracking-wider text-xs mb-2">
                            {section.title}
                        </h3>
                        <ul className="space-y-1">
                            {section.items
                                .filter(item => item.visible.includes(role))
                                .map(item => (
                                    <li key={item.label}>
                                        <LinkItem item={item} />
                                    </li>
                                ))}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Menu;