import { auth } from '@/auth'
import { db } from '@/lib/db'
import { habits, habitLogs } from '@/lib/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import { HabitsManager } from '@/components/habits/habits-manager'
import { redirect } from 'next/navigation'

export default async function HabitsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')
    const userId = session.user.id

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const habitsData = await db.select().from(habits).where(eq(habits.userId, userId))
    const logs = await db.select().from(habitLogs)
        .where(and(
            gte(habitLogs.date, ninetyDaysAgo),
        ))

    // Join logs onto habits (matching habit_logs filter from Supabase query)
    const initialHabits = habitsData.map(h => ({
        ...h,
        user_id: h.userId,
        created_at: h.createdAt?.toISOString(),
        habit_logs: logs.filter(l => l.habitId === h.id).map(l => ({
            date: l.date,
            status: l.status,
        })),
    }))

    return <HabitsManager initialHabits={initialHabits as any} />
}
