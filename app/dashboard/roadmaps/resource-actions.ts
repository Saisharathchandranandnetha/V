'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { notes, learningPaths, resources, goals } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'

export async function getLinkableItems() {
    const session = await auth()
    if (!session?.user?.id) {
        return { notes: [], paths: [], resources: [], goals: [] }
    }

    const userId = session.user.id

    const [notesRes, pathsRes, resourcesRes, goalsRes] = await Promise.all([
        db.select({ id: notes.id, title: notes.title }).from(notes).where(eq(notes.userId, userId)).orderBy(asc(notes.title)),
        db.select({ id: learningPaths.id, title: learningPaths.title }).from(learningPaths).where(eq(learningPaths.userId, userId)).orderBy(asc(learningPaths.title)),
        db.select({ id: resources.id, title: resources.title, type: resources.type }).from(resources).where(eq(resources.userId, userId)).orderBy(asc(resources.title)),
        db.select({ id: goals.id, title: goals.title }).from(goals).where(eq(goals.userId, userId)).orderBy(asc(goals.title))
    ])

    return {
        notes: notesRes,
        paths: pathsRes,
        resources: resourcesRes,
        goals: goalsRes
    }
}
