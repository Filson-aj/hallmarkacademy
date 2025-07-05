"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "primereact/skeleton";

interface Announcement {
    id: number;
    title: string;
    description: string;
    date: string;
    classId?: string;
    class?: {
        name: string;
    };
}

const Announcements = () => {
    const { data: session } = useSession();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnnouncements = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/announcements?limit=5', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'default'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setAnnouncements(result.data || []);
        } catch (err) {
            console.error('Error fetching announcements:', err);
            setError(err instanceof Error ? err.message : 'Failed to load announcements');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Only fetch once when component mounts
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    if (loading) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton width="60%" height="1.5rem" />
                    <Skeleton width="20%" height="1rem" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <Skeleton width="70%" height="1.2rem" />
                                <Skeleton width="20%" height="1rem" />
                            </div>
                            <Skeleton width="100%" height="3rem" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-800">Announcements</h1>
                <span className="text-xs text-gray-400 hover:text-blue-600 cursor-pointer transition-colors">
                    View All
                </span>
            </div>

            {error ? (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📢</div>
                    <p>Failed to load announcements</p>
                    <button
                        onClick={fetchAnnouncements}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                        Retry
                    </button>
                </div>
            ) : null}

            <div className="space-y-4">
                {announcements.length === 0 && !loading && !error ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📢</div>
                        <p>No announcements available</p>
                    </div>
                ) : (
                    announcements.map((announcement, idx) => {
                        const bgColor =
                            idx === 0 ? "bg-blue-50 border-blue-200" :
                                idx === 1 ? "bg-purple-50 border-purple-200" :
                                    "bg-yellow-50 border-yellow-200";

                        const date = new Date(announcement.date);
                        const formattedDate = new Intl.DateTimeFormat("en-GB", {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        }).format(date);

                        return (
                            <div
                                key={announcement.id}
                                className={`${bgColor} rounded-lg p-4 border hover:shadow-sm transition-shadow cursor-pointer`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h2 className="font-semibold text-gray-800 text-sm lg:text-base">
                                        {announcement.title}
                                    </h2>
                                    <span className="text-xs text-gray-500 bg-white rounded-md px-2 py-1 whitespace-nowrap ml-2">
                                        {formattedDate}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                    {announcement.description}
                                </p>
                                {announcement.class && (
                                    <span className="inline-block bg-white text-gray-700 text-xs px-2 py-1 rounded-full">
                                        {announcement.class.name}
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Announcements;