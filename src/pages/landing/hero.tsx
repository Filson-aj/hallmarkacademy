"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "primereact/button";
import { FaPlay, FaGraduationCap, FaUsers, FaTrophy } from "react-icons/fa";

import heroImage from "@/assets/students2.jpg";

type CssValue = string | number | undefined;

interface FloatingCardProps {
    top?: CssValue;
    left?: CssValue;
    bottom?: CssValue;
    right?: CssValue;
    children: React.ReactNode;
    float?: number;
}

interface StatItem {
    icon: React.ElementType;
    value: string;
    label: string;
    color: string;
}

const stats: StatItem[] = [
    { icon: FaGraduationCap, value: "500+", label: "Students", color: "text-yellow-300" },
    { icon: FaUsers, value: "50+", label: "Teachers", color: "text-cyan-300" },
    { icon: FaTrophy, value: "30+", label: "Awards", color: "text-orange-300" },
];

const fadeInLeft = { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } };
const fadeInRight = { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 } };

const Hero = () => {
    return (
        <section className="relative w-full min-h-screen flex items-center bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-600 text-white overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full"
                    animate={{
                        y: [0, -20, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute top-40 right-20 w-24 h-24 bg-cyan-300/20 rounded-full"
                    animate={{
                        y: [0, 20, 0],
                        x: [0, -10, 0],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute bottom-32 left-1/4 w-16 h-16 bg-white-300/30 rounded-full"
                    animate={{
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </div>

            {/* Left Content */}
            <div className="container mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10 pt-20">
                {/* Main Content */}
                <motion.div
                    className="space-y-8 my-4 p-4 border border-white/40 bg-white/6 backdrop-blur-sm rounded-xl"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <h1 className="font-extrabold leading-tight mb-3 sm:mb-4">
                            <span className="block text-xl sm:text-2xl lg:text-3xl">Welcome to</span>
                            <span className="block bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent uppercase text-5xl lg:text-8xl tracking-wide">
                                Hallmark
                            </span>
                        </h1>
                    </motion.div>

                    <motion.h2
                        className="text-xl sm:text-2xl lg:text-3xl mb-3 text-cyan-200 font-semibold border-b border-white/40 py-2 sm:py-5"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        Shaping Tomorrow's Leaders Today
                    </motion.h2>

                    <motion.p
                        className="text-basae text-justify sm:text-lg text-blue-100 leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <span className="text-5xl font-extrabold ml-4 text-yellow-400">E</span>xperience excellence in education with our innovative learning platform,
                        dedicated activities, and comprehensive curriculum designed to unlock every
                        student's potential.
                    </motion.p>

                    {/* Stats */}
                    <motion.div className="grid grid-cols-3 gap-6 py-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                        {stats.map((s, idx) => {
                            const Icon = s.icon;
                            return (
                                <div key={idx} className="text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <Icon className={`text-5xl ${s.color}`} />
                                    </div>
                                    <div className="text-3xl font-bold">{s.value}</div>
                                    <div className="text-sm text-blue-200">{s.label}</div>
                                </div>
                            );
                        })}
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 py-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.6 }}
                    >
                        <Link href="/auth/signin" className="w-full sm:w-auto">
                            <Button
                                label="Get Started"
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
                                raised
                            />
                        </Link>

                        <Link href={"/admissions/apply-now"}>
                            <Button
                                label="Apply Now"
                                className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-900 font-semibold rounded-full transition-all duration-300"
                                outlined
                            />
                        </Link>
                    </motion.div>

                </motion.div>

                {/* Right Image */}
                <motion.div
                    className="hidden lg:block relative mb-16 mx-8 lg:pb-0 lg:mx-0"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <div className="relative w-full h-96 lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl sm:shadow-none">
                        <Image
                            src={heroImage}
                            alt="Hallmark Academy students"
                            fill
                            className="object-cover object-center hero-clip"
                            sizes="(max-width: 1024px) 100vw, 66vw"
                            priority
                        />

                    </div>

                    {/* Floating cards */}
                    <motion.div
                        className="absolute -top-6 -left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl"
                        animate={{
                            y: [0, -10, 0],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                <FaGraduationCap className="text-white text-xl" />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">98%</div>
                                <div className="text-sm text-gray-600">Success Rate</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="absolute -bottom-6 -right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl"
                        animate={{
                            y: [0, 10, 0],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <FaTrophy className="text-white text-xl" />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">Award</div>
                                <div className="text-sm text-gray-600">Winning School</div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                animate={{
                    y: [0, 10, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
                    <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
                </div>
            </motion.div>
        </section>
    );
};

export default Hero;