import { createClient } from '@/lib/supabase/server'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { TaskList } from '@/components/tasks/task-list'
import { TaskBoard } from '@/components/tasks/task-board'
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
                    <p className="text-muted-foreground">Manage your tasks and projects.</p>
                </div>
                <CreateTaskDialog />
            </div>

            <Tabs defaultValue="list" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="list" className="flex items-center gap-2"><LayoutList className="h-4 w-4" /> List</TabsTrigger>
                        <TabsTrigger value="board" className="flex items-center gap-2"><Kanban className="h-4 w-4" /> Board</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="list" className="mt-0">
                    <TaskList tasks={tasks || []} />
                </TabsContent>
                <TabsContent value="board" className="mt-0">
                    <TaskBoard tasks={tasks || []} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
