'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { goals } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createGoal(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const title = formData.get('title') as string
    const type = (formData.get('type') as string) || 'Short Term'
    const target = Number(formData.get('target_value'))
    const unit = (formData.get('unit') as string) || '%'
    const current = Number(formData.get('current_value')) || 0
    const deadline = formData.get('deadline') as string

    await db.insert(goals).values({
        userId: session.user.id,
        title,
        type,
        targetValue: String(target),
        currentValue: String(current),
        unit,
        deadline: deadline || null,
    })

    revalidatePath('/dashboard/goals')
}

export async function updateGoalProgress(id: string, current: number) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    await db.update(goals)
        .set({ currentValue: String(current) })
        .where(and(eq(goals.id, id), eq(goals.userId, session.user.id)))

    revalidatePath('/dashboard/goals')
}

export async function deleteGoal(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    await db.delete(goals)
        .where(and(eq(goals.id, id), eq(goals.userId, session.user.id)))

    revalidatePath('/dashboard/goals')
}

export async function updateGoal(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const target = Number(formData.get('target_value'))
    const unit = formData.get('unit') as string
    const deadline = formData.get('deadline') as string

    await db.update(goals)
        .set({ title, type, targetValue: String(target), unit, deadline: deadline || null })
        .where(and(eq(goals.id, id), eq(goals.userId, session.user.id)))

    revalidatePath('/dashboard/goals')
}
