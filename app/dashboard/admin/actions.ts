'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface UserDTO {
    id: string
    email?: string
    name?: string
    role?: string
    last_sign_in_at?: string
    created_at: string
}

async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
        throw new Error('Forbidden: You are not an admin')
    }

    return user
}

export async function getUsers(): Promise<UserDTO[]> {
    await checkAdmin()

    // We can reuse the client check from checkAdmin, but need to instantiate for listUsers
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // TODO: Add robust role check here (e.g. check user_metadata.role === 'admin')
    // For now, we allow access but this should be restricted.

    const admin = createAdminClient()
    const { data: { users }, error } = await admin.auth.admin.listUsers()

    if (error) {
        console.error('Error fetching users:', error)
        throw new Error('Failed to fetch users')
    }

    // Fetch names from public.users table
    const { data: publicUsers } = await admin
        .from('users')
        .select('id, name')
        .in('id', users.map(u => u.id))

    // Create a map for quick lookup
    const namesMap = new Map(publicUsers?.map(u => [u.id, u.name]) || [])

    return users.map(u => {
        const publicName = namesMap.get(u.id)
        const metaName = u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            (u.user_metadata?.first_name ? `${u.user_metadata.first_name} ${u.user_metadata?.last_name || ''}` : '') ||
            'N/A'

        return {
            id: u.id,
            email: u.email,
            name: publicName || metaName,
            role: u.role, // This is the built-in supabase role (usually authenticated)
            last_sign_in_at: u.last_sign_in_at,
            created_at: u.created_at
        }
    })
}

export async function deleteUser(userId: string) {
    await checkAdmin()
    // Determine strict admin check before allowing delete
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(userId)

    if (error) {
        throw new Error(`Failed to delete user: ${error.message}`)
    }

    revalidatePath('/dashboard/admin')
}

// Reuse SessionInfo type from device-actions
import { SessionInfo } from '@/app/dashboard/settings/device-actions'
import { UAParser } from 'ua-parser-js'

export async function getUserSessionsAdmin(userId: string): Promise<SessionInfo[]> {
    await checkAdmin()
    const admin = createAdminClient()
    const { data: sessions, error } = await admin.rpc('admin_get_user_sessions', { target_user_id: userId })

    if (error || !sessions) {
        console.error('Error fetching user sessions:', error)
        return []
    }

    return (sessions as any[]).map((session) => {
        const parser = new UAParser(session.user_agent)
        return {
            id: session.id,
            isCurrent: false, // Can't easily determine current from admin view without session ID context
            ip: session.ip,
            lastActive: session.updated_at ? new Date(session.updated_at).toLocaleString() : 'Unknown',
            browser: `${parser.getBrowser().name || 'Unknown'} ${parser.getBrowser().version || ''}`.trim(),
            os: `${parser.getOS().name || 'Unknown'} ${parser.getOS().version || ''}`.trim(),
            device: parser.getDevice().model || parser.getDevice().type || 'Desktop',
            created_at: session.created_at
        }
    })
}

export async function revokeUserSessionAdmin(sessionId: string) {
    await checkAdmin()
    const admin = createAdminClient()
    const { error } = await admin.rpc('admin_revoke_session', { session_id: sessionId })

    if (error) {
        throw new Error(`Failed to revoke session: ${error.message}`)
    }
}
