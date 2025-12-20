import { useMonthlyStats, useWeeklyStats, useDailyStats, useSummaryStats } from '@/features/stats/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, ArrowUpDown } from 'lucide-react';

export function Analytics() {
    const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyStats();
    const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyStats();
    const { data: dailyData, isLoading: dailyLoading } = useDailyStats();
    const { data: summary, isLoading: summaryLoading } = useSummaryStats();

    const formatCurrency = (amount: number) => `₹${(amount / 100).toFixed(2)}`;

    if (monthlyLoading || weeklyLoading || dailyLoading || summaryLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Avg Monthly Spending</CardTitle>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(summary?.avgSpent || 0)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Total: {formatCurrency(summary?.totalSpent || 0)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Avg Monthly Receiving</CardTitle>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(summary?.avgReceived || 0)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Total: {formatCurrency(summary?.totalReceived || 0)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
                        <ArrowUpDown className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {summary?.totalTransactions || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Last 6 months</p>
                    </CardContent>
                </Card>
            </div>

            {/* 6-Month Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>6-Month Spending Trend</CardTitle>
                    <p className="text-sm text-gray-600">Compare your spending vs receiving over time</p>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <div className="min-w-[500px] md:min-w-0">
                        <ChartContainer
                            config={{
                                spent: { label: "Spent", color: "#ef4444" },
                                received: { label: "Received", color: "#22c55e" }
                            }}
                            className="h-[250px] sm:h-[300px] md:h-[350px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="month"
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        fontSize={12}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `₹${(value / 100).toFixed(0)}`}
                                        fontSize={12}
                                    />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                        formatter={(value: any) => formatCurrency(Number(value))}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="spent" fill="#ef4444" name="Spent" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="received" fill="#22c55e" name="Received" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Weekly and Daily Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Last 7 Days</CardTitle>
                        <p className="text-sm text-gray-600">Daily spending patterns</p>
                    </CardHeader>
                    <CardContent className="overflow-hidden">
                        <div className="w-full h-[250px]">
                            <ChartContainer
                                config={{
                                    spent: { label: "Spent", color: "#ef4444" },
                                    received: { label: "Received", color: "#22c55e" }
                                }}
                                className="w-full h-full"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={weeklyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" fontSize={12} />
                                        <YAxis fontSize={12} tickFormatter={(value) => `₹${(value / 100).toFixed(0)}`} />
                                        <ChartTooltip
                                            content={<ChartTooltipContent />}
                                            formatter={(value: any) => formatCurrency(Number(value))}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="spent" stroke="#ef4444" strokeWidth={2} name="Spent" />
                                        <Line type="monotone" dataKey="received" stroke="#22c55e" strokeWidth={2} name="Received" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Today's Activity</CardTitle>
                        <p className="text-sm text-gray-600">Your transactions today</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-600">Spent Today</p>
                                    <p className="text-2xl font-bold text-red-600">{formatCurrency(dailyData?.spent || 0)}</p>
                                </div>
                                <IndianRupee className="w-8 h-8 text-red-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-600">Received Today</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(dailyData?.received || 0)}</p>
                                </div>
                                <IndianRupee className="w-8 h-8 text-green-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-600">Transactions</p>
                                    <p className="text-2xl font-bold text-blue-600">{dailyData?.count || 0}</p>
                                </div>
                                <ArrowUpDown className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
