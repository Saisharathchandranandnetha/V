import { createClient } from '@/lib/supabase/server'
import { CreateHabitDialog } from '@/components/habits/create-habit-dialog'
import { HabitList } from '@/components/habits/habit-list'

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

            <HabitList habits={habits || []} />
        </div>
    )
}
