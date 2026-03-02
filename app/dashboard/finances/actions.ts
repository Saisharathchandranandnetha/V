'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { transactions, categories, tasks, teamMessages } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function getOrCreateCategory(userId: string, name: string, type: string) {
    const [existing] = await db.select({ id: categories.id }).from(categories)
        .where(and(eq(categories.userId, userId), eq(categories.name, name), eq(categories.type, type)))
        .limit(1)

    if (existing) return existing.id

    const [newCategory] = await db.insert(categories).values({ userId, name, type }).returning({ id: categories.id })
    return newCategory?.id ?? null
}

export async function addTransaction(formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { error: 'Unauthorized' }

        const type = formData.get('type') as 'Income' | 'Expense'
        const amount = Number(formData.get('amount'))
        if (isNaN(amount)) return { error: 'Invalid amount' }

        const categoryName = formData.get('category') as string
        const customCategory = formData.get('custom_category') as string
        const finalCategoryName = (categoryName === 'Other' && customCategory?.trim()) ? customCategory.trim() : categoryName
        const description = formData.get('description') as string
        const dateRaw = formData.get('date') as string
        const date = dateRaw ? new Date(dateRaw) : new Date()

        const categoryId = await getOrCreateCategory(session.user.id, finalCategoryName, type)

        await db.insert(transactions).values({
            userId: session.user.id,
            type,
            amount: String(amount),
            categoryId,
            categoryName: finalCategoryName,
            description,
            date,
        })

        revalidatePath('/dashboard/finances')
        return { success: true }
    } catch (e) {
        console.error('Unexpected error in addTransaction:', e)
        return { error: 'An unexpected error occurred' }
    }
}

export async function deleteTransaction(id: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { error: 'Unauthorized' }

        await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, session.user.id)))
        revalidatePath('/dashboard/finances')
        return { success: true }
    } catch {
        return { error: 'Failed to delete transaction' }
    }
}

export async function updateTransaction(id: string, formData: FormData) {
    try {
        const session = await auth()
        if (!session?.user?.id) return { error: 'Unauthorized' }

        const type = formData.get('type') as 'Income' | 'Expense'
        const amount = Number(formData.get('amount'))
        if (isNaN(amount)) return { error: 'Invalid amount' }

        const categoryName = formData.get('category') as string
        const customCategory = formData.get('custom_category') as string
        const finalCategoryName = (categoryName === 'Other' && customCategory?.trim()) ? customCategory.trim() : categoryName
        const description = formData.get('description') as string
        const dateRaw = formData.get('date') as string
        const date = dateRaw ? new Date(dateRaw) : new Date()

        const categoryId = await getOrCreateCategory(session.user.id, finalCategoryName, type)

        await db.update(transactions)
            .set({ type, amount: String(amount), categoryId, categoryName: finalCategoryName, description, date })
            .where(and(eq(transactions.id, id), eq(transactions.userId, session.user.id)))

        revalidatePath('/dashboard/finances')
        return { success: true }
    } catch (e) {
        console.error('Unexpected error in updateTransaction:', e)
        return { error: 'An unexpected error occurred' }
    }
}
