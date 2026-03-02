'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { roadmaps, roadmapSteps, roadmapStepLinks } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRoadmap(data: {
    title: string
    description?: string
    teamId?: string
    projectId?: string
}, shouldRedirect = true) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    const [roadmap] = await db.insert(roadmaps).values({
        title: data.title,
        description: data.description,
        ownerId: session.user.id,
        teamId: data.teamId || null,
        projectId: data.projectId || null,
        status: 'draft',
    }).returning()

    revalidatePath('/dashboard/roadmaps')
    if (shouldRedirect) redirect(`/dashboard/roadmaps/${roadmap.id}`)
    return roadmap
}

export async function updateRoadmap(id: string, data: {
    title?: string
    description?: string
    status?: 'draft' | 'active' | 'completed'
    progress?: number
}) {
    await db.update(roadmaps).set(data).where(eq(roadmaps.id, id))
    revalidatePath(`/dashboard/roadmaps/${id}`)
    revalidatePath('/dashboard/roadmaps')
}

export async function deleteRoadmap(id: string) {
    await db.delete(roadmaps).where(eq(roadmaps.id, id))
    revalidatePath('/dashboard/roadmaps')
    redirect('/dashboard/roadmaps')
}

export async function createRoadmapStep(roadmapId: string, data: {
    title: string
    order: number
    parentStepId?: string | null
}) {
    const [step] = await db.insert(roadmapSteps).values({
        roadmapId,
        title: data.title,
        order: data.order,
        parentStepId: data.parentStepId || null,
    }).returning()

    revalidatePath(`/dashboard/roadmaps/${roadmapId}`)
    return step
}

export async function updateRoadmapStep(id: string, data: {
    title?: string
    description?: string
    completed?: boolean
    linked_resource_id?: string | null
    linked_task_id?: string | null
    parent_step_id?: string | null
    linked_note_id?: string | null
    linked_path_id?: string | null
    linked_goal_id?: string | null
}) {
    // Map snake_case to camelCase for Drizzle
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.completed !== undefined) updateData.completed = data.completed
    if (data.linked_resource_id !== undefined) updateData.linkedResourceId = data.linked_resource_id
    if (data.linked_task_id !== undefined) updateData.linkedTaskId = data.linked_task_id
    if (data.parent_step_id !== undefined) updateData.parentStepId = data.parent_step_id
    if (data.linked_note_id !== undefined) updateData.linkedNoteId = data.linked_note_id
    if (data.linked_path_id !== undefined) updateData.linkedPathId = data.linked_path_id
    if (data.linked_goal_id !== undefined) updateData.linkedGoalId = data.linked_goal_id

    await db.update(roadmapSteps).set(updateData).where(eq(roadmapSteps.id, id))

    // Auto-calculate progress if completed changed
    if (data.completed !== undefined) {
        const [step] = await db.select({ roadmapId: roadmapSteps.roadmapId }).from(roadmapSteps).where(eq(roadmapSteps.id, id)).limit(1)
        if (step) await recalcRoadmapProgress(step.roadmapId)
    }

    const [step] = await db.select({ roadmapId: roadmapSteps.roadmapId }).from(roadmapSteps).where(eq(roadmapSteps.id, id)).limit(1)
    if (step) revalidatePath(`/dashboard/roadmaps/${step.roadmapId}`)
    revalidatePath('/dashboard/roadmaps')
}

async function recalcRoadmapProgress(roadmapId: string) {
    const allSteps = await db.select({ completed: roadmapSteps.completed }).from(roadmapSteps).where(eq(roadmapSteps.roadmapId, roadmapId))
    const total = allSteps.length
    const done = allSteps.filter(s => s.completed).length
    if (total > 0) {
        const progress = Math.round((done / total) * 100)
        await db.update(roadmaps).set({ progress }).where(eq(roadmaps.id, roadmapId))
    }
}

