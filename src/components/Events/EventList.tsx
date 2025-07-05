"use client";

import { useState, useEffect, useCallback } from "react";
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

const EventList = ({ dateParam }: { dateParam: string | undefined }) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const date = dateParam ? new Date(dateParam) : new Date();

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Format date for API query
            const fromDate = new Date(date);
            fromDate.setHours(0, 0, 0, 0);
            const toDate = new Date(date);
            toDate.setHours(23, 59, 59, 999);

            const response = await fetch(`/api/events?from=${fromDate.toISOString()}&to=${toDate.toISOString()}&limit=10`, {
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
            setEvents(result.data || []);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError(err instanceof Error ? err.message : 'Failed to load events');
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        // Only fetch when date changes
        fetchEvents();
    }, [fetchEvents]);

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
                <p>Failed to load events</p>
                <button
                    onClick={fetchEvents}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
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
                <p>No events scheduled for this date</p>
                <p className="text-sm mt-1">Check other dates or add new events</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {events.map((event) => (
                <div
                    className="p-4 rounded-lg border-2 border-gray-100 border-t-4 odd:border-t-blue-400 even:border-t-purple-400 hover:shadow-sm transition-shadow cursor-pointer"
                    key={event.id}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="font-semibold text-gray-700">{event.title}</h1>
                        <span className="text-gray-400 text-xs">
                            {new Date(event.startTime).toLocaleTimeString("en-UK", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                            })}
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-2">{event.description}</p>
                    {event.class && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {event.class.name}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

export default EventList;