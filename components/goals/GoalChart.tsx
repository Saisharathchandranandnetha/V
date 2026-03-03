'use client'

import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Log = {
    id: string
    addedValue: string
    createdAt: Date
}

type GoalChartProps = {
    logs: Log[]
    targetValue: number
    color: string
}

export function GoalChart({ logs, targetValue, color }: GoalChartProps) {
    if (logs.length === 0) {
        return (
            <div className="h-32 w-full flex items-center justify-center border border-dashed rounded-lg bg-muted/20 text-muted-foreground text-xs">
                No progress history yet
            </div>
        )
    }

    // Sort logs chronologically
    const sortedLogs = [...logs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    // Calculate cumulative progress
    let cumulative = 0
    const data = sortedLogs.map(log => {
        cumulative += Number(log.addedValue)
        return {
            date: format(new Date(log.createdAt), 'MMM d'),
            value: cumulative,
        }
    })

    return (
        <div className="h-32 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                    <XAxis
                        dataKey="date"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        domain={[0, targetValue]}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: color }}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: color, strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
