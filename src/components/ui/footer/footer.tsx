'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaPhone, FaEnvelope, FaMapMarkerAlt, FaGraduationCap } from 'react-icons/fa';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        academics: [
            { name: 'Nursery School', href: '/academics/nursery' },
            { name: 'Primary School', href: '/academics/primary' },
            { name: 'Secondary School', href: '/academics/secondary' },
            { name: 'Curriculum', href: '/academics/curriculum' },
        ],
        admissions: [
            { name: 'How to Apply', href: '/admissions/apply' },
            { name: 'Requirements', href: '/admissions/requirements' },
            { name: 'Fees Structure', href: '/admissions/fees' },
            { name: 'Scholarships', href: '/admissions/scholarships' },
        ],
        school: [
            { name: 'About Us', href: '/about' },
            { name: 'Facilities', href: '/facilities' },
            { name: 'News & Events', href: '/news' },
        ],
        support: [
            { name: 'Contact Us', href: '/contact' },
            { name: 'Help Center', href: '/help' },
        ]
    };

    const socialLinks = [
        { icon: FaFacebookF, href: 'https://facebook.com/hallmarkacademy', color: 'hover:text-blue-600' },
        { icon: FaTwitter, href: 'https://twitter.com/hallmarkacademy', color: 'hover:text-blue-400' },
        { icon: FaInstagram, href: 'https://instagram.com/hallmarkacademy', color: 'hover:text-pink-500' },
        { icon: FaLinkedinIn, href: 'https://linkedin.com/company/hallmarkacademy', color: 'hover:text-blue-700' },
    ];

    return (
        <footer className="w-full bg-gradient-to-b from-gray-900 to-black text-white">
            {/* Main Footer Content */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* School Info */}
                    <motion.div
                        className="lg:col-span-1"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                                <FaGraduationCap className="text-xl text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Hallmark Academy</h3>
                                <p className="text-sm text-gray-400">Excellence in Education</p>
                            </div>
                        </div>

                        <p className="text-gray-300 mb-6 leading-relaxed">
                            Nurturing young minds and shaping tomorrow's leaders through quality education,
                            innovative teaching methods, and holistic development.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-gray-300">
                                <FaMapMarkerAlt className="text-blue-400 flex-shrink-0" />
                                <span className="text-sm">123 Education Lane, Lafia, Nasarawa State, Nigeria</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <FaPhone className="text-green-400 flex-shrink-0" />
                                <span className="text-sm">+234 800 123 4567</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <FaEnvelope className="text-red-400 flex-shrink-0" />
                                <span className="text-sm">hallmarkacademylafia2@gmail.com</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        viewport={{ once: true }}
                    >
                        <h4 className="text-xl font-semibold mb-6 text-blue-400">Academics</h4>
                        <ul className="space-y-3">
                            {footerLinks.academics.map((link, index) => (
                                <li key={index}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-300 inline-block"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        <h4 className="text-xl font-semibold mb-6 text-green-400">Admissions</h4>
                        <ul className="space-y-3">
                            {footerLinks.admissions.map((link, index) => (
                                <li key={index}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-300 inline-block"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        viewport={{ once: true }}
                    >
                        <h4 className="text-xl font-semibold mb-6 text-purple-400">School Life</h4>
                        <ul className="space-y-3 mb-8">
                            {footerLinks.school.map((link, index) => (
                                <li key={index}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-300 inline-block"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {/* Newsletter */}
                        <div>
                            <h5 className="text-lg font-semibold mb-4 text-yellow-400">Stay Updated</h5>
                            <p className="text-gray-400 text-sm mb-4">
                                Subscribe to our newsletter for latest updates and events.
                            </p>
                            <div className="flex flex-col gap-4">
                                <input
                                    type="email"
                                    placeholder="Your email"
                                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
                                />
                                <motion.button
                                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Subscribe
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        {/* Copyright */}
                        <motion.p
                            className="text-gray-400 text-sm text-center md:text-left"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            © {currentYear} Hallmark Academy. All rights reserved. |
                            <Link href="/privacy" className="hover:text-white ml-1">Privacy Policy</Link> |
                            <Link href="/terms" className="hover:text-white ml-1">Terms of Service</Link>
                        </motion.p>

                        {/* Social Links */}
                        <motion.div
                            className="flex gap-4"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            viewport={{ once: true }}
                        >
                            {socialLinks.map((social, index) => (
                                <motion.a
                                    key={index}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 ${social.color} transition-all duration-300 hover:scale-110`}
                                    whileHover={{ y: -2 }}
                                >
                                    <social.icon className="text-lg" />
                                </motion.a>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;