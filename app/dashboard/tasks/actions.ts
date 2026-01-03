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

export async function updateTaskStatus(id: string, status: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('tasks').update({ status }).eq('id', id)

    if (error) {
        console.error('Error updating task status:', error)
        throw new Error('Failed to update task status')
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
