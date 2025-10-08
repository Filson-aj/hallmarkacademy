import React from "react";
import { FaCog, FaPlus, FaBell, FaEye, FaBook } from "react-icons/fa";

type ComingSoonProps = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    showSidebar?: boolean;
};

const ComingSoon: React.FC<ComingSoonProps> = ({
    title = "Feature coming soon",
    subtitle = "This feature will soon be available. Check back later.",
    ctaLabel = "Get notified",
    showSidebar = true,
}) => {
    const today = new Date().toLocaleDateString();

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6 lg:p-12">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <FaCog className="w-8 h-8" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                            <p className="text-sm text-gray-500">{subtitle}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm font-medium hover:shadow-md transition"
                            aria-disabled
                        >
                            <FaPlus className="w-4 h-4" />
                            Create
                        </button>

                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl shadow hover:shadow-lg text-sm font-medium transition opacity-80 cursor-not-allowed" disabled>
                            <FaBell className="w-4 h-4" />
                            Notify
                        </button>
                    </div>
                </header>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <article className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Coming Soon</h2>
                            <span className="text-sm text-indigo-600 font-medium">Preview</span>
                        </div>

                        <p className="text-gray-600 mb-6">{subtitle}</p>

                        <div className="space-y-3">
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div className="h-3 rounded-full bg-indigo-500 w-1/3 transition-all" />
                            </div>

                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <FaEye className="w-4 h-4" />
                                <span>Preview layout</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100 inline-flex items-center gap-2">
                                    <FaEye />
                                    Preview layout
                                </button>
                                <button className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-200 inline-flex items-center gap-2">
                                    <FaBook />
                                    Docs
                                </button>
                            </div>
                        </div>
                    </article>

                    {showSidebar && (
                        <aside className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick info</h3>
                            <dl className="text-sm text-gray-600 space-y-3">
                                <div>
                                    <dt className="font-medium text-gray-800">Items</dt>
                                    <dd className="text-gray-500">—</dd>
                                </div>

                                <div>
                                    <dt className="font-medium text-gray-800">Pending</dt>
                                    <dd className="text-gray-500">—</dd>
                                </div>

                                <div>
                                    <dt className="font-medium text-gray-800">Last update</dt>
                                    <dd className="text-gray-500">{today}</dd>
                                </div>
                            </dl>

                            <div className="mt-6">
                                <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-2xl text-sm font-semibold hover:brightness-110 transition flex items-center justify-center gap-2">
                                    <FaBell />
                                    {ctaLabel}
                                </button>
                            </div>
                        </aside>
                    )}
                </section>

                <footer className="mt-10 text-center text-xs text-gray-400">© {new Date().getFullYear()} —Hallmark Academy Lafia</footer>
            </div>
        </main>
    );
};

export default ComingSoon;