export async function deleteRoadmapStep(id: string) {
    const [step] = await db.select({ roadmapId: roadmapSteps.roadmapId }).from(roadmapSteps).where(eq(roadmapSteps.id, id)).limit(1)
    await db.delete(roadmapSteps).where(eq(roadmapSteps.id, id))
    if (step) revalidatePath(`/dashboard/roadmaps/${step.roadmapId}`)
}

export async function reorderSteps(items: { id: string, order: number }[]) {
    await Promise.all(items.map(item =>
        db.update(roadmapSteps).set({ order: item.order }).where(eq(roadmapSteps.id, item.id))
    ))
    if (items.length > 0) {
        const [step] = await db.select({ roadmapId: roadmapSteps.roadmapId }).from(roadmapSteps).where(eq(roadmapSteps.id, items[0].id)).limit(1)
        if (step) revalidatePath(`/dashboard/roadmaps/${step.roadmapId}`)
    }
}

export async function addStepLink(stepId: string, type: 'note' | 'path' | 'resource' | 'goal', resourceId: string) {
    const data: any = { stepId }
    if (type === 'note') data.noteId = resourceId
    if (type === 'path') data.learningPathId = resourceId
    if (type === 'resource') data.resourceId = resourceId
    if (type === 'goal') data.goalId = resourceId

    await db.insert(roadmapStepLinks).values(data)

    const [step] = await db.select({ roadmapId: roadmapSteps.roadmapId }).from(roadmapSteps).where(eq(roadmapSteps.id, stepId)).limit(1)
    if (step) revalidatePath(`/dashboard/roadmaps/${step.roadmapId}`)
}

export async function removeStepLink(linkId: string) {
    const [link] = await db.select({ stepId: roadmapStepLinks.stepId }).from(roadmapStepLinks).where(eq(roadmapStepLinks.id, linkId)).limit(1)
    await db.delete(roadmapStepLinks).where(eq(roadmapStepLinks.id, linkId))
    if (link) {
        const [step] = await db.select({ roadmapId: roadmapSteps.roadmapId }).from(roadmapSteps).where(eq(roadmapSteps.id, link.stepId)).limit(1)
        if (step) revalidatePath(`/dashboard/roadmaps/${step.roadmapId}`)
    }
}

export async function copyRoadmapFromShare(originalRoadmapId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    const [original] = await db.select().from(roadmaps).where(eq(roadmaps.id, originalRoadmapId)).limit(1)
    if (!original) throw new Error('Roadmap not found')

    const [newRoadmap] = await db.insert(roadmaps).values({
        ownerId: session.user.id,
        title: original.title,
        description: original.description,
        status: 'active',
        progress: 0,
        originalRoadmapId: original.id,
        copiedFromChat: true,
        teamId: null,
        projectId: null,
    }).returning()

    const steps = await db.select().from(roadmapSteps).where(eq(roadmapSteps.roadmapId, original.id))
    if (steps.length > 0) {
        const inserted = await db.insert(roadmapSteps).values(
            steps.map(s => ({ ...s, id: undefined, roadmapId: newRoadmap.id, completed: false, parentStepId: null } as any))
        ).returning()

        const stepMap = new Map(inserted.map((n, i) => [steps[i].id, n.id]))
        await Promise.all(steps.filter(s => s.parentStepId).map(s => {
            const newId = stepMap.get(s.id)
            const newParent = stepMap.get(s.parentStepId!)
            if (newId && newParent) return db.update(roadmapSteps).set({ parentStepId: newParent }).where(eq(roadmapSteps.id, newId))
        }))
    }

    return newRoadmap
}

export async function syncRoadmap(_copyId: string, _originalId: string) {
    // Sync is complex — basic stub, not critical for MVP
    revalidatePath('/dashboard/roadmaps')
}

// calculateRoadmapProgress exported for use by other files
export async function calculateRoadmapProgress(stepId: string) {
    const [step] = await db.select({ roadmapId: roadmapSteps.roadmapId }).from(roadmapSteps).where(eq(roadmapSteps.id, stepId)).limit(1)
    if (step) await recalcRoadmapProgress(step.roadmapId)
}
