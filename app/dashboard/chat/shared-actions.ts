'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addToMyAccount(sharedItemId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // 1. Fetch Shared Item Details
    const { data: sharedItem, error: sharedError } = await supabase
        .from('chat_shared_items')
        .select('*')
        .eq('id', sharedItemId)
        .single()

    if (sharedError || !sharedItem) {
        throw new Error('Shared item not found')
    }

    // 2. Determine Type and Fetch Original Content
    const originalItemId = sharedItem.shared_item_id
    const type = sharedItem.shared_type

    // 3. Prevent Duplicates (Check if user already copied this original item)
    // We check the specific table for `original_item_id` + `user_id`
    // Note: This logic assumes a user copies it once. If they want multiple copies, we might need to relax this.
    // Requirement says: "Disable Add to My Account if already added"

    let existingCopy: any = null

    if (type === 'resource') {
        const { data } = await supabase.from('resources')
            .select('id')
            .eq('original_item_id', originalItemId)
            .eq('user_id', user.id)
            .single()
        existingCopy = data
    } else if (type === 'note') {
        const { data } = await supabase.from('notes')
            .select('id')
            .eq('original_item_id', originalItemId)
            .eq('user_id', user.id)
            .single()
        existingCopy = data
    } else if (type === 'learning_path') {
        const { data } = await supabase.from('learning_paths')
            .select('id')
            .eq('original_item_id', originalItemId)
            .eq('user_id', user.id)
            .single()
        existingCopy = data
    }

    if (existingCopy) {
        throw new Error('You have already added this item to your account')
    }

    // 4. Fetch Original Data & Create Copy
    if (type === 'resource') {
        const { data: original } = await supabase.from('resources').select('*').eq('id', originalItemId).single()
        if (!original) throw new Error('Original resource not found')

        const { error } = await supabase.from('resources').insert({
            user_id: user.id,
            title: original.title,
            type: original.type,
            url: original.url,
            summary: original.summary,
            tags: original.tags,
            // Isolated copy fields
            original_item_id: original.id,
            copied_from_chat: true,
            copied_at: new Date().toISOString(),
            // Project/Collection are NOT copied unless we want to put it in a "Inbox"?
            // For now, null (root of personal account)
            project_id: null,
            collection_id: null
        })
        if (error) throw error
    }
    else if (type === 'note') {
        const { data: original } = await supabase.from('notes').select('*').eq('id', originalItemId).single()
        if (!original) throw new Error('Original note not found')

        const { error } = await supabase.from('notes').insert({
            user_id: user.id,
            title: original.title,
            content: original.content,
            // Isolated copy fields
            original_item_id: original.id,
            copied_from_chat: true,
            copied_at: new Date().toISOString(),
            project_id: null,
            collection_id: null
        })
        if (error) throw error
    }
    else if (type === 'learning_path') {
        const { data: original } = await supabase.from('learning_paths').select('*').eq('id', originalItemId).single()
        if (!original) throw new Error('Original learning path not found')

        const { error } = await supabase.from('learning_paths').insert({
            user_id: user.id,
            title: original.title,
            description: original.description,
            links: original.links,
            // Isolated copy fields
            original_item_id: original.id,
            copied_from_chat: true,
            copied_at: new Date().toISOString(),
            project_id: null,
            collection_id: null
        })
        if (error) throw error
    }

    revalidatePath('/dashboard/resources')
    revalidatePath('/dashboard/notes')
    revalidatePath('/dashboard/learning')

    return { success: true }
}

export async function copyItemToAccount(originalItemId: string, type: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    let existingCopy: any = null

    // Check if user is the OWNER of the original item
    if (type === 'resource') {
        const { data } = await supabase.from('resources').select('id').eq('id', originalItemId).eq('user_id', user.id).single()
        if (data) return { success: true, newId: originalItemId, isNew: false }
    } else if (type === 'note') {
        const { data } = await supabase.from('notes').select('id').eq('id', originalItemId).eq('user_id', user.id).single()
        if (data) return { success: true, newId: originalItemId, isNew: false }
    } else if (type === 'learning_path') {
        const { data } = await supabase.from('learning_paths').select('id').eq('id', originalItemId).eq('user_id', user.id).single()
        if (data) return { success: true, newId: originalItemId, isNew: false }
    }

    if (type === 'resource') {
        const { data } = await supabase.from('resources')
            .select('id')
            .eq('original_item_id', originalItemId)
            .eq('user_id', user.id)
            .single()
        existingCopy = data
    } else if (type === 'note') {
        const { data } = await supabase.from('notes')
            .select('id')
            .eq('original_item_id', originalItemId)
            .eq('user_id', user.id)
            .single()
        existingCopy = data
    } else if (type === 'learning_path') {
        const { data } = await supabase.from('learning_paths')
            .select('id')
            .eq('original_item_id', originalItemId)
            .eq('user_id', user.id)
            .single()
        existingCopy = data
    }

    if (existingCopy) {
        return { success: true, newId: existingCopy.id, isNew: false }
    }

    // Use Admin Client to fetch original item (Bypass RLS)
    const adminSupabase = createAdminClient()
    let newId = ''

    // Create Copy
    if (type === 'resource') {
        const { data: original } = await adminSupabase.from('resources').select('*').eq('id', originalItemId).single()
        if (!original) throw new Error('Original resource not found')

        const { data: newItem, error } = await supabase.from('resources').insert({
            user_id: user.id,
            title: original.title,
            type: original.type,
            url: original.url,
            summary: original.summary,
            tags: original.tags,
            original_item_id: original.id,
            copied_from_chat: true,
            copied_at: new Date().toISOString(),
            project_id: null,
            collection_id: null
        }).select('id').single()
        if (error) throw error
        newId = newItem.id
    }
    else if (type === 'note') {
        const { data: original } = await adminSupabase.from('notes').select('*').eq('id', originalItemId).single()
        if (!original) throw new Error('Original note not found')

        const { data: newItem, error } = await supabase.from('notes').insert({
            user_id: user.id,
            title: original.title,
            content: original.content,
            original_item_id: original.id,
            copied_from_chat: true,
            copied_at: new Date().toISOString(),
            project_id: null,
            collection_id: null
        }).select('id').single()
        if (error) throw error
        newId = newItem.id
    }
    else if (type === 'learning_path') {
        const { data: original } = await adminSupabase.from('learning_paths').select('*').eq('id', originalItemId).single()
        if (!original) throw new Error('Original learning path not found')

        const { data: newItem, error } = await supabase.from('learning_paths').insert({
            user_id: user.id,
            title: original.title,
            description: original.description,
            links: original.links,
            original_item_id: original.id,
            copied_from_chat: true,
            copied_at: new Date().toISOString(),
            project_id: null,
            collection_id: null
        }).select('id').single()
        if (error) throw error
        newId = newItem.id
    }

    revalidatePath('/dashboard/resources')
    revalidatePath('/dashboard/notes')
    revalidatePath('/dashboard/learning')

    return { success: true, newId, isNew: true }
}
