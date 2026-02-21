import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/health
 * Quick Supabase connectivity check.
 * Returns status of the DB connection and which tables exist.
 */
export async function GET() {
    const start = Date.now()

    try {
        const supabase = await createClient()

        // Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        // Ping each core table (anon/auth-safe)
        const tableChecks = await Promise.allSettled([
            supabase.from('users').select('id').limit(1),
            supabase.from('tasks').select('id').limit(1),
            supabase.from('habits').select('id').limit(1),
            supabase.from('goals').select('id').limit(1),
            supabase.from('notes').select('id').limit(1),
            supabase.from('transactions').select('id').limit(1),
            supabase.from('teams').select('id').limit(1),
            supabase.from('roadmaps').select('id').limit(1),
        ])

        const tables = ['users', 'tasks', 'habits', 'goals', 'notes', 'transactions', 'teams', 'roadmaps']

        const tableStatus = tables.map((name, i) => {
            const result = tableChecks[i]
            if (result.status === 'fulfilled') {
                const { error } = result.value
                // RLS blocks = table exists + security working = healthy
                const isRlsBlock = error?.code === 'PGRST116' || (error?.message ?? '').includes('row-level security')
                const ok = !error || isRlsBlock
                return { table: name, ok, error: ok ? null : (error?.message ?? null) }
            }
            return { table: name, ok: false, error: 'Promise rejected' }
        })

        const allOk = tableStatus.every(t => t.ok)
        const elapsed = Date.now() - start

        return NextResponse.json({
            status: allOk ? 'healthy' : 'degraded',
            supabase: 'connected',
            authenticated: !!user,
            elapsed_ms: elapsed,
            tables: tableStatus,
            timestamp: new Date().toISOString(),
        }, { status: allOk ? 200 : 207 })

    } catch (err: unknown) {
        return NextResponse.json({
            status: 'error',
            supabase: 'unreachable',
            error: err instanceof Error ? err.message : String(err),
            elapsed_ms: Date.now() - start,
        }, { status: 500 })
    }
}
