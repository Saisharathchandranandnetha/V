'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Fetch task details before deletion to check assignment
    const { data: task } = await supabase
        .from('tasks')
        .select('title, team_id, project_id, assigned_to, user_id')
        .eq('id', id)
        .single()

    if (task) {
        // Check if task was assigned TO the current user BY someone else
        // task.assigned_to === user.id (Assigned to me)
        // task.user_id !== user.id (Created by someone else)
        if (task.assigned_to === user.id && task.user_id !== user.id && task.team_id) {
            console.log('Task rejection condition met. Sending message...')
            try {
                // Send automated rejection message
                const { error: msgInsertError } = await supabase.from('team_messages').insert({
                    team_id: task.team_id,
                    project_id: task.project_id,
                    message: `I will not do this task: ${task.title}`,
                    sender_id: user.id,
                    type: 'system' // or 'text', system might be better for styling if supported
                })

                if (msgInsertError) {
                    console.error('Message insert error detail:', msgInsertError)
                } else {
                    console.log('Message inserted successfully')
                }

                // Use Admin Client to delete (bypass RLS)
                const adminSupabase = createAdminClient()
                const { error: deleteError } = await adminSupabase.from('tasks').delete().eq('id', id)
                if (deleteError) throw deleteError

                revalidatePath('/dashboard/tasks')
                return // Exit early since we used admin client
            } catch (msgError) {
                console.error('Failed to handle assignee deletion/rejection:', msgError)
                // If admin delete failed, we might fall through or throw.
                // Throwing here is safer to indicate failure.
                throw new Error('Failed to delete assigned task')
            }
        }
    }

    // Standard delete (Own tasks / RLS allowed)
    // Fetch task details for message if not already fetched
    if (!task) {
        const { data: taskDetails } = await supabase
            .from('tasks')
            .select('title, team_id, project_id')
            .eq('id', id)
            .single()

        if (taskDetails && taskDetails.team_id) {
            try {
                await supabase.from('team_messages').insert({
                    team_id: taskDetails.team_id,
                    project_id: taskDetails.project_id,
                    message: `Task deleted: ${taskDetails.title}`,
                    sender_id: user.id,
                    type: 'system'
                })
            } catch (msgError) {
                console.error('Failed to send deletion message:', msgError)
            }
        }
    } else if (task.team_id) {
        try {
            await supabase.from('team_messages').insert({
                team_id: task.team_id,
                project_id: task.project_id,
                message: `Task deleted: ${task.title}`,
                sender_id: user.id,
                type: 'system'
            })
        } catch (msgError) {
            console.error('Failed to send deletion message:', msgError)
        }
    }

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
