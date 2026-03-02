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
    // Auth.js doesn't natively track active sessions in the database in a way
    // that exposes user agent and IP data by default via the core adapter.
    // For now, we return a dummy session or empty array to avoid breaking the UI
    // while migrating away from Supabase RPCs.
    return []
}

export async function revokeSession(sessionId: string) {
    // No-op for now due to the same reason
    return { success: true }
}
