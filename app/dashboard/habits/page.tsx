import { createClient } from '@/lib/supabase/server'
import { CreateHabitDialog } from '@/components/habits/create-habit-dialog'
import { HabitList } from '@/components/habits/habit-list'
import { HabitsAnalyticsGraph } from '@/components/habits/habits-analytics-graph'

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Habits</h2>
                    <p className="text-muted-foreground">Build better habits, one day at a time.</p>
                </div>
                <CreateHabitDialog />
            </div>

            <HabitsAnalyticsGraph />

            <HabitList habits={habits || []} />
        </div>
    )
}
