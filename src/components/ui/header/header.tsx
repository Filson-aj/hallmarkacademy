'use client';

import React, { FC, useRef, useState, useEffect } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

// Type definitions for menu
export interface SubLink { name: string; link: string; }
export interface SubMenuGroup { Head: string; sublink: SubLink[]; }
export interface MenuItem { name: string; link?: string; submenu?: boolean; sublinks?: SubMenuGroup[]; }
interface HeaderProps { links: MenuItem[]; logoSrc?: string; title?: string; }

const Header: FC<HeaderProps> = ({ links, logoSrc = '/assets/logo.png', title = 'Hallmark Academy Lafia' }) => {
    const ops = useRef<Array<OverlayPanel | null>>([]);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close all panels except the one at index 'currentIdx'
    const closeOtherPanels = (currentIdx: number) => {
        ops.current.forEach((panel, idx) => {
            if (panel && idx !== currentIdx) {
                panel.hide();
            }
        });
    };

    return (
        <nav className={`fixed w-full top-0 left-0 z-50 transition-colors duration-300 ${scrolled ? 'bg-black/40 backdrop-blur-lg' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
                {/* Logo & Title */}
                <Link href="/" className="flex items-center space-x-2">
                    <Image src={logoSrc} alt="Logo" width={60} height={60} />
                    <span className={`text-gray-900 font-bold hidden sm:block text-2xl uppercase ${scrolled ? 'text-white' : 'text-gray-900'}`}>{title}</span>
                </Link>

                {/* Desktop Menu */}
                <ul className="hidden md:flex space-x-6 text-white">
                    {links.map((item, idx) => (
                        <li key={idx} className="relative">
                            {item.submenu && item.sublinks ? (
                                <>
                                    <span
                                        onMouseEnter={(e) => {
                                            closeOtherPanels(idx);
                                            ops.current[idx]?.toggle(e);
                                        }}
                                        className={`cursor-pointer hover:text-blue-500 font-medium ${scrolled ? 'text-white' : 'text-gray-900'}`}
                                    >
                                        {item.name}
                                    </span>
                                    {!scrolled && <OverlayPanel
                                        ref={(el) => { ops.current[idx] = el; }}
                                        showCloseIcon={false}
                                        dismissable={false}
                                        className="!p-0 bg-white/30 backdrop-blur-md border-white shadow-lg"
                                        style={{ minWidth: '200px' }}
                                        onMouseEnter={() => {/* keep open */ }}
                                        onMouseLeave={() => ops.current[idx]?.hide()}
                                    >
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="p-4 flex space-x-8"
                                        >
                                            {item.sublinks!.map((group, gIdx) => (
                                                <div key={gIdx} className="flex-1">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">{group.Head}</h4>
                                                    <ul>
                                                        {group.sublink.map((sub, sIdx) => (
                                                            <li key={sIdx} className="py-1">
                                                                <Link href={sub.link} className="text-gray-800 hover:text-blue-800 text-sm">
                                                                    {sub.name}
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </motion.div>
                                    </OverlayPanel>}
                                </>
                            ) : (
                                <Link href={item.link || '#'} className={`hover:text-blue-800 font-medium ${scrolled ? 'text-white' : 'text-gray-900'}`}>{item.name}</Link>
                            )}
                        </li>
                    ))}
                </ul>

                {/* Auth Button */}
                <div className="hidden md:block">
                    <Link
                        href="/auth/signin"
                        className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${scrolled
                                ? 'bg-white text-blue-900 hover:bg-gray-100'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        Sign In
                    </Link>
                </div>

                {/* Mobile toggle */}
                <button
                    className={`md:hidden focus:outline-none ${scrolled ? 'text-gray-200' : 'text-gray-900'}`}
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {mobileOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden bg-black/70 backdrop-blur-lg overflow-hidden"
                    >
                        {links.map((item, idx) => (
                            <li key={idx} className="border-b border-gray-700">
                                {item.submenu && item.sublinks ? (
                                    <details className="p-4">
                                        <summary className="cursor-pointer font-medium text-white">{item.name}</summary>
                                        <div className="mt-2 space-y-2">
                                            {item.sublinks.map((group, gIdx) => (
                                                <div key={gIdx}>
                                                    <h4 className="text-sm font-semibold text-gray-200 mb-1">{group.Head}</h4>
                                                    <ul className="pl-4">
                                                        {group.sublink.map((sub, sIdx) => (
                                                            <li key={sIdx} className="py-1">
                                                                <Link href={sub.link} className="text-gray-200 hover:text-white text-sm block">{sub.name}</Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                ) : (
                                    <Link href={item.link || '#'} className="block p-4 text-white hover:bg-gray-800">{item.name}</Link>
                                )}
                            </li>
                        ))}
                        <li className="border-b border-gray-700">
                            <Link href="/auth/signin" className="block p-4 text-white hover:bg-gray-800 font-semibold">
                                Sign In
                            </Link>
                        </li>
                    </motion.ul>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Header;