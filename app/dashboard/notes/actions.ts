'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getNotes() {
    const session = await auth()
    if (!session?.user?.id) return []

    return await db.select().from(notes)
        .where(eq(notes.userId, session.user.id))
        .orderBy(desc(notes.createdAt))
}

export async function createNote(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const content = formData.get('content') as string

    if (!title) return { error: 'Title is required' }

    const [note] = await db.insert(notes).values({
        userId: session.user.id,
        title,
        content,
    }).returning()

    revalidatePath('/dashboard/notes')
    return { success: true, note }
}

export async function updateNote(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const content = formData.get('content') as string

    if (!id || !title) return { error: 'ID and Title are required' }

    await db.update(notes)
        .set({ title, content, updatedAt: new Date() })
        .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))

    revalidatePath('/dashboard/notes')
    return { success: true }
}

export async function deleteNote(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    await db.delete(notes)
        .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))

    revalidatePath('/dashboard/notes')
    return { success: true }
}
