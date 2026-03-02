'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { tasks, teamMessages } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createTask(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const title = formData.get('title') as string
    const priority = (formData.get('priority') as string) || 'Medium'
    const dueDateRaw = formData.get('due_date') as string
    const description = formData.get('description') as string

    const [task] = await db.insert(tasks).values({
        userId: session.user.id,
        title,
        priority,
        dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
        status: 'Todo',
        description,
    }).returning()

    revalidatePath('/dashboard/tasks')
    return { success: true, task }
}

export async function updateTaskStatus(id: string, status: string, completedAt?: string, reason?: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)

    const updateData: any = { status }

    if (status === 'Done') {
        updateData.completedAt = completedAt ? new Date(completedAt) : new Date()
        updateData.completionReason = reason || null
    } else {
        updateData.completedAt = null
        updateData.completionReason = null
    }

    await db.update(tasks).set(updateData).where(eq(tasks.id, id))

    // If task is completed and linked to a project, send a notification
    if (status === 'Done' && task?.projectId && task?.teamId) {
        try {
            await db.insert(teamMessages).values({
                teamId: task.teamId,
                projectId: task.projectId,
                message: `Task completed: ${task.title}`,
                senderId: session.user.id,
                type: 'system',
            })
        } catch (msgError) {
            console.error('Failed to send completion message:', msgError)
        }
    }

    revalidatePath('/dashboard/tasks')
}

export async function deleteTask(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)

    // If assigned to someone else and we are that assignee, log rejection message
    if (task?.assignedTo === session.user.id && task?.userId !== session.user.id && task?.teamId) {
        try {
            await db.insert(teamMessages).values({
                teamId: task.teamId,
                projectId: task.projectId,
                message: `I will not do this task: ${task.title}`,
                senderId: session.user.id,
                type: 'system',
            })
        } catch (msgError) {
            console.error('Failed to send rejection message:', msgError)
        }
    } else if (task?.teamId) {
        try {
            await db.insert(teamMessages).values({
                teamId: task.teamId,
                projectId: task.projectId,
                message: `Task deleted: ${task.title}`,
                senderId: session.user.id,
                type: 'system',
            })
        } catch (msgError) {
            console.error('Failed to send deletion message:', msgError)
        }
    }

    await db.delete(tasks).where(eq(tasks.id, id))
    revalidatePath('/dashboard/tasks')
}

export async function updateTask(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const title = formData.get('title') as string
    const priority = (formData.get('priority') as string) || 'Medium'
    const dueDateRaw = formData.get('due_date') as string
    const description = formData.get('description') as string

    await db.update(tasks)
        .set({ title, priority, dueDate: dueDateRaw ? new Date(dueDateRaw) : null, description })
        .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))

    revalidatePath('/dashboard/tasks')
}
