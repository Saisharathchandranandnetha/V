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
    const supabase = await createClient()

    const type = formData.get('type') as 'Income' | 'Expense'
    const amount = Number(formData.get('amount'))
    const categoryName = formData.get('category') as string
    const description = formData.get('description') as string
    const dateRaw = formData.get('date') as string

    const customCategory = formData.get('custom_category') as string

    // Override category name if "Other" and custom name provided
    let finalCategoryName = categoryName
    if (categoryName === 'Other' && customCategory && customCategory.trim()) {
        finalCategoryName = customCategory.trim()
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Handle Category Link
    const categoryId = await getOrCreateCategory(supabase, user.id, finalCategoryName, type)

    const { error } = await supabase.from('transactions').insert({
        type,
        amount,
        category_id: categoryId,
        category_name: finalCategoryName,
        description,
        date: dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString(),
        user_id: user.id
    })

    if (error) {
        console.error('Error adding transaction:', error)
        throw new Error('Failed to add transaction')
    }

    revalidatePath('/dashboard/finances')
}

export async function deleteTransaction(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw new Error('Failed to delete transaction')

    revalidatePath('/dashboard/finances')
}

export async function updateTransaction(id: string, formData: FormData) {
    const supabase = await createClient()

    const type = formData.get('type') as 'Income' | 'Expense'
    const amount = Number(formData.get('amount'))
    const categoryName = formData.get('category') as string
    const description = formData.get('description') as string
    const dateRaw = formData.get('date') as string

    const customCategory = formData.get('custom_category') as string

    // Override category name if "Other" and custom name provided
    let finalCategoryName = categoryName
    if (categoryName === 'Other' && customCategory && customCategory.trim()) {
        finalCategoryName = customCategory.trim()
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

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
            date: dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating transaction:', error)
        throw new Error('Failed to update transaction')
    }

    revalidatePath('/dashboard/finances')
}
