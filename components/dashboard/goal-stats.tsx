import { db } from '@/lib/db'
import { goals } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { HoverEffect } from '@/components/ui/hover-effect'
import Link from 'next/link'

export async function GoalStats({ userId }: { userId: string }) {
    const goalsVector = await db.select({
        currentValue: goals.currentValue,
        targetValue: goals.targetValue
    })
        .from(goals)
        .where(eq(goals.userId, userId))

    let avgProgress = 0
    if (goalsVector && goalsVector.length > 0) {
        const totalProgress = goalsVector.reduce((acc, g) => acc + Math.min((Number(g.currentValue) / Number(g.targetValue)) * 100, 100), 0)
        avgProgress = totalProgress / goalsVector.length
    }

    return (
        <HoverEffect variant="lift">
            <Link href="/dashboard/goals" prefetch={false} className="block h-full">
                <SpotlightCard className="h-full bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border-violet-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
                        <Target className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgProgress.toFixed(0)}%</div>
                        <Progress value={avgProgress} className="h-1.5 mt-2 bg-violet-100 dark:bg-violet-900/30" />
                    </CardContent>
                </SpotlightCard>
            </Link>
        </HoverEffect>
    )
}
