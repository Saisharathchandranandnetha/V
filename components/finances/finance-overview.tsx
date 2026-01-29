'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BreakdownChart } from '@/components/finances/breakdown-chart'

interface Transaction {
    id: string
    type: string
    amount: number
    category_name: string
    date: string
}



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

    const expenseData = Object.entries(expenseCategories).map(([name, value]) => ({
        name,
        value
    }))

    // Prepare data for Chart (Income by Category)
    const incomeCategories = transactions
        .filter(t => t.type === 'Income')
        .reduce((acc, t) => {
            acc[t.category_name] = (acc[t.category_name] || 0) + t.amount
            return acc
        }, {} as Record<string, number>)

    const incomeData = Object.entries(incomeCategories).map(([name, value]) => ({
        name,
        value
    }))

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-1 md:col-span-2 lg:col-span-4 grid gap-4 grid-cols-1 md:grid-cols-3">
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

                <Card className="col-span-1 md:col-span-3">
                    <CardHeader>
                        <CardTitle>Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="expenses" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                                <TabsTrigger value="income">Income</TabsTrigger>
                            </TabsList>
                            <TabsContent value="expenses">
                                {expenseData.length > 0 ? (
                                    <BreakdownChart data={expenseData} />
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground border border-dashed rounded-lg">
                                        No expenses to display
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="income">
                                {incomeData.length > 0 ? (
                                    <BreakdownChart data={incomeData} />
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground border border-dashed rounded-lg">
                                        No income to display
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
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
