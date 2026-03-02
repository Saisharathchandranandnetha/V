'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'

export interface UserDTO {
    id: string
    email?: string
    name?: string
    role?: string
    last_sign_in_at?: string
    created_at: string
}

async function checkAdmin() {
    const session = await auth()

    if (!session?.user) {
        throw new Error('Unauthorized')
    }

    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || session.user.email !== adminEmail) {
        throw new Error('Forbidden: You are not an admin')
    }

    return session.user
}

export async function getUsers(): Promise<UserDTO[]> {
    await checkAdmin()

    // Query our users table directly using Drizzle
    const allUsers = await db.select().from(users)

    return allUsers.map(u => ({
        id: u.id,
        email: u.email || undefined,
        name: u.name || 'Unknown',
        role: u.role || 'user',
        last_sign_in_at: undefined, // Not tracked in Auth.js adapter by default
        created_at: new Date().toISOString() // Or use a created_at column if added
    }))
}

export async function deleteUser(userId: string) {
    await checkAdmin()

    // Delete user from db
    await db.delete(users).where(eq(users.id, userId))

    revalidatePath('/dashboard/admin')
}

// Reuse SessionInfo type from device-actions
import { SessionInfo } from '@/app/dashboard/settings/device-actions'

export async function getUserSessionsAdmin(userId: string): Promise<SessionInfo[]> {
    await checkAdmin()

    // Since we don't have access to Supabase auth sessions anymore, return empty or implement a custom session tracking logic.
    return []
}

export async function revokeUserSessionAdmin(sessionId: string) {
    await checkAdmin()
    // No-op for now
}
