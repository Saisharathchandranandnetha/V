'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { resources, notes, learningPaths, chatSharedItems } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

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

    // Check if user is the OWNER of the original item
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

    revalidatePath('/dashboard/resources')
    revalidatePath('/dashboard/notes')
    revalidatePath('/dashboard/learning')

    return { success: true, newId, isNew: true }
}
