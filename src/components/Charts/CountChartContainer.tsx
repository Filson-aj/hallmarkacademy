"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "primereact/skeleton";
import { MoreHorizontal } from "lucide-react";
import CountChart from "./CountChart";

interface StudentData {
    boys: number;
    girls: number;
}

interface CountChartContainerProps {
    data?: Array<{ gender: string; _count: { _all: number } }>;
}

const CountChartContainer = ({ data: propData }: CountChartContainerProps) => {
    const [data, setData] = useState<StudentData>({ boys: 0, girls: 0 });
    const [loading, setLoading] = useState(!propData);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (propData) {
            // Use provided data
            const boys = propData.find(item => item.gender === 'MALE')?._count._all || 0;
            const girls = propData.find(item => item.gender === 'FEMALE')?._count._all || 0;
            setData({ boys, girls });
            setLoading(false);
        } else {
            // Fetch data if not provided
            fetchStudentData();
        }
    }, [propData]);

    const fetchStudentData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/students?limit=1000');
            if (!response.ok) {
                throw new Error('Failed to fetch student data');
            }

            const result = await response.json();
            const students = result.data || [];

            const boys = students.filter((student: any) => student.gender === 'MALE').length;
            const girls = students.filter((student: any) => student.gender === 'FEMALE').length;

            setData({ boys, girls });
        } catch (err) {
            console.error('Error fetching student data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
            setData({ boys: 20, girls: 40 });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl w-full h-full p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton width="60%" height="1.5rem" />
                    <Skeleton shape="circle" size="1.5rem" />
                </div>
                <div className="flex items-center justify-center h-64">
                    <Skeleton shape="circle" size="12rem" />
                </div>
                <div className="flex justify-center gap-16 mt-4">
                    <div className="flex flex-col items-center gap-2">
                        <Skeleton shape="circle" size="1.25rem" />
                        <Skeleton width="2rem" height="1.5rem" />
                        <Skeleton width="4rem" height="1rem" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Skeleton shape="circle" size="1.25rem" />
                        <Skeleton width="2rem" height="1.5rem" />
                        <Skeleton width="4rem" height="1rem" />
                    </div>
                </div>
            </div>
        );
    }

    const total = data.boys + data.girls;
    const boysPct = total > 0 ? Math.round((data.boys / total) * 100) : 0;
    const girlsPct = total > 0 ? Math.round((data.girls / total) * 100) : 0;

    return (
        <div className="bg-white rounded-xl w-full h-full p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-lg font-semibold text-gray-800">Students</h1>
                <MoreHorizontal size={20} className="text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
            
            {error ? (
                <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <p>Failed to load chart data</p>
                    </div>
                </div>
            ) : (
                <>
                    <CountChart boys={data.boys} girls={data.girls} />
                    
                    <div className="flex justify-center gap-8 lg:gap-16 mt-4">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-5 h-5 bg-lamaSky rounded-full" />
                            <h1 className="font-bold text-lg">{data.boys}</h1>
                            <h2 className="text-xs text-gray-500">
                                Boys ({boysPct}%)
                            </h2>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-5 h-5 bg-lamaYellow rounded-full" />
                            <h1 className="font-bold text-lg">{data.girls}</h1>
                            <h2 className="text-xs text-gray-500">
                                Girls ({girlsPct}%)
                            </h2>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CountChartContainer;