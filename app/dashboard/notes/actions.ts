'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getNotes() {
    const supabase = await createClient()
    const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching notes:', error)
        return []
    }

    return notes
}

export async function createNote(formData: FormData) {
    const supabase = await createClient()
    const title = formData.get('title') as string
    const content = formData.get('content') as string

    if (!title) {
        return { error: 'Title is required' }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: note, error } = await supabase
        .from('notes')
        .insert([{ title, content, user_id: user.id }])
        .select()
        .single()

    if (error) {
        console.error('Error creating note:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/notes')
    return { success: true, note }
}

export async function updateNote(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const content = formData.get('content') as string

    if (!id || !title) {
        return { error: 'ID and Title are required' }
    }

    const { error } = await supabase
        .from('notes')
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('Error updating note:', error)
        return { error: error.message }
    }


    revalidatePath('/dashboard/notes')
    return { success: true }
}

export async function deleteNote(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting note:', error)
        return { error: 'Failed to delete note' }
    }

    revalidatePath('/dashboard/notes')
    return { success: true }
}
