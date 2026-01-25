'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getOrCreateCategory(supabase: any, user_id: string, name: string, type: string) {
    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user_id)
        .eq('name', name)
        .eq('type', type)
        .single()

    if (existing) return existing.id

    const { data: newCategory, error } = await supabase
        .from('categories')
        .insert({ user_id, name, type })
        .select('id')
        .single()

    if (error) {
        console.error('Error creating category:', error)
        return null // Fallback to just name in transaction
    }
    return newCategory.id
}

export async function addTransaction(formData: FormData) {
    try {
        const supabase = await createClient()

        const type = formData.get('type') as 'Income' | 'Expense'
        const amountRaw = formData.get('amount')
        const amount = Number(amountRaw)
        if (isNaN(amount)) {
            return { error: 'Invalid amount' }
        }

        const categoryName = formData.get('category') as string
        const description = formData.get('description') as string
        const dateRaw = formData.get('date') as string

        let date: string
        try {
            date = dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString()
        } catch {
            return { error: 'Invalid date format' }
        }

        const customCategory = formData.get('custom_category') as string

        // Override category name if "Other" and custom name provided
        let finalCategoryName = categoryName
        if (categoryName === 'Other' && customCategory && customCategory.trim()) {
            finalCategoryName = customCategory.trim()
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const projectIdRaw = formData.get('projectId') as string
        const projectId = projectIdRaw && projectIdRaw !== 'undefined' && projectIdRaw !== 'null' ? projectIdRaw : null

        // Handle Category Link
        const categoryId = await getOrCreateCategory(supabase, user.id, finalCategoryName, type)

        const { error } = await supabase.from('transactions').insert({
            type,
            amount,
            category_id: categoryId,
            category_name: finalCategoryName,
            description,
            date,
            user_id: user.id,
            project_id: projectId
        })

        if (error) {
            console.error('Error adding transaction:', error)
            return { error: 'Failed to add transaction' }
        }

        revalidatePath('/dashboard/finances')
        return { success: true }
    } catch (e) {
        console.error('Unexpected error in addTransaction:', e)
        return { error: 'An unexpected error occurred' }
    }
}

export async function deleteTransaction(id: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from('transactions').delete().eq('id', id)
        if (error) return { error: 'Failed to delete transaction' }

        revalidatePath('/dashboard/finances')
        return { success: true }
    } catch (e) {
        return { error: 'Failed to delete transaction' }
    }
}

export async function updateTransaction(id: string, formData: FormData) {
    try {
        const supabase = await createClient()

        const type = formData.get('type') as 'Income' | 'Expense'
        const amountRaw = formData.get('amount')
        const amount = Number(amountRaw)
        if (isNaN(amount)) {
            return { error: 'Invalid amount' }
        }

        const categoryName = formData.get('category') as string
        const description = formData.get('description') as string
        const dateRaw = formData.get('date') as string

        let date: string
        try {
            date = dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString()
        } catch {
            return { error: 'Invalid date format' }
        }

        const customCategory = formData.get('custom_category') as string

        // Override category name if "Other" and custom name provided
        let finalCategoryName = categoryName
        if (categoryName === 'Other' && customCategory && customCategory.trim()) {
            finalCategoryName = customCategory.trim()
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const projectIdRaw = formData.get('projectId') as string
        const projectId = projectIdRaw && projectIdRaw !== 'undefined' && projectIdRaw !== 'null' ? projectIdRaw : null

        // Handle Category Link (reuse existing logic if possible, or duplicate for now safely)
        // We need to pass supabase client to helper if we want to reuse it, which we can.
        const categoryId = await getOrCreateCategory(supabase, user.id, finalCategoryName, type)

        const { error } = await supabase.from('transactions')
            .update({
                type,
                amount,
                category_id: categoryId,
                category_name: finalCategoryName,
                description,
                date,
                project_id: projectId
            })
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Error updating transaction:', error)
            return { error: 'Failed to update transaction' }
        }

        revalidatePath('/dashboard/finances')
        return { success: true }
    } catch (e) {
        console.error('Unexpected error in updateTransaction:', e)
        return { error: 'An unexpected error occurred' }
    }
}
