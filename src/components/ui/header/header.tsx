'use client';

import React, { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown, User, Info, Newspaper, Phone } from 'lucide-react';

interface HeaderProps {
    logoSrc?: string;
    title?: string;
}

interface MenuSection {
    label: string;
    items: { label: string; url: string }[];
}

interface MenuItem {
    label: string;
    icon: React.ReactNode;
    sections: MenuSection[];
}

const Header: FC<HeaderProps> = ({
    logoSrc = '/assets/logo.png',
    title = 'Hallmark Academy Lafia'
}) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const menuItems: MenuItem[] = [
        {
            label: 'Admission',
            icon: <User size={16} />,
            sections: [
                {
                    label: 'Application Process',
                    items: [
                        { label: 'Apply Now', url: '/admissions/admission-apply' },
                        { label: 'Requirements', url: '/admissions/admission-requirements' },
                        { label: 'Check Admission', url: '/admissions/admission-check' }
                    ]
                },
                {
                    label: 'Fees & Scholarship',
                    items: [
                        { label: 'Schedule of fees', url: '/schedule-fees' },
                        { label: 'Available Scholarship', url: '/available-scholarship' }
                    ]
                }
            ]
        },
        {
            label: 'About Us',
            icon: <Info size={16} />,
            sections: [
                {
                    label: 'Leadership',
                    items: [
                        { label: 'The Proprietor', url: '/abouts/about-proprietor' },
                        { label: 'The Principal', url: '/abouts/about-principal' },
                        { label: 'The Head Master', url: '/abouts/about-head-master' },
                        { label: 'The Nursery Head', url: '/abouts/about-nursery-head' }
                    ]
                },
                {
                    label: 'Our Story',
                    items: [
                        { label: 'Our Mission', url: 'our-story/mission' },
                        { label: 'Our Vision', url: 'our-story/vision' }
                    ]
                },
                {
                    label: 'School Sections',
                    items: [
                        { label: 'The Nursery School', url: '/school/nursery-school' },
                        { label: 'The Primary School', url: '/school/primary-school' },
                        { label: 'The Junior School', url: '/school/junior-school' },
                        { label: 'The Senior School', url: '/school/senior-school' }
                    ]
                }
            ]
        },
        {
            label: 'News & Media',
            icon: <Newspaper size={16} />,
            sections: [
                {
                    label: 'Latest Updates',
                    items: [
                        { label: 'School News', url: '/news/school-news' },
                        { label: 'School Newsletter', url: '/news/school-news-letter' },
                        { label: 'Photo Gallery', url: '/news/photo-gallery' }
                    ]
                }
            ]
        },
        {
            label: 'Contact Us',
            icon: <Phone size={16} />,
            sections: [
                {
                    label: 'Get in Touch',
                    items: [
                        { label: 'Contact Us', url: '/contact-us' },
                        { label: 'Subscribe', url: '/contact-subscribe' }
                    ]
                }
            ]
        }
    ];

    const handleDropdownToggle = (label: string) => setActiveDropdown(activeDropdown === label ? null : label);
    const closeDropdown = () => setActiveDropdown(null);

    return (
        <>
            <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/40 backdrop-blur-2xl shadow-lg border-none' : 'bg-transparent'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-3 flex-shrink-0">
                            <Image src={logoSrc} alt="Logo" width={40} height={40} className="lg:w-12 lg:h-12 rounded-lg shadow-sm" />
                            <span className={`font-bold text-lg xl:text-xl uppercase tracking-wide transition-colors duration-300 ${scrolled ? 'text-gray-100' : 'text-white'
                                }`}>{title}</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-1">
                            {menuItems.map((item) => {
                                const cols = item.sections.length;
                                return (
                                    <div key={item.label} className="relative group">
                                        <button
                                            onClick={() => handleDropdownToggle(item.label)}
                                            onMouseEnter={() => setActiveDropdown(item.label)}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${scrolled ? 'text-gray-100 hover:text-blue-600 hover:bg-blue-50' : 'text-white hover:text-blue-200 hover:bg-white/10'
                                                }`}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                            <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === item.label ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <div
                                            className={`absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-x-auto transition-all duration-200 ${activeDropdown === item.label ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                                                }`}
                                            onMouseLeave={closeDropdown}
                                            style={{
                                                maxWidth: 'calc(100vw - 2rem)',
                                            }}
                                        >
                                            <div
                                                className="p-6"
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: `repeat(${cols}, minmax(200px, 1fr))`,
                                                    gap: '1.5rem'
                                                }}
                                            >
                                                {item.sections.map((section) => (
                                                    <div key={section.label} className="flex flex-col">
                                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                                                            {section.label}
                                                        </h3>
                                                        <div className="space-y-1">
                                                            {section.items.map((link) => (
                                                                <Link
                                                                    key={link.url}
                                                                    href={link.url}
                                                                    className="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150 whitespace-nowrap"
                                                                    onClick={closeDropdown}
                                                                >
                                                                    {link.label}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </nav>

                        {/* Sign In & Mobile Toggle */}
                        <div className="flex items-center">
                            <Link
                                href="/auth/signin"
                                className={`hidden lg:inline-flex items-center px-6 py-2.5 rounded-full font-semibold transition-all duration-300 ${scrolled ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg' : 'bg-white text-blue-900 hover:bg-gray-100 shadow-lg'
                                    }`}
                            >
                                Sign In
                            </Link>
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className={`lg:hidden p-2 rounded-lg transition-colors duration-200 ${scrolled ? 'text-gray-100' : 'text-white hover:bg-white/10'
                                    }`}
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    <div className="fixed top-0 left-0 h-full w-[80%] sm:w-[85%] bg-white z-50 transform transition-transform duration-300 lg:hidden shadow-2xl">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <Image src={logoSrc} alt="Logo" width={32} height={32} className="rounded-lg" />
                                    <span className="font-bold text-gray-700 text-lg sm:text-xl">{title}</span>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 hidden hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <nav className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-6">
                                    {menuItems.map((item) => (
                                        <div key={item.label}>
                                            <div className="flex items-center space-x-3 mb-4">
                                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">{item.icon}</div>
                                                <h3 className="font-semibold text-gray-900">{item.label}</h3>
                                            </div>
                                            <div className="space-y-4 ml-4">
                                                {item.sections.map((section) => (
                                                    <div key={section.label}>
                                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">{section.label}</h4>
                                                        <div className="space-y-1">
                                                            {section.items.map((link) => (
                                                                <Link
                                                                    key={link.url}
                                                                    href={link.url}
                                                                    className="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                                                                    onClick={() => setMobileMenuOpen(false)}
                                                                >
                                                                    {link.label}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </nav>

                            <div className="p-6 border-t border-gray-100">
                                <Link
                                    href="/auth/signin"
                                    className="block w-full text-center px-6 py-3 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Header;
