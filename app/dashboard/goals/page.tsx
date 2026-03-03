import { auth } from '@/auth'
import { db } from '@/lib/db'
import { goals, goalProgressLogs, goalMilestones } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { GoalsManager } from '@/components/goals/goals-manager'
import { redirect } from 'next/navigation'

export default async function GoalsPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q: searchQuery } = await searchParams
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const goalsData = await db.select().from(goals).where(eq(goals.userId, session.user.id))

    // Fetch related logs and milestones
    const goalIds = goalsData.map(g => g.id)
    let logsData: any[] = []
    let milestonesData: any[] = []

    if (goalIds.length > 0) {
        logsData = await db.select().from(goalProgressLogs).where(eq(goalProgressLogs.userId, session.user.id)).orderBy(asc(goalProgressLogs.createdAt))
        // we can fetch all milestones for this user's goals
        milestonesData = await db.select().from(goalMilestones).orderBy(asc(goalMilestones.createdAt))
    }

    const allGoals = goalsData.map(g => ({
        ...g,
        user_id: g.userId,
        current_value: Number(g.currentValue ?? 0),
        target_value: Number(g.targetValue),
        color: g.color || '#3b82f6',
        created_at: g.createdAt?.toISOString(),
        logs: logsData.filter(l => l.goalId === g.id).map(l => ({ ...l, createdAt: l.createdAt.toISOString() })),
        milestones: milestonesData.filter(m => m.goalId === g.id).map(m => ({ ...m, completedAt: m.completedAt?.toISOString() || null }))
    }))

    return <GoalsManager initialGoals={allGoals as any} searchQuery={searchQuery} />
}
