'use client'

import { format } from 'date-fns'
import { ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteTransaction } from '@/app/dashboard/finances/actions'
import { EditTransactionDialog } from '@/components/finances/edit-transaction-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { cn, formatCurrency } from '@/lib/utils'

interface Transaction {
    id: string
    type: 'Income' | 'Expense' | string
    amount: number
    category_name: string
    description?: string
    date: string
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {transactions.slice(0, 10).map((t) => (
                        <div
                            key={t.id}
                            className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                            <div className="flex items-center space-x-4">
                                <div
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-full border",
                                        t.type === 'Income' ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                                    )}
                                >
                                    {t.type === 'Income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium leading-none">{t.category_name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t.description || format(new Date(t.date), 'MMM d, yyyy')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={cn("font-medium", t.type === 'Income' ? "text-green-600" : "text-gray-900")}>
                                    {t.type === 'Income' ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                                </div>
                                <EditTransactionDialog transaction={t} />
                                <ConfirmDeleteDialog
                                    trigger={
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    }
                                    onConfirm={() => deleteTransaction(t.id)}
                                    title="Delete Transaction"
                                    description="Are you sure you want to delete this transaction? This action cannot be undone."
                                />
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && <p className="text-muted-foreground text-sm">No transactions yet.</p>}
                </div>
            </CardContent>
        </Card>
    )
}
