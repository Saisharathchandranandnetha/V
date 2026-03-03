'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { resources, notes, learningPaths, chatSharedItems, roadmaps, roadmapSteps, roadmapStepLinks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'

export async function addToMyAccount(sharedItemId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')
    const userId = session.user.id

    // 1. Fetch Shared Item Details
    const [sharedItem] = await db.select()
        .from(chatSharedItems)
        .where(eq(chatSharedItems.id, sharedItemId))
        .limit(1)

    if (!sharedItem) {
        throw new Error('Shared item not found')
    }

    // 2. Determine Type and Fetch Original Content
    const originalItemId = sharedItem.sharedItemId
    const type = sharedItem.sharedType

    // 3. Prevent Duplicates
    let existingCopy: any = null

    if (type === 'resource') {
        const [data] = await db.select({ id: resources.id }).from(resources)
            .where(and(eq(resources.originalItemId, originalItemId), eq(resources.userId, userId))).limit(1)
        existingCopy = data
    } else if (type === 'note') {
        const [data] = await db.select({ id: notes.id }).from(notes)
            .where(and(eq(notes.originalItemId, originalItemId), eq(notes.userId, userId))).limit(1)
        existingCopy = data
    } else if (type === 'learning_path') {
        const [data] = await db.select({ id: learningPaths.id }).from(learningPaths)
            .where(and(eq(learningPaths.originalItemId, originalItemId), eq(learningPaths.userId, userId))).limit(1)
        existingCopy = data
    } else if (type === 'roadmap') {
        const [data] = await db.select({ id: roadmaps.id }).from(roadmaps)
            .where(and(eq(roadmaps.originalRoadmapId, originalItemId), eq(roadmaps.ownerId, userId))).limit(1)
        existingCopy = data
    }

    if (existingCopy) {
        throw new Error('You have already added this item to your account')
    }

    // 4. Fetch Original Data & Create Copy
    if (type === 'resource') {
        const [original] = await db.select().from(resources).where(eq(resources.id, originalItemId)).limit(1)
        if (!original) throw new Error('Original resource not found')

        await db.insert(resources).values({
            userId,
            title: original.title,
            type: original.type,
            url: original.url,
            summary: original.summary,
            tags: original.tags,
            originalItemId: original.id,
            copiedFromChat: true,
            copiedAt: new Date(),
            projectId: null,
            collectionId: null
        })
    }
    else if (type === 'note') {
        const [original] = await db.select().from(notes).where(eq(notes.id, originalItemId)).limit(1)
        if (!original) throw new Error('Original note not found')

        await db.insert(notes).values({
            userId,
            title: original.title,
            content: original.content,
            originalItemId: original.id,
            copiedFromChat: true,
            copiedAt: new Date(),
            projectId: null,
            collectionId: null
        })
    }
    else if (type === 'learning_path') {
        const [original] = await db.select().from(learningPaths).where(eq(learningPaths.id, originalItemId)).limit(1)
        if (!original) throw new Error('Original learning path not found')

        await db.insert(learningPaths).values({
            userId,
            title: original.title,
            description: original.description,
            links: original.links,
            originalItemId: original.id,
            copiedFromChat: true,
            copiedAt: new Date(),
            projectId: null,
            collectionId: null
        })
    }
    else if (type === 'roadmap') {
        const [original] = await db.select().from(roadmaps).where(eq(roadmaps.id, originalItemId)).limit(1)
        if (!original) throw new Error('Original roadmap not found')

        const newRoadmapId = uuidv4()
        await db.insert(roadmaps).values({
            id: newRoadmapId,
            ownerId: userId,
            title: original.title,
            description: original.description,
            status: 'draft',
            progress: original.progress,
            originalRoadmapId: original.id,
            copiedFromChat: true,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        // Copy steps
        const originalSteps = await db.select().from(roadmapSteps).where(eq(roadmapSteps.roadmapId, originalItemId))
        if (originalSteps.length > 0) {
            const stepIdMap = new Map<string, string>()

            // Generate mapping of old step IDs to new IDs
            for (const step of originalSteps) stepIdMap.set(step.id, uuidv4())

            for (const step of originalSteps) {
                const newStepId = stepIdMap.get(step.id)!
                const newParentId = step.parentStepId ? stepIdMap.get(step.parentStepId) || null : null

                await db.insert(roadmapSteps).values({
                    id: newStepId,
                    roadmapId: newRoadmapId,
                    parentStepId: newParentId,
                    title: step.title,
                    description: step.description,
                    order: step.order,
                    completed: false,
                    linkedResourceId: step.linkedResourceId,
                    linkedTaskId: step.linkedTaskId,
                    linkedNoteId: step.linkedNoteId,
                    linkedPathId: step.linkedPathId,
                    linkedGoalId: step.linkedGoalId,
                })

                // Copy links for this step
                const originalLinks = await db.select().from(roadmapStepLinks).where(eq(roadmapStepLinks.stepId, step.id))
                if (originalLinks.length > 0) {
                    await db.insert(roadmapStepLinks).values(originalLinks.map(link => ({
                        stepId: newStepId,
                        noteId: link.noteId,
                        learningPathId: link.learningPathId,
                        resourceId: link.resourceId,
                        goalId: link.goalId
                    })))
                }
            }
        }
    }

    revalidatePath('/dashboard/resources')
    revalidatePath('/dashboard/notes')
    revalidatePath('/dashboard/learning')

    return { success: true }
}

export async function copyItemToAccount(originalItemId: string, type: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')
    const userId = session.user.id

    let existingCopy: any = null

    if (type === 'resource') {
        const [data] = await db.select({ id: resources.id }).from(resources)
            .where(and(eq(resources.id, originalItemId), eq(resources.userId, userId))).limit(1)
        if (data) return { success: true, newId: originalItemId, isNew: false }
    } else if (type === 'note') {
        const [data] = await db.select({ id: notes.id }).from(notes)
            .where(and(eq(notes.id, originalItemId), eq(notes.userId, userId))).limit(1)
        if (data) return { success: true, newId: originalItemId, isNew: false }
    } else if (type === 'learning_path') {
        const [data] = await db.select({ id: learningPaths.id }).from(learningPaths)
            .where(and(eq(learningPaths.id, originalItemId), eq(learningPaths.userId, userId))).limit(1)
        if (data) return { success: true, newId: originalItemId, isNew: false }
    } else if (type === 'roadmap') {
        const [data] = await db.select({ id: roadmaps.id }).from(roadmaps)
            .where(and(eq(roadmaps.id, originalItemId), eq(roadmaps.ownerId, userId))).limit(1)
        if (data) return { success: true, newId: originalItemId, isNew: false }
    }

    if (type === 'resource') {
        const [data] = await db.select({ id: resources.id }).from(resources)
            .where(and(eq(resources.originalItemId, originalItemId), eq(resources.userId, userId))).limit(1)
        existingCopy = data
    } else if (type === 'note') {
        const [data] = await db.select({ id: notes.id }).from(notes)
            .where(and(eq(notes.originalItemId, originalItemId), eq(notes.userId, userId))).limit(1)
        existingCopy = data
    } else if (type === 'learning_path') {
        const [data] = await db.select({ id: learningPaths.id }).from(learningPaths)
            .where(and(eq(learningPaths.originalItemId, originalItemId), eq(learningPaths.userId, userId))).limit(1)
        existingCopy = data
    } else if (type === 'roadmap') {
        const [data] = await db.select({ id: roadmaps.id }).from(roadmaps)
            .where(and(eq(roadmaps.originalRoadmapId, originalItemId), eq(roadmaps.ownerId, userId))).limit(1)
        existingCopy = data
    }

    // --- UPDATE EXISTING LOGIC ---
    if (existingCopy) {
        let updated = false
        if (type === 'resource') {
            const [original] = await db.select().from(resources).where(eq(resources.id, originalItemId)).limit(1)
            if (original) {
                await db.update(resources).set({
                    title: original.title,
                    type: original.type,
                    url: original.url,
                    summary: original.summary,
                    tags: original.tags
                }).where(eq(resources.id, existingCopy.id))
                updated = true
            }
        } else if (type === 'note') {
            const [original] = await db.select().from(notes).where(eq(notes.id, originalItemId)).limit(1)
            if (original) {
                await db.update(notes).set({
                    title: original.title,
                    content: original.content,
                    updatedAt: new Date()
                }).where(eq(notes.id, existingCopy.id))
                updated = true
            }
        } else if (type === 'learning_path') {
            const [original] = await db.select().from(learningPaths).where(eq(learningPaths.id, originalItemId)).limit(1)
            if (original) {
                await db.update(learningPaths).set({
                    title: original.title,
                    description: original.description,
                    links: original.links
                }).where(eq(learningPaths.id, existingCopy.id))
                updated = true
            }
        } else if (type === 'roadmap') {
            const [original] = await db.select().from(roadmaps).where(eq(roadmaps.id, originalItemId)).limit(1)
            if (original) {
                await db.update(roadmaps).set({
                    title: original.title,
                    description: original.description,
                    updatedAt: new Date()
                }).where(eq(roadmaps.id, existingCopy.id))
                updated = true
            }
        }

        if (updated) {
            revalidatePath('/dashboard/resources')
            revalidatePath('/dashboard/notes')
            revalidatePath('/dashboard/learning')
            return { success: true, newId: existingCopy.id, isNew: false, updated: true }
        } else {
            return { success: true, newId: existingCopy.id, isNew: false, updated: false }
        }
    }


    let newId = ''

    // Create Copy
    if (type === 'resource') {
        const [original] = await db.select().from(resources).where(eq(resources.id, originalItemId)).limit(1)
        if (!original) throw new Error('Original resource not found')

        const [newItem] = await db.insert(resources).values({
            userId,
            title: original.title,
            type: original.type,
            url: original.url,
            summary: original.summary,
            tags: original.tags,
            originalItemId: original.id,
            copiedFromChat: true,
            copiedAt: new Date(),
            projectId: null,
            collectionId: null
        }).returning({ id: resources.id })

        newId = newItem.id
    }
    else if (type === 'note') {
        const [original] = await db.select().from(notes).where(eq(notes.id, originalItemId)).limit(1)
        if (!original) throw new Error('Original note not found')

        const [newItem] = await db.insert(notes).values({
            userId,
            title: original.title,
            content: original.content,
            originalItemId: original.id,
            copiedFromChat: true,
            copiedAt: new Date(),
            projectId: null,
            collectionId: null
        }).returning({ id: notes.id })

        newId = newItem.id
    }
    else if (type === 'learning_path') {
        const [original] = await db.select().from(learningPaths).where(eq(learningPaths.id, originalItemId)).limit(1)
        if (!original) throw new Error('Original learning path not found')

        const [newItem] = await db.insert(learningPaths).values({
            userId,
            title: original.title,
            description: original.description,
            links: original.links,
            originalItemId: original.id,
            copiedFromChat: true,
            copiedAt: new Date(),
            projectId: null,
            collectionId: null
        }).returning({ id: learningPaths.id })

        newId = newItem.id
    }
    else if (type === 'roadmap') {
        const [original] = await db.select().from(roadmaps).where(eq(roadmaps.id, originalItemId)).limit(1)
        if (!original) throw new Error('Original roadmap not found')

        const newRoadmapId = uuidv4()
        await db.insert(roadmaps).values({
            id: newRoadmapId,
            ownerId: userId,
            title: original.title,
            description: original.description,
            status: 'draft',
            progress: original.progress,
            originalRoadmapId: original.id,
            copiedFromChat: true,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        // Copy steps
        const originalSteps = await db.select().from(roadmapSteps).where(eq(roadmapSteps.roadmapId, originalItemId))
        if (originalSteps.length > 0) {
            const stepIdMap = new Map<string, string>()

            // Generate mapping of old step IDs to new IDs
            for (const step of originalSteps) stepIdMap.set(step.id, uuidv4())

            for (const step of originalSteps) {
                const newStepId = stepIdMap.get(step.id)!
                const newParentId = step.parentStepId ? stepIdMap.get(step.parentStepId) || null : null

                await db.insert(roadmapSteps).values({
                    id: newStepId,
                    roadmapId: newRoadmapId,
                    parentStepId: newParentId,
                    title: step.title,
                    description: step.description,
                    order: step.order,
                    completed: false,
                    linkedResourceId: step.linkedResourceId,
                    linkedTaskId: step.linkedTaskId,
                    linkedNoteId: step.linkedNoteId,
                    linkedPathId: step.linkedPathId,
                    linkedGoalId: step.linkedGoalId,
                })

                // Copy links for this step
                const originalLinks = await db.select().from(roadmapStepLinks).where(eq(roadmapStepLinks.stepId, step.id))
                if (originalLinks.length > 0) {
                    await db.insert(roadmapStepLinks).values(originalLinks.map(link => ({
                        stepId: newStepId,
                        noteId: link.noteId,
                        learningPathId: link.learningPathId,
                        resourceId: link.resourceId,
                        goalId: link.goalId
                    })))
                }
            }
        }

        newId = newRoadmapId
    }

    revalidatePath('/dashboard/resources')
    revalidatePath('/dashboard/notes')
    revalidatePath('/dashboard/learning')
    revalidatePath('/dashboard/roadmaps')

    return { success: true, newId, isNew: true }
}
