import { createClient } from '@/lib/supabase/server'
import { CreateGoalDialog } from '@/components/goals/create-goal-dialog'
import { GoalList } from '@/components/goals/goal-list'

export default async function GoalsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Please log in</div>
    }

    const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Goals</h2>
                    <p className="text-muted-foreground">Track your progress and achieve your dreams.</p>
                </div>
                <CreateGoalDialog />
            </div>

            <GoalList goals={goals || []} />
        </div>
    )
}
