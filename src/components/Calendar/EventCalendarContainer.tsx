"use client";

import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "primereact/skeleton";
import Image from "next/image";
import EventCalendar from "./EventCalendar";
import EventList from "../Events/EventList";

interface EventCalendarContainerProps {
    searchParams: { [key: string]: string | undefined };
}

const EventCalendarContainer = ({ searchParams }: EventCalendarContainerProps) => {
    const [loading, setLoading] = useState(true);

    // Memoize the date to prevent unnecessary re-renders and API calls
    const selectedDate = useMemo(() => {
        const dateParam = searchParams?.date;
        if (dateParam) {
            // Validate and normalize the date
            const parsedDate = new Date(dateParam);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString().split('T')[0];
            }
        }
        return new Date().toISOString().split('T')[0];
    }, [searchParams?.date]);

    useEffect(() => {
        // Simulate initial loading time for calendar
        const timer = setTimeout(() => {
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <Skeleton width="100%" height="300px" className="mb-4" />
                <div className="flex items-center justify-between mb-4">
                    <Skeleton width="60%" height="1.5rem" />
                    <Skeleton shape="circle" size="1.5rem" />
                </div>
                <div className="space-y-3">
                    <Skeleton width="100%" height="4rem" />
                    <Skeleton width="100%" height="4rem" />
                    <Skeleton width="100%" height="4rem" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <EventCalendar />
            <div className="flex items-center justify-between mt-4 mb-4">
                <h1 className="text-xl font-semibold text-gray-800">Events</h1>
                <Image
                    src="/assets/moreDark.png"
                    alt="More options"
                    width={20}
                    height={20}
                />
            </div>
            <div className="flex flex-col gap-4">
                <EventList dateParam={selectedDate} />
            </div>
        </div>
    );
};

export default EventCalendarContainer;