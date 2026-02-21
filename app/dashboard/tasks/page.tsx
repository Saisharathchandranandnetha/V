import { createClient } from '@/lib/supabase/server'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { TasksWrapper } from '@/components/tasks/tasks-wrapper'
import { LayoutList, Kanban } from 'lucide-react'

export default async function TasksPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
            *,
            team:teams(name),
            project:projects(name)
        `)
        .or(`assigned_to.eq.${user.id},and(assigned_to.is.null,user_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(100)

    // If the or() query fails (e.g. assigned_to column missing on existing DB),
    // fall back to a simple user_id filter so the board still shows tasks.
    let finalTasks = tasks
    if (tasksError) {
        console.error('Tasks query error (or filter):', tasksError.message)
        const { data: fallbackTasks, error: fallbackError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100)
        if (fallbackError) {
            console.error('Tasks fallback query error:', fallbackError.message)
        }
        finalTasks = fallbackTasks
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
                    <p className="text-muted-foreground">Manage your daily tasks.</p>
                </div>
            </div>

            <TasksWrapper tasks={finalTasks || []} />
        </div>
    )
}
