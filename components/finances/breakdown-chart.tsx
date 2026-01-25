'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ChartData {
    name: string
    value: number
    [key: string]: any
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#6366f1']

export function BreakdownChart({ data }: { data: ChartData[] }) {
    const total = data.reduce((acc, item) => acc + item.value, 0)

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 h-full">
            <div className="h-[250px] w-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: any) => formatCurrency(Number(value || 0))}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold">{formatCurrency(total)}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full md:max-w-xs space-y-3">
                {data.map((item, index) => {
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
                    return (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="font-medium">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground">
                                <span>{percentage}%</span>
                                <span className="w-20 text-right font-mono">{formatCurrency(item.value)}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
