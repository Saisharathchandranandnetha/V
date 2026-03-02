import { auth } from '@/auth'
import { db } from '@/lib/db'
import { tasks, teams, projects } from '@/lib/db/schema'
import { eq, or } from 'drizzle-orm'
import { TasksWrapper } from '@/components/tasks/tasks-wrapper'
import { redirect } from 'next/navigation'

export default async function TasksPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')
    const userId = session.user.id

    const tasksData = await db.select({
        id: tasks.id,
        userId: tasks.userId,
        teamId: tasks.teamId,
        projectId: tasks.projectId,
        assignedTo: tasks.assignedTo,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        status: tasks.status,
        dueDate: tasks.dueDate,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
    }).from(tasks)
        .where(or(eq(tasks.userId, userId), eq(tasks.assignedTo, userId)))
        .limit(100)

    const finalTasks = tasksData.map(t => ({
        ...t,
        user_id: t.userId,
        assigned_to: t.assignedTo,
        due_date: t.dueDate?.toISOString() ?? null,
        created_at: t.createdAt?.toISOString(),
    }))

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
                    <p className="text-muted-foreground">Manage your daily tasks.</p>
                </div>
            </div>
            <TasksWrapper tasks={finalTasks as any} />
        </div>
    )
}
