'use server'

import { createClient } from '@/lib/supabase/server'
import { UAParser } from 'ua-parser-js'
import { revalidatePath } from 'next/cache'

export interface SessionInfo {
    id: string
    isCurrent: boolean
    ip?: string
    lastActive: string
    browser: string
    os: string
    device: string
    created_at: string
}

export async function getActiveSessions(): Promise<SessionInfo[]> {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        throw new Error('Unauthorized')
    }

    // Get current session ID
    const { data: { session: currentSession } } = await supabase.auth.getSession()

    // Use RPC to fetch sessions
    const { data: sessions, error } = await supabase.rpc('get_active_sessions')

    if (error || !sessions) {
        console.error('Error fetching sessions via RPC:', error)
        // Fallback: If RPC fails (not created yet), return empty or mock for UI testing
        return []
    }

    // Sort: Current session first, then by last active desc
    return (sessions as any[])
        .map((session) => {
            const parser = new UAParser(session.user_agent)
            return {
                id: session.id,
                isCurrent: session.id === (currentSession as any)?.id,
                ip: session.ip,
                lastActive: session.updated_at ? new Date(session.updated_at).toLocaleString() : 'Unknown',
                browser: `${parser.getBrowser().name || 'Unknown'} ${parser.getBrowser().version || ''}`.trim(),
                os: `${parser.getOS().name || 'Unknown'} ${parser.getOS().version || ''}`.trim(),
                device: parser.getDevice().model || parser.getDevice().type || 'Desktop',
                created_at: session.created_at
            }
        })
        .sort((a, b) => {
            if (a.isCurrent) return -1
            if (b.isCurrent) return 1
            return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
        })
}

export async function revokeSession(sessionId: string) {
    const supabase = await createClient()

    // Use RPC to revoke
    const { error } = await supabase.rpc('revoke_session', { session_id: sessionId })

    if (error) {
        throw new Error(`Failed to revoke session: ${error.message}`)
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}
