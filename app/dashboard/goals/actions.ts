'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { goals, goalProgressLogs, goalMilestones, teamMembers } from '@/lib/db/schema'
import { eq, and, or } from 'drizzle-orm'
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
    const color = (formData.get('color') as string) || '#3b82f6'
    const teamId = formData.get('teamId') as string | null

    await db.insert(goals).values({
        userId: session.user.id,
        teamId: teamId || null,
        title,
        type,
        targetValue: String(target),
        currentValue: String(current),
        unit,
        color,
        deadline: deadline || null,
    })

    revalidatePath('/dashboard/goals')
}

export async function updateGoalProgress(id: string, current: number) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const [goal] = await db.select({ currentValue: goals.currentValue }).from(goals).where(eq(goals.id, id))
    if (!goal) throw new Error('Goal not found')

    const oldVal = Number(goal.currentValue || 0)
    const addedValue = current - oldVal

    await db.update(goals)
        .set({ currentValue: String(current) })
        .where(eq(goals.id, id))

    if (addedValue !== 0) {
        await db.insert(goalProgressLogs).values({
            goalId: id,
            userId: session.user.id,
            addedValue: String(addedValue),
        })
    }

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
    const color = formData.get('color') as string

    await db.update(goals)
        .set({ title, type, targetValue: String(target), unit, color: color || '#3b82f6', deadline: deadline || null })
        .where(and(eq(goals.id, id), eq(goals.userId, session.user.id)))

    revalidatePath('/dashboard/goals')
}

export async function addMilestone(goalId: string, title: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    await db.insert(goalMilestones).values({
        goalId,
        title,
    })
    revalidatePath('/dashboard/goals')
}

export async function toggleMilestone(id: string, completed: boolean) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    await db.update(goalMilestones)
        .set({
            completed,
            completedAt: completed ? new Date() : null
        })
        .where(eq(goalMilestones.id, id))

    revalidatePath('/dashboard/goals')
}

export async function deleteMilestone(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    await db.delete(goalMilestones).where(eq(goalMilestones.id, id))
    revalidatePath('/dashboard/goals')
}
