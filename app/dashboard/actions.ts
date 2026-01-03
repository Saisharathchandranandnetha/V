'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createResource(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const url = formData.get('url') as string
    const type = formData.get('type') as string
    const summary = formData.get('summary') as string
    const tagsRaw = formData.get('tags') as string

    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        console.error('User not authenticated:', userError)
        throw new Error('You must be logged in to create a resource')
    }

    console.log('[Debug] Authenticated User ID:', user.id)
    console.log('[Debug] Attempting to insert resource with data:', { title, url, type, user_id: user.id })

    const collectionId = formData.get('collection_id') as string
    const categoryId = formData.get('category_id') as string

    const { error } = await supabase.from('resources').insert({
        title,
        url,
        type,
        summary,
        tags,
        user_id: user.id,
        collection_id: (collectionId && collectionId !== 'none') ? collectionId : null,
        category_id: (categoryId && categoryId !== 'none') ? categoryId : null
    })

    if (error) {
        console.error('Error creating resource:', error)
        throw new Error(`Failed to create resource: ${error.message}`)
    }

    revalidatePath('/dashboard/resources')
    redirect('/dashboard/resources')
}

export async function deleteResource(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('resources').delete().eq('id', id)

    if (error) {
        console.error('Error deleting resource:', error)
        throw new Error('Failed to delete resource')
    }

    revalidatePath('/dashboard/resources')
}

export async function createLearningPath(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const linksRaw = formData.get('links') as string

    // Split by newlines or commas
    const links = linksRaw.split(/[\n,]+/).map(l => l.trim()).filter(Boolean)

    const { error } = await supabase.from('learning_paths').insert({
        title,
        description,
        links,
    })

    if (error) {
        console.error('Error creating learning path:', error)
        throw new Error('Failed to create learning path')
    }

    revalidatePath('/dashboard/paths')
    redirect('/dashboard/paths')
}

export async function deleteLearningPath(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('learning_paths').delete().eq('id', id)

    if (error) {
        console.error('Error deleting learning path:', error)
        throw new Error('Failed to delete learning path')
    }

    revalidatePath('/dashboard/paths')
}

export async function updateResource(id: string, formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const url = formData.get('url') as string
    const type = formData.get('type') as string
    const summary = formData.get('summary') as string
    const tagsRaw = formData.get('tags') as string

    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)

    const collectionId = formData.get('collection_id') as string
    const categoryId = formData.get('category_id') as string

    const { error } = await supabase.from('resources').update({
        title,
        url,
        type,
        summary,
        tags,
        collection_id: (collectionId && collectionId !== 'none') ? collectionId : null,
        category_id: (categoryId && categoryId !== 'none') ? categoryId : null,
    }).eq('id', id)

    if (error) {
        console.error('Error updating resource:', error)
        throw new Error('Failed to update resource')
    }

    revalidatePath('/dashboard/resources')
    redirect('/dashboard/resources')
}

export async function updateLearningPath(id: string, formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const linksRaw = formData.get('links') as string

    // Split by newlines or commas
    const links = linksRaw.split(/[\n,]+/).map(l => l.trim()).filter(Boolean)

    const { error } = await supabase.from('learning_paths').update({
        title,
        description,
        links,
    }).eq('id', id)

    if (error) {
        console.error('Error updating learning path:', error)
        throw new Error('Failed to update learning path')
    }

    revalidatePath('/dashboard/paths')
    redirect('/dashboard/paths')
}

export async function createCollectionAndReturn(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('collections')
        .insert({
            name,
            user_id: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating collection:', error)
        throw new Error('Failed to create collection')
    }

    return data
}

export async function moveItemToCollection(itemId: string, itemType: string, collectionId: string | null) {
    const supabase = await createClient()

    const tableMap: Record<string, string> = {
        'resource': 'resources',
        'habit': 'habits',
        'task': 'tasks',
        'goal': 'goals',
        'note': 'notes',
        'path': 'learning_paths'
    }

    const tableName = tableMap[itemType]
    if (!tableName) {
        throw new Error('Invalid item type')
    }

    const { error } = await supabase
        .from(tableName)
        .update({ collection_id: collectionId === 'none' ? null : collectionId })
        .eq('id', itemId)

    if (error) {
        console.error(`Error moving ${itemType} to collection:`, error)
        throw new Error(`Failed to move ${itemType} to collection`)
    }

    revalidatePath('/dashboard/collections')
    revalidatePath('/dashboard/resources')
    revalidatePath('/dashboard/habits')
    revalidatePath('/dashboard/tasks')
    revalidatePath('/dashboard/goals')
    revalidatePath('/dashboard/notes')
    revalidatePath('/dashboard/paths')
    revalidatePath('/dashboard/paths')
}

export async function createCategoryAndReturn(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('categories')
        .insert({
            name,
            type: 'resource',
            user_id: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating category:', error)
        throw new Error(`Failed to create category: ${error.message}`)
    }

    return data
}
