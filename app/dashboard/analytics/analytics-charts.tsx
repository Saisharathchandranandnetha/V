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

import { useRouter, useSearchParams } from 'next/navigation'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AnalyticsCharts({ data }: { data: any }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentPeriod = searchParams.get('period') || '7d'
    const currentDate = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const handlePeriodChange = (val: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('period', val)
        if (val !== 'custom') params.delete('date')
        router.push(`?${params.toString()}`)
    }

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        const params = new URLSearchParams(searchParams.toString())
        params.set('date', val)
        router.push(`?${params.toString()}`)
    }

    if (!data) return null
    const { habitData, taskData, goalData, financeData } = data

    return (
        <div className="space-y-6">
            {/* Filter Toolbar */}
            <Card>
                <CardHeader className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-lg font-medium">Dashboard Filters</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="period" className="whitespace-nowrap">Time Range</Label>
                                <Select value={currentPeriod} onValueChange={handlePeriodChange}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7d">Last 7 Days</SelectItem>
                                        <SelectItem value="month">This Month</SelectItem>
                                        <SelectItem value="year">This Year</SelectItem>
                                        <SelectItem value="custom">Specific Day</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {currentPeriod === 'custom' && (
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        type="date"
                                        id="date"
                                        value={currentDate}
                                        onChange={handleDateChange}
                                        className="w-[160px]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

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
        </div>
    )
}
