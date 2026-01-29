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

    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Finances</h2>
                    <p className="text-muted-foreground">Monitor your income and expenses.</p>
                </div>
                <AddTransactionDialog categories={categories || []} projects={projects || []} />
            </div>

            {transactions && <FinanceOverview transactions={transactions} />}

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-1 md:col-span-2 lg:col-span-7">
                    <TransactionList transactions={transactions || []} categories={categories || []} projects={projects || []} />
                </div>
            </div>
        </div>
    )
}
