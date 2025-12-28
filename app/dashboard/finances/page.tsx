import { createClient } from '@/lib/supabase/server'
import { AddTransactionDialog } from '@/components/finances/add-transaction-dialog'
import { TransactionList } from '@/components/finances/transaction-list'
import { FinanceOverview } from '@/components/finances/finance-overview'

export default async function FinancesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Finances</h2>
                    <p className="text-muted-foreground">Monitor your income and expenses.</p>
                </div>
                <AddTransactionDialog />
            </div>

            {transactions && <FinanceOverview transactions={transactions} />}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-7">
                    <TransactionList transactions={transactions || []} />
                </div>
            </div>
        </div>
    )
}
