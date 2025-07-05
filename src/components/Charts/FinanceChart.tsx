"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "primereact/skeleton";
import Image from "next/image";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface FinanceData {
    name: string;
    income: number;
    expense: number;
}

const FinanceChart = () => {
    const [data, setData] = useState<FinanceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFinanceData = async () => {
            try {
                setLoading(true);
                setError(null);

                // For now, we'll use mock data since there's no finance API endpoint
                // In a real application, you would fetch from /api/finance or similar
                const mockData = [
                    { name: "Jan", income: 4000, expense: 2400 },
                    { name: "Feb", income: 3000, expense: 1398 },
                    { name: "Mar", income: 2000, expense: 9800 },
                    { name: "Apr", income: 2780, expense: 3908 },
                    { name: "May", income: 1890, expense: 4800 },
                    { name: "Jun", income: 2390, expense: 3800 },
                    { name: "Jul", income: 3490, expense: 4300 },
                    { name: "Aug", income: 3490, expense: 4300 },
                    { name: "Sep", income: 3490, expense: 4300 },
                    { name: "Oct", income: 3490, expense: 4300 },
                    { name: "Nov", income: 3490, expense: 4300 },
                    { name: "Dec", income: 3490, expense: 4300 },
                ];

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                setData(mockData);
            } catch (err) {
                console.error('Error fetching finance data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchFinanceData();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-xl w-full h-full p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton width="60%" height="1.5rem" />
                    <Skeleton shape="circle" size="1.5rem" />
                </div>
                <div className="h-96">
                    <Skeleton width="100%" height="100%" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl w-full h-full p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-lg font-semibold text-gray-800">Finance</h1>
                <Image src="/assets/moreDark.png" alt="More options" width={20} height={20} />
            </div>

            {error ? (
                <div className="flex items-center justify-center h-96 text-gray-500">
                    <div className="text-center">
                        <div className="text-4xl mb-2">💰</div>
                        <p>Failed to load finance data</p>
                        <p className="text-sm mt-1">Showing sample data</p>
                    </div>
                </div>
            ) : null}

            <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            tickLine={false}
                            tickMargin={10}
                        />
                        <YAxis
                            axisLine={false}
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            tickLine={false}
                            tickMargin={20}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        />
                        <Legend
                            align="center"
                            verticalAlign="top"
                            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
                        />
                        <Line
                            type="monotone"
                            dataKey="income"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="expense"
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default FinanceChart;