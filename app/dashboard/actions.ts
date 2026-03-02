'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { resources, learningPaths, collections, categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createResource(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('You must be logged in to create a resource')

    const title = formData.get('title') as string
    const url = formData.get('url') as string
    const type = formData.get('type') as string
    const summary = formData.get('summary') as string
    const tagsRaw = formData.get('tags') as string
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
    const collectionId = formData.get('collection_id') as string

    await db.insert(resources).values({
        userId: session.user.id,
        title, url, type, summary, tags,
        collectionId: (collectionId && collectionId !== 'none') ? collectionId : null,
    })

    revalidatePath('/dashboard/resources')
    redirect('/dashboard/resources')
}

export async function deleteResource(id: string) {
    await db.delete(resources).where(eq(resources.id, id))
    revalidatePath('/dashboard/resources')
}

export async function updateResource(id: string, formData: FormData) {
    const title = formData.get('title') as string
    const url = formData.get('url') as string
    const type = formData.get('type') as string
    const summary = formData.get('summary') as string
    const tagsRaw = formData.get('tags') as string
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
    const collectionId = formData.get('collection_id') as string

    await db.update(resources).set({
        title, url, type, summary, tags,
        collectionId: (collectionId && collectionId !== 'none') ? collectionId : null,
    }).where(eq(resources.id, id))

    revalidatePath('/dashboard/resources')
    redirect('/dashboard/resources')
}

export async function createLearningPath(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const linksRaw = formData.get('links') as string
    const links = linksRaw ? linksRaw.split(/[\n,]+/).map(l => l.trim()).filter(Boolean) : []

    await db.insert(learningPaths).values({ userId: session.user.id, title, description, links })

    revalidatePath('/dashboard/paths')
    redirect('/dashboard/paths')
}

export async function deleteLearningPath(id: string) {
    await db.delete(learningPaths).where(eq(learningPaths.id, id))
    revalidatePath('/dashboard/paths')
}

export async function updateLearningPath(id: string, formData: FormData) {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const linksRaw = formData.get('links') as string
    const links = linksRaw ? linksRaw.split(/[\n,]+/).map(l => l.trim()).filter(Boolean) : []

    await db.update(learningPaths).set({ title, description, links }).where(eq(learningPaths.id, id))
    revalidatePath('/dashboard/paths')
    redirect('/dashboard/paths')
}

export async function createCollectionAndReturn(name: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    const [data] = await db.insert(collections).values({ name, userId: session.user.id }).returning()
    return data
}

export async function moveItemToCollection(itemId: string, itemType: string, collectionId: string | null) {
    const finalCollectionId = collectionId === 'none' ? null : collectionId
    const tableMap: Record<string, typeof resources | typeof learningPaths> = {
        'resource': resources,
        'path': learningPaths,
    }
    const table = tableMap[itemType]
    if (table) await db.update(table).set({ collectionId: finalCollectionId } as any).where(eq((table as any).id, itemId))

    revalidatePath('/dashboard/collections')
    revalidatePath('/dashboard/resources')
    revalidatePath('/dashboard/paths')
}

export async function createCategoryAndReturn(name: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    const [data] = await db.insert(categories).values({ name, type: 'resource', userId: session.user.id }).returning()
    return data
}

export async function toggleLearningPathCompletion(id: string, _isCompleted: boolean) {
    // is_completed not in schema — skip or add field later
    revalidatePath('/dashboard/paths')
}

export async function getCollections() {
    const session = await auth()
    if (!session?.user?.id) return []
    const data = await db.select({ id: collections.id, name: collections.name }).from(collections).where(eq(collections.userId, session.user.id))
    return data.sort((a, b) => a.name.localeCompare(b.name))
}
