"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendarAlt, FaUser, FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface NewsItem {
    id: string;
    title: string;
    publishedAt: string;
    author: string;
    excerpt: string;
    image: string;
    category: string;
    readTime: number;
}

const categories = ["All", "ACHIEVEMENT", "SPORTS", "FACILITIES", "ARTS", "EDUCATION", "COMMUNITY"];

const News: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [visibleNews, setVisibleNews] = useState(3);
    const [newsData, setNewsData] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews();
    }, [selectedCategory]);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const categoryParam = selectedCategory === "All" ? "" : `&category=${selectedCategory}`;
            const response = await fetch(`/api/news?status=PUBLISHED&limit=20${categoryParam}`);
            const data = await response.json();

            if (data.data) {
                const formattedNews = data.data.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    publishedAt: new Date(item.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    author: item.author,
                    excerpt: item.excerpt || item.content.substring(0, 150) + '...',
                    image: item.image || '/assets/students2.jpg',
                    category: item.category,
                    readTime: item.readTime || 3,
                }));
                setNewsData(formattedNews);
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            // Fallback to empty array if API fails
            setNewsData([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredNews = newsData;

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % Math.max(1, filteredNews.length - 2));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + Math.max(1, filteredNews.length - 2)) % Math.max(1, filteredNews.length - 2));
    };

    const loadMore = () => {
        setVisibleNews(prev => Math.min(prev + 3, filteredNews.length));
    };

    if (loading) {
        return (
            <section className="w-full py-20 bg-gradient-to-b from-blue-50 via-white to-gray-900">
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading latest news...</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-20 bg-gradient-to-b from-blue-50 via-white to-gray-900 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute top-40 left-20 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute bottom-40 right-20 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, -40, 0],
                        y: [0, 40, 0],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <motion.h2
                        className="text-5xl sm:text-6xl font-bold mb-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Latest News
                        </span>{" "}
                        <span className="text-gray-800">& Updates</span>
                    </motion.h2>
                    <motion.p
                        className="text-xl text-gray-600 max-w-3xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        viewport={{ once: true }}
                    >
                        Stay informed about the latest happenings, achievements, and exciting developments at Hallmark Academy.
                    </motion.p>
                </motion.div>

                {/* Category Filter */}
                <motion.div
                    className="flex flex-wrap justify-center gap-3 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    {categories.map((category) => (
                        <motion.button
                            key={category}
                            onClick={() => {
                                setSelectedCategory(category);
                                setCurrentSlide(0);
                                setVisibleNews(3);
                            }}
                            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${selectedCategory === category
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {category === "All" ? "All" : category.charAt(0) + category.slice(1).toLowerCase()}
                        </motion.button>
                    ))}
                </motion.div>

                {/* News Content */}
                {filteredNews.length === 0 ? (
                    <motion.div
                        className="text-center py-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <div className="text-6xl mb-4">📰</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">No News Available</h3>
                        <p className="text-gray-600">Check back later for the latest updates and announcements.</p>
                    </motion.div>
                ) : (
                    <>
                        {/* Featured News Carousel */}
                        <motion.div
                            className="relative mb-16"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            viewport={{ once: true }}
                        >
                            <div className="rounded-3xl overflow-visible lg:overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentSlide}
                                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                                        initial={{ opacity: 0, x: 300 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -300 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {filteredNews.slice(currentSlide, currentSlide + 3).map((news, index) => (
                                            <motion.div
                                                key={news.id}
                                                className={`group cursor-pointer overflow-visible ${index === 1 ? 'lg:scale-105 lg:z-20' : 'lg:scale-95'
                                                    }`}
                                                whileHover={{ y: -10, scale: index === 1 ? 1.08 : 1.02 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full">
                                                    {/* Image */}
                                                    <div className="relative h-48 lg:h-56 overflow-hidden">
                                                        <Image
                                                            src={news.image}
                                                            alt={news.title}
                                                            fill
                                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                                                        {/* Category Badge */}
                                                        <div className="absolute top-4 left-4">
                                                            <span className="bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                                                                {news.category.charAt(0) + news.category.slice(1).toLowerCase()}
                                                            </span>
                                                        </div>

                                                        {/* Read Time */}
                                                        <div className="absolute top-4 right-4">
                                                            <span className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                                                                {news.readTime} min read
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="p-6">
                                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                                            <div className="flex items-center gap-1">
                                                                <FaCalendarAlt />
                                                                <span>{news.publishedAt}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <FaUser />
                                                                <span>{news.author}</span>
                                                            </div>
                                                        </div>

                                                        <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                                                            {news.title}
                                                        </h3>

                                                        <p className="text-gray-600 mb-4 line-clamp-3">
                                                            {news.excerpt}
                                                        </p>

                                                        <motion.button
                                                            className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all duration-300"
                                                            whileHover={{ x: 5 }}
                                                        >
                                                            Read More
                                                            <FaArrowRight className="text-sm" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation Buttons */}
                            {filteredNews.length > 3 && (
                                <>
                                    <motion.button
                                        onClick={prevSlide}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors duration-300"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <FaChevronLeft />
                                    </motion.button>
                                    <motion.button
                                        onClick={nextSlide}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors duration-300"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <FaChevronRight />
                                    </motion.button>
                                </>
                            )}
                        </motion.div>

                        {/* Load More Section */}
                        {filteredNews.length > visibleNews && (
                            <motion.div
                                className="text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                viewport={{ once: true }}
                            >
                                <motion.button
                                    onClick={loadMore}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Load More News
                                </motion.button>
                            </motion.div>
                        )}
                    </>
                )}

                {/* Newsletter Subscription */}
                <motion.div
                    className="mt-20 bg-gradient-to-r from-gray-900 to-black rounded-3xl p-8 lg:p-12 text-white"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    <div className="text-center max-w-3xl mx-auto">
                        <h3 className="text-3xl lg:text-4xl font-bold mb-4">
                            Stay in the Loop
                        </h3>
                        <p className="text-xl mb-8 opacity-90">
                            Subscribe to our newsletter and never miss important updates, events, and achievements from Hallmark Academy.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                className="flex-1 px-6 py-4 rounded-full border text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                            <motion.button
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Subscribe
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default News;