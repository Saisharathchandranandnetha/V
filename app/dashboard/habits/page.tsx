import { createClient } from '@/lib/supabase/server'
import { HabitsManager } from '@/components/habits/habits-manager'

export default async function HabitsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Please log in to view habits.</div>
    }

    const { data: habits } = await supabase
        .from('habits')
        .select(`
        *,
        habit_logs (
            date,
            status
        )
    `)
        .eq('user_id', user.id)
        // Optimization: Only fetch recent logs (last 90 days) to calculate streaks/analytics
        .gte('habit_logs.date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

    return (
        <HabitsManager initialHabits={habits || []} />
    )
}
