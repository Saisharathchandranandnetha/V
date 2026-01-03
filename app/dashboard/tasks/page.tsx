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

    const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
                    <p className="text-muted-foreground">Manage your daily tasks.</p>
                </div>
            </div>

            <TasksWrapper tasks={tasks || []} />
        </div>
    )
}
