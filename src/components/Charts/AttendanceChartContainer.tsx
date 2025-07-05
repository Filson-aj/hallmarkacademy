"use client";

import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "primereact/skeleton";
import Image from "next/image";
import AttendanceChart from "./AttendanceChart";

interface AttendanceData {
    name: string;
    present: number;
    absent: number;
}

const AttendanceChartContainer = () => {
    const [data, setData] = useState<AttendanceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAttendanceData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Calculate date range for current week
            const today = new Date();
            const dayOfWeek = today.getDay();
            const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const lastMonday = new Date(today);
            lastMonday.setDate(today.getDate() - daysSinceMonday);

            const response = await fetch(`/api/attendance?from=${lastMonday.toISOString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add cache control
                cache: 'default'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const attendanceRecords = result.data || [];

            // Process attendance data
            const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];
            const attendanceMap: { [key: string]: { present: number; absent: number } } = {
                Mon: { present: 0, absent: 0 },
                Tue: { present: 0, absent: 0 },
                Wed: { present: 0, absent: 0 },
                Thu: { present: 0, absent: 0 },
                Fri: { present: 0, absent: 0 },
            };

            attendanceRecords.forEach((item: any) => {
                const itemDate = new Date(item.date);
                const dayOfWeek = itemDate.getDay();

                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    const dayName = daysOfWeek[dayOfWeek - 1];
                    if (item.present) {
                        attendanceMap[dayName].present += 1;
                    } else {
                        attendanceMap[dayName].absent += 1;
                    }
                }
            });

            const chartData = daysOfWeek.map((day) => ({
                name: day,
                present: attendanceMap[day].present,
                absent: attendanceMap[day].absent,
            }));

            setData(chartData);
        } catch (err) {
            console.error('Error fetching attendance data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');

            // Set fallback data
            const fallbackData = [
                { name: "Mon", present: 45, absent: 5 },
                { name: "Tue", present: 48, absent: 2 },
                { name: "Wed", present: 42, absent: 8 },
                { name: "Thu", present: 47, absent: 3 },
                { name: "Fri", present: 40, absent: 10 },
            ];
            setData(fallbackData);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Only fetch data once when component mounts
        fetchAttendanceData();
    }, [fetchAttendanceData]);

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-4 h-full shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton width="60%" height="1.5rem" />
                    <Skeleton shape="circle" size="1.5rem" />
                </div>
                <div className="h-80">
                    <Skeleton width="100%" height="100%" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-4 h-full shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-lg font-semibold text-gray-800">Attendance</h1>
                <Image src="/assets/moreDark.png" alt="More options" width={20} height={20} />
            </div>

            {error ? (
                <div className="flex items-center justify-center h-80 text-gray-500">
                    <div className="text-center">
                        <div className="text-4xl mb-2">📈</div>
                        <p>Failed to load attendance data</p>
                        <p className="text-sm mt-1">Showing sample data</p>
                        <button
                            onClick={fetchAttendanceData}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="h-80">
                <AttendanceChart data={data} />
            </div>
        </div>
    );
};

export default AttendanceChartContainer;