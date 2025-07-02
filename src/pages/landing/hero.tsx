"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "primereact/button";
import { FaPlay, FaGraduationCap, FaUsers, FaTrophy } from "react-icons/fa";

import heroImage from "@/assets/students2.jpg";

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
                    className="space-y-8 text-center lg:text-left"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight">
                            Welcome to{" "}
                            <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                                Hallmark Academy
                            </span>
                        </h1>
                    </motion.div>

                    <motion.h2
                        className="text-xl sm:text-2xl lg:text-3xl text-cyan-200 font-semibold"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        Shaping Tomorrow's Leaders Today
                    </motion.h2>

                    <motion.p
                        className="max-w-2xl mx-auto lg:mx-0 text-blue-100 text-lg leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        Experience excellence in education with our innovative learning platform,
                        dedicated faculty, and comprehensive curriculum designed to unlock every
                        student's potential.
                    </motion.p>

                    {/* Stats */}
                    <motion.div
                        className="grid grid-cols-3 gap-6 py-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <FaGraduationCap className="text-3xl text-yellow-300" />
                            </div>
                            <div className="text-2xl font-bold">500+</div>
                            <div className="text-sm text-blue-200">Students</div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <FaUsers className="text-3xl text-cyan-300" />
                            </div>
                            <div className="text-2xl font-bold">50+</div>
                            <div className="text-sm text-blue-200">Teachers</div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                                <FaTrophy className="text-3xl text-orange-300" />
                            </div>
                            <div className="text-2xl font-bold">15+</div>
                            <div className="text-sm text-blue-200">Awards</div>
                        </div>
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

                        <Button
                            label="Watch Demo"
                            icon={<FaPlay className="mr-2" />}
                            className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-900 font-semibold rounded-full transition-all duration-300"
                            outlined
                        />
                    </motion.div>

                </motion.div>

                {/* Right Image */}
                <motion.div
                    className="relative mb-16 mx-8 lg:pb-0 lg:mx-0"
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