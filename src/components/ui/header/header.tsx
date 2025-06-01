"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import logo from '@/assets/logo.png';

interface NavItem {
    label: string;
    href: string;
    children?: {
        label: string;
        href: string;
        icon: React.ReactNode;
        description: string;
    }[];
}

const navigation: NavItem[] = [
    { label: 'Home', href: '/' },
    {
        label: 'About Us',
        href: '/about',
        children: [
            { label: 'Our Mission', href: '/about/mission', icon: '⚡', description: 'What drives us' },
            { label: 'Our Vision', href: '/about/vision', icon: '👁️', description: 'Where we are going' },
            { label: 'History', href: '/about/history', icon: '📚', description: 'Our journey so far' },
        ],
    },
    {
        label: 'Admissions',
        href: '/admissions',
        children: [
            { label: 'Apply Now', href: '/admissions/apply', icon: '✅', description: 'Start your application' },
            { label: 'Tuition & Fees', href: '/admissions/tuition', icon: '💰', description: 'Cost overview' },
            { label: 'Scholarships', href: '/admissions/scholarships', icon: '⭐', description: 'Funding opportunities' },
        ],
    },
    {
        label: 'Academics',
        href: '/academics',
        children: [
            { label: 'Departments', href: '/academics/departments', icon: '🏛️', description: 'Our academic units' },
            { label: 'Programs', href: '/academics/programs', icon: '🎓', description: 'Degree offerings' },
            { label: 'Curriculum', href: '/academics/curriculum', icon: '📝', description: 'Course details' },
        ],
    },
    {
        label: 'Student Life',
        href: '/student-life',
        children: [
            { label: 'Clubs & Societies', href: '/student-life/clubs', icon: '👥', description: 'Join the community' },
            { label: 'Events', href: '/student-life/events', icon: '📅', description: 'Upcoming activities' },
            { label: 'Accommodation', href: '/student-life/accommodation', icon: '🏠', description: 'Housing options' },
        ],
    },
    { label: 'Contact', href: '/contact' },
];

const Header: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={cn(
            'fixed top-0 left-0 w-full z-50 transition-all duration-300',
            isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm dark:bg-gray-900/95' : 'bg-transparent'
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="h-10 w-10 relative">
                                <Image
                                    src={logo}
                                    alt="Hallmark Academy"
                                    className="object-contain"
                                    fill
                                    sizes="40px"
                                    priority
                                />
                            </div>
                            <span className={cn(
                                'text-xl font-bold hidden sm:block',
                                isScrolled ? 'text-gray-900 dark:text-white' : 'text-white'
                            )}>
                                Hallmark Academy
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-8">
                        {navigation.map((item) => (
                            <div
                                key={item.label}
                                className="relative group"
                                onMouseEnter={() => setOpenDropdown(item.label)}
                                onMouseLeave={() => setOpenDropdown(null)}
                            >
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                        isScrolled
                                            ? 'text-gray-900 hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300'
                                            : 'text-white hover:text-gray-200'
                                    )}
                                >
                                    <span>{item.label}</span>
                                    {item.children && <ChevronDown className="h-4 w-4" />}
                                </Link>

                                {item.children && openDropdown === item.label && (
                                    <div className="absolute left-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                                        <div className="py-2">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    className="group flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                >
                                                    <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-primary-100 dark:bg-primary-900 text-xl">
                                                        {child.icon}
                                                    </span>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {child.label}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {child.description}
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <UserButton afterSignOutUrl="/" />
                    </nav>

                    {/* Mobile menu button */}
                    <div className="flex lg:hidden items-center">
                        <UserButton afterSignOutUrl="/" />
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={cn(
                                'ml-4 p-2 rounded-md',
                                isScrolled
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-white'
                            )}
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white dark:bg-gray-900">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navigation.map((item) => (
                            <div key={item.label}>
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                                    className="w-full text-left px-3 py-2 text-base font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                                >
                                    <div className="flex justify-between items-center">
                                        <span>{item.label}</span>
                                        {item.children && (
                                            <ChevronDown
                                                className={cn(
                                                    'h-4 w-4 transition-transform',
                                                    openDropdown === item.label ? 'rotate-180' : ''
                                                )}
                                            />
                                        )}
                                    </div>
                                </button>

                                {item.children && openDropdown === item.label && (
                                    <div className="pl-4 space-y-1">
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                                            >
                                                <span className="mr-2">{child.icon}</span>
                                                <span>{child.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;