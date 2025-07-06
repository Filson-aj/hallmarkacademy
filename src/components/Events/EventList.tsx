"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Skeleton } from "primereact/skeleton";

interface Event {
    id: number;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    classId?: string;
    class?: {
        name: string;
    };
}

interface EventListProps {
    dateParam: string | undefined;
}

const EventList = ({ dateParam }: EventListProps) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cache management
    const cacheRef = useRef<Map<string, { data: Event[]; timestamp: number }>>(new Map());
    const lastFetchRef = useRef<string>("");
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cache duration: 5 minutes
    const CACHE_DURATION = 5 * 60 * 1000;

    // Normalize date for consistent caching
    const normalizedDate = dateParam ? new Date(dateParam).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const fetchEvents = useCallback(async (targetDate: string, forceRefresh = false) => {
        // Check if we already have fresh cached data
        const cached = cacheRef.current.get(targetDate);
        const now = Date.now();

        if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
            setEvents(cached.data);
            setLoading(false);
            setError(null);
            return;
        }

        // Prevent duplicate requests for the same date
        if (lastFetchRef.current === targetDate && !forceRefresh) {
            return;
        }

        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        try {
            setLoading(true);
            setError(null);
            lastFetchRef.current = targetDate;

            // Create new abort controller for this request
            abortControllerRef.current = new AbortController();

            // Format date for API query
            const fromDate = new Date(targetDate);
            fromDate.setHours(0, 0, 0, 0);
            const toDate = new Date(targetDate);
            toDate.setHours(23, 59, 59, 999);

            const response = await fetch(
                `/api/events?from=${fromDate.toISOString()}&to=${toDate.toISOString()}&limit=10`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal: abortControllerRef.current.signal,
                    // Add cache control headers
                    cache: 'default'
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const eventData = result.data || [];

            // Cache the result
            cacheRef.current.set(targetDate, {
                data: eventData,
                timestamp: now
            });

            // Clean up old cache entries (keep only last 10 dates)
            if (cacheRef.current.size > 10) {
                const entries = Array.from(cacheRef.current.entries());
                entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
                cacheRef.current.clear();
                entries.slice(0, 10).forEach(([key, value]) => {
                    cacheRef.current.set(key, value);
                });
            }

            setEvents(eventData);
            lastFetchRef.current = "";
        } catch (err) {
            // Don't set error for aborted requests
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }

            console.error('Error fetching events:', err);
            setError(err instanceof Error ? err.message : 'Failed to load events');
            lastFetchRef.current = "";
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    }, []);

    // Effect to fetch events when date changes
    useEffect(() => {
        fetchEvents(normalizedDate);
    }, [normalizedDate, fetchEvents]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Manual refresh function
    const refreshEvents = useCallback(() => {
        fetchEvents(normalizedDate, true);
    }, [normalizedDate, fetchEvents]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Skeleton width="70%" height="1.2rem" />
                            <Skeleton width="20%" height="1rem" />
                        </div>
                        <Skeleton width="100%" height="2rem" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="mb-2">Failed to load events</p>
                <p className="text-sm text-gray-400 mb-4">{error}</p>
                <button
                    onClick={refreshEvents}
                    className="text-blue-600 hover:text-blue-800 text-sm underline transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📅</div>
                <p className="mb-1">No events scheduled for this date</p>
                <p className="text-sm text-gray-400 mb-4">
                    {new Date(normalizedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
                <button
                    onClick={refreshEvents}
                    className="text-blue-600 hover:text-blue-800 text-sm underline transition-colors"
                >
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Cache status indicator (only in development) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 mb-2">
                    {cacheRef.current.has(normalizedDate) ? '📋 Cached data' : '🔄 Fresh data'}
                </div>
            )}

            {events.map((event) => (
                <div
                    className="p-4 rounded-lg border-2 border-gray-100 border-t-4 odd:border-t-blue-400 even:border-t-purple-400 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                    key={event.id}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                            {event.title}
                        </h1>
                        <span className="text-gray-400 text-xs bg-gray-50 px-2 py-1 rounded-full">
                            {new Date(event.startTime).toLocaleTimeString("en-UK", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                            })}
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-2 line-clamp-2">
                        {event.description}
                    </p>
                    {event.class && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {event.class.name}
                        </span>
                    )}
                </div>
            ))}

            {/* Refresh button */}
            <div className="text-center pt-2">
                <button
                    onClick={refreshEvents}
                    className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                    title="Refresh events"
                >
                    🔄 Refresh
                </button>
            </div>
        </div>
    );
};

export default EventList;