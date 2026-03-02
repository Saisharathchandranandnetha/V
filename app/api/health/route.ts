import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { auth } from '@/auth'

/**
 * GET /api/health
 * Quick database connectivity check.
 * Returns status of the DB connection and which tables exist.
 */
export async function GET() {
    const start = Date.now()

    try {
        const session = await auth()

        // Ping each core table
        const tableChecks = await Promise.allSettled([
            db.execute(sql`SELECT id FROM users LIMIT 1`),
            db.execute(sql`SELECT id FROM tasks LIMIT 1`),
            db.execute(sql`SELECT id FROM habits LIMIT 1`),
            db.execute(sql`SELECT id FROM goals LIMIT 1`),
            db.execute(sql`SELECT id FROM notes LIMIT 1`),
            db.execute(sql`SELECT id FROM transactions LIMIT 1`),
            db.execute(sql`SELECT id FROM teams LIMIT 1`),
            db.execute(sql`SELECT id FROM roadmaps LIMIT 1`),
        ])

        const tables = ['users', 'tasks', 'habits', 'goals', 'notes', 'transactions', 'teams', 'roadmaps']

        const tableStatus = tables.map((name, i) => {
            const result = tableChecks[i]
            if (result.status === 'fulfilled') {
                return { table: name, ok: true, error: null }
            }
            return { table: name, ok: false, error: 'Database query failed' }
        })

        const allOk = tableStatus.every(t => t.ok)
        const elapsed = Date.now() - start

        return NextResponse.json({
            status: allOk ? 'healthy' : 'degraded',
            database: 'connected',
            authenticated: !!session?.user,
            elapsed_ms: elapsed,
            tables: tableStatus,
            timestamp: new Date().toISOString(),
        }, { status: allOk ? 200 : 207 })

    } catch (err: unknown) {
        return NextResponse.json({
            status: 'error',
            database: 'unreachable',
            error: err instanceof Error ? err.message : String(err),
            elapsed_ms: Date.now() - start,
        }, { status: 500 })
    }
}
