import { auth } from '@/auth'
import { db } from '@/lib/db'
import { goals } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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

    const allGoals = goalsData.map(g => ({
        ...g,
        user_id: g.userId,
        current_value: Number(g.currentValue ?? 0),
        target_value: Number(g.targetValue),
        created_at: g.createdAt?.toISOString(),
    }))

    return <GoalsManager initialGoals={allGoals as any} searchQuery={searchQuery} />
}
