"use client";

import { useEffect, useState } from "react";
import BigCalendar from "./BigCalendar";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";

type BigCalendarContainerProps = {
    type: "teacherid" | "classid";
    id: string | number;
};

interface CalendarEvent {
    title: string;
    start: string;
    end: string;
    subject?: { id: string; name: string };
    class?: { id: string; name: string };
    teacher?: { id: string; firstname: string; surname: string };
}

interface LessonResponse {
    data: {
        id: number;
        name: string;
        day: string;
        startTime: string;
        endTime: string;
        classid: string;
        teacherid: string;
        subjectid: string;
        subject: { id: string; name: string };
        class: { id: string; name: string };
        teacher: { id: string; firstname: string; surname: string };
    }[];
    total: number;
}

const BigCalendarContainer = ({ type, id }: BigCalendarContainerProps) => {
    const [schedule, setSchedule] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                setLoading(true);
                setError(null);

                const idStr = String(id);
                const response = await fetch(`/api/lessons?${type}=${idStr}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    cache: "default",
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                const data: LessonResponse = await response.json();

                if (data.data && Array.isArray(data.data)) {
                    const events = data.data
                        .map((lesson) => ({
                            title: `${lesson.name} (${lesson.subject.name}, ${lesson.class.name}, ${lesson.teacher.firstname} ${lesson.teacher.surname})`,
                            start: new Date(lesson.startTime),
                            end: new Date(lesson.endTime),
                            subject: lesson.subject,
                            class: lesson.class,
                            teacher: lesson.teacher,
                        }))
                        .filter(
                            (event) =>
                                !isNaN(event.start.getTime()) && !isNaN(event.end.getTime())
                        );

                    const adjustedSchedule = adjustScheduleToCurrentWeek(events).map(
                        (event) => ({
                            title: event.title,
                            start: event.start.toISOString(),
                            end: event.end.toISOString(),
                        })
                    );
                    setSchedule(adjustedSchedule);
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (error) {
                console.error("Error fetching lessons:", error);
                setError(
                    error instanceof Error ? error.message : "Failed to load schedule"
                );
                setSchedule([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLessons();
    }, [type, id]);

    // Filter out invalid events
    const validEvents = schedule.filter(
        (event) =>
            !isNaN(new Date(event.start).getTime()) &&
            !isNaN(new Date(event.end).getTime())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading schedule...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                    <div className="text-red-500 text-4xl mb-2">⚠️</div>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <BigCalendar data={validEvents} />
        </div>
    );
};

export default BigCalendarContainer;