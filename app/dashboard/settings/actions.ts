'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users, collections, categories } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function isAdmin(): Promise<boolean> {
    const session = await auth()
    if (!session?.user?.email) return false
    return session.user.email === process.env.ADMIN_EMAIL
}

export async function getUserSettings() {
    const session = await auth()
    if (!session?.user?.id) return null

    const [userData] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)

    // Auto-create user row if missing (first login edge case)
    if (!userData) {
        const [newUser] = await db.insert(users).values({
            id: session.user.id,
            email: session.user.email ?? '',
            name: session.user.name ?? '',
            image: session.user.image ?? '',
            settings: {},
        }).returning()
        return newUser
    }

    return userData
}

export async function updateAvatar(url: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    await db.update(users).set({ image: url }).where(eq(users.id, session.user.id))
    revalidatePath('/dashboard/settings')
}

export async function updateSettings(settings: Record<string, unknown>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    const [currentUser] = await db.select({ settings: users.settings }).from(users).where(eq(users.id, session.user.id)).limit(1)
    const currentSettings = (currentUser?.settings as Record<string, unknown>) || {}
    const newSettings = { ...currentSettings, ...settings }

    await db.update(users).set({ settings: newSettings }).where(eq(users.id, session.user.id))
    revalidatePath('/dashboard/settings')
}

export async function updateProfile(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    const name = formData.get('name') as string
    const bio = formData.get('bio') as string

    const [currentUser] = await db.select({ settings: users.settings }).from(users).where(eq(users.id, session.user.id)).limit(1)
    const currentSettings = (currentUser?.settings as Record<string, unknown>) || {}

    await db.update(users)
        .set({ name, settings: { ...currentSettings, profileBio: bio } })
        .where(eq(users.id, session.user.id))

    revalidatePath('/dashboard/settings')
}

export async function createCollection(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    const name = formData.get('name') as string
    await db.insert(collections).values({ name, userId: session.user.id })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/collections')
}

export async function deleteCollection(id: string) {
    await db.delete(collections).where(eq(collections.id, id))
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/collections')
}

export async function updateCollection(id: string, formData: FormData) {
    const name = formData.get('name') as string
    await db.update(collections).set({ name }).where(eq(collections.id, id))
    revalidatePath('/dashboard/settings')
}

export async function deleteAccount() {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    await db.delete(users).where(eq(users.id, session.user.id))
    revalidatePath('/')
    redirect('/login')
}

export async function updatePassword(formData: FormData) {
    throw new Error('Password updates are not supported for Google OAuth accounts.')
}

// Password update not applicable for OAuth-only auth — removed

export async function createCategory(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')

    const name = formData.get('name') as string
    await db.insert(categories).values({ name, type: 'resource', userId: session.user.id })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/categories')
}

export async function deleteCategory(id: string) {
    await db.delete(categories).where(eq(categories.id, id))
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/categories')
}

export async function updateCategory(id: string, formData: FormData) {
    const name = formData.get('name') as string
    await db.update(categories).set({ name }).where(eq(categories.id, id))
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/categories')
}
