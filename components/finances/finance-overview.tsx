'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts'

interface Transaction {
    id: string
    type: string
    amount: number
    category_name: string
    date: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#6366f1'];

export function FinanceOverview({ transactions }: { transactions: Transaction[] }) {
    const totalIncome = transactions
        .filter(t => t.type === 'Income')
        .reduce((acc, t) => acc + t.amount, 0)

    const totalExpenses = transactions
        .filter(t => t.type === 'Expense')
        .reduce((acc, t) => acc + t.amount, 0)

    const balance = totalIncome - totalExpenses

    // Prepare data for Chart (Expenses by Category)
    const expenseCategories = transactions
        .filter(t => t.type === 'Expense')
        .reduce((acc, t) => {
            acc[t.category_name] = (acc[t.category_name] || 0) + t.amount
            return acc
        }, {} as Record<string, number>)

    const chartData = Object.entries(expenseCategories).map(([name, value]) => ({
        name,
        value
    }))

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4 grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">+{formatCurrency(totalIncome)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">-{formatCurrency(Math.abs(totalExpenses))}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(balance)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No expenses to display
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Render simple list here in overview too? No, parent page handles layout. 
            Actually, the Overview component returned cards AND chart. 
            I'll let the Page component combine Overview and List. 
            The Overview took 4 columns. The List will take 3.
        */}
        </div>
    )
}
