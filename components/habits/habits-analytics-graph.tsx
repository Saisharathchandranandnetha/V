'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getHabitStats } from '@/app/dashboard/habits/actions'
import { format } from 'date-fns'

export function HabitsAnalyticsGraph() {
    const [viewType, setViewType] = useState<'date' | 'month' | 'year' | 'all'>('month')

    const now = new Date()
    const [selectedDate, setSelectedDate] = useState<string>(format(now, 'yyyy-MM-dd'))
    const [selectedMonth, setSelectedMonth] = useState<string>(String(now.getMonth()))
    const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()))

    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const result = await getHabitStats(viewType, {
                date: viewType === 'date' ? new Date(selectedDate) : undefined,
                month: viewType === 'month' ? parseInt(selectedMonth) : undefined,
                year: (viewType === 'month' || viewType === 'year') ? parseInt(selectedYear) : undefined
            })
            setData(result || [])
        } catch (error) {
            console.error("Failed to fetch habit stats:", error)
        } finally {
            setLoading(false)
        }
    }, [viewType, selectedDate, selectedMonth, selectedYear])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i))
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    return (
        <SpotlightCard>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Habit Trends</CardTitle>
                        <CardDescription>Track your consistency over time</CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* View Type Selector */}
                        <Select value={viewType} onValueChange={(v: any) => setViewType(v)}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="View" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date">Specific Date</SelectItem>
                                <SelectItem value="month">Specific Month</SelectItem>
                                <SelectItem value="year">Specific Year</SelectItem>
                                <SelectItem value="all">Whole Time</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Condition Filters */}
                        {viewType === 'date' && (
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-[160px]"
                            />
                        )}

                        {viewType === 'month' && (
                            <>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m, i) => (
                                            <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </>
                        )}

                        {viewType === 'year' && (
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>
                    ) : data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip
                                    formatter={(value: any) => [`${value}%`, 'Consistency']}
                                    labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No data available for this period
                        </div>
                    )}
                </div>
            </CardContent>
        </SpotlightCard>
    )
}
