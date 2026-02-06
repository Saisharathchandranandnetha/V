import { createClient } from '@/lib/supabase/server'
import { FinancesManager } from '@/components/finances/finances-manager'

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
        <FinancesManager
            initialTransactions={transactions || []}
            categories={categories || []}
            projects={projects || []}
        />
    )
}
