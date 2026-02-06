'use client'

import { useOptimistic } from 'react'
import { AddTransactionDialog } from './add-transaction-dialog'
import { TransactionList } from './transaction-list'
import { FinanceOverview } from './finance-overview'

interface Transaction {
    id: string
    type: string
    amount: number
    category_id: string
    category_name: string
    description?: string
    date: string
    user_id: string
    project_id?: string
    created_at?: string
}

interface Category {
    id: string
    name: string
    type: 'Income' | 'Expense'
    user_id: string
}

interface Project {
    id: string
    name: string
}

interface FinancesManagerProps {
    initialTransactions: Transaction[]
    categories: Category[]
    projects: Project[]
}

export function FinancesManager({ initialTransactions, categories, projects }: FinancesManagerProps) {
    const [optimisticTransactions, addOptimisticTransaction] = useOptimistic(
        initialTransactions,
        (state, newTransaction: Transaction) => [newTransaction, ...state].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Finances</h2>
                    <p className="text-muted-foreground">Monitor your income and expenses.</p>
                </div>
                <AddTransactionDialog
                    categories={categories}
                    projects={projects}
                    onAdd={addOptimisticTransaction}
                />
            </div>

            <FinanceOverview transactions={optimisticTransactions} />

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-1 md:col-span-2 lg:col-span-7">
                    <TransactionList
                        transactions={optimisticTransactions}
                        categories={categories}
                        projects={projects}
                    />
                </div>
            </div>
        </div>
    )
}
