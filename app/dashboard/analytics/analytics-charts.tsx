'use client'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export default function AnalyticsCharts({ data }: { data: any }) {
    if (!data) return null

    const { habitData, taskData, goalData, financeData } = data

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* 1. Habit Consistency */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Habit Consistency</CardTitle>
                    <CardDescription>Daily completion rate (Last 7 Days)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={habitData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                                    formatter={(value: any) => [`${value}%`, 'Completion']}
                                />
                                <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Task Status */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Task Distribution</CardTitle>
                    <CardDescription>Tasks by current status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        {taskData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={taskData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {taskData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No tasks found
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 3. Goal Progress */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Top Goals</CardTitle>
                    <CardDescription>Progress towards targets</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        {goalData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={goalData} margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 100]} />
                                    <YAxis type="category" dataKey="name" width={100} />
                                    <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Progress']} />
                                    <Bar dataKey="progress" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No goals found
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 4. Financial Overview */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Financial Health</CardTitle>
                    <CardDescription>Total Income vs Expenses</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        {financeData.some((d: any) => d.value > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={financeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {financeData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No transactions found
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
