'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTask(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const priority = (formData.get('priority') as string) || 'Medium'
    const dueDateRaw = formData.get('due_date') as string
    const description = formData.get('description') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase.from('tasks').insert({
        title,
        priority,
        due_date: dueDateRaw ? new Date(dueDateRaw).toISOString() : null,
        status: 'Todo',
        description,
        user_id: user.id
    })

    if (error) {
        console.error('Error creating task:', error)
        throw new Error('Failed to create task')
    }

    revalidatePath('/dashboard/tasks')
}

export async function updateTaskStatus(id: string, status: string, completedAt?: string, reason?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Fetch task details to check for project linkage
    const { data: task } = await supabase
        .from('tasks')
        .select('title, project_id, team_id')
        .eq('id', id)
        .single()

    const updateData: any = { status }
    if (status === 'Done' && completedAt) {
        updateData.completed_at = completedAt
        updateData.completion_reason = reason
    } else if (status !== 'Done') {
        // Reset if moving back from Done
        updateData.completed_at = null
        updateData.completion_reason = null
    }

    const { error } = await supabase.from('tasks').update(updateData).eq('id', id)

    if (error) {
        console.error('Error updating task status:', error)
        throw new Error('Failed to update task status')
    }

    // If task is completed and linked to a project, send a notification message
    if (status === 'Done' && task?.project_id && task?.team_id) {
        try {
            await supabase.from('team_messages').insert({
                team_id: task.team_id,
                project_id: task.project_id,
                message: `Task completed: ${task.title}`,
                sender_id: user.id,
                type: 'system' // Optional: if we want to style it differently later, or just standard text
            })
        } catch (msgError) {
            console.error('Failed to send completion message:', msgError)
            // Don't fail the task update if message fails
        }
    }

    revalidatePath('/dashboard/tasks')
}

export async function deleteTask(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw new Error('Failed to delete task')

    revalidatePath('/dashboard/tasks')
}

export async function updateTask(id: string, formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const priority = (formData.get('priority') as string) || 'Medium'
    const dueDateRaw = formData.get('due_date') as string
    const description = formData.get('description') as string

    const { error } = await supabase.from('tasks')
        .update({
            title,
            priority,
            due_date: dueDateRaw ? new Date(dueDateRaw).toISOString() : null,
            description,
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating task:', error)
        throw new Error('Failed to update task')
    }

    revalidatePath('/dashboard/tasks')
}
