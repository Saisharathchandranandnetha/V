import { db } from '@/lib/db'
import { habits, habitLogs } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarCheck } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { HoverEffect } from '@/components/ui/hover-effect'
import Link from 'next/link'

export async function HabitStats({ userId }: { userId: string }) {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
    const today = formatter.format(now)

    // Count daily habits completed
    const [completedResult] = await db.select({ count: count() })
        .from(habitLogs)
        .innerJoin(habits, eq(habitLogs.habitId, habits.id))
        .where(
            and(
                eq(habits.userId, userId),
                eq(habitLogs.date, today),
                eq(habitLogs.status, true)
            )
        )
    const dailyHabitsCompleted = completedResult.count

    // Count total habits
    const [totalResult] = await db.select({ count: count() })
        .from(habits)
        .where(eq(habits.userId, userId))
    const totalHabitsCount = totalResult.count

    const completionRate = totalHabitsCount ? (dailyHabitsCompleted / totalHabitsCount) * 100 : 0

    return (
        <HoverEffect variant="lift" className="h-full">
            <Link href="/dashboard/habits" prefetch={false} className="block h-full">
                <SpotlightCard className="h-full bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border-indigo-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold">Daily Habits</CardTitle>
                        <CalendarCheck className="h-5 w-5 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold tracking-tighter text-indigo-500 dark:text-indigo-400">
                            {dailyHabitsCompleted || 0} <span className="text-muted-foreground text-2xl font-normal">/ {totalHabitsCount || 0}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Consistent action creates success.</p>
                        <Progress value={completionRate} className="h-2 mt-4 bg-indigo-100 dark:bg-indigo-900/30" />
                    </CardContent>
                </SpotlightCard>
            </Link>
        </HoverEffect>
    )
}
