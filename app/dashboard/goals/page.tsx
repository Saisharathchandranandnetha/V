import { createClient } from '@/lib/supabase/server'
import { GoalsManager } from '@/components/goals/goals-manager'

interface Goal {
    id: string
    created_at: string
    title: string
    description?: string
    type: string
    priority: string
    current_value: number
    target_value: number
    unit: string
    deadline: string | null
    user_id: string
    status?: boolean
    updated_at?: string
}

export default async function GoalsPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q: searchQuery } = await searchParams
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Please log in</div>
    }

    const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true })

    const allGoals = (goalsData || []) as Goal[]

    return (
        <GoalsManager initialGoals={allGoals} searchQuery={searchQuery} />
    )
}
