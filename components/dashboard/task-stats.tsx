import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { eq, and, or, isNull, lte, count, ne, gte } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { HoverEffect } from '@/components/ui/hover-effect'
import Link from 'next/link'

export async function TaskStats({ userId }: { userId: string }) {
    const now = new Date()
    const startOfDay = new Date(now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' }))
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setHours(23, 59, 59, 999)

    // Count pending tasks
    const [pendingResult] = await db.select({ count: count() })
        .from(tasks)
        .where(
            and(
                or(
                    eq(tasks.assignedTo, userId),
                    and(isNull(tasks.assignedTo), eq(tasks.userId, userId))
                ),
                ne(tasks.status, 'Done'),
                or(lte(tasks.dueDate, endOfDay), isNull(tasks.dueDate))
            )
        )
    const tasksPending = pendingResult.count

    // Count done tasks today
    const [doneResult] = await db.select({ count: count() })
        .from(tasks)
        .where(
            and(
                or(
                    eq(tasks.assignedTo, userId),
                    and(isNull(tasks.assignedTo), eq(tasks.userId, userId))
                ),
                eq(tasks.status, 'Done'),
                gte(tasks.completedAt, startOfDay),
                lte(tasks.completedAt, endOfDay)
            )
        )
    const tasksDone = doneResult.count

    const totalTasks = tasksDone + tasksPending
    const completionRate = totalTasks > 0 ? (tasksDone / totalTasks) * 100 : 0

    return (
        <HoverEffect variant="lift" className="h-full">
            <Link href="/dashboard/tasks" prefetch={false} className="block h-full">
                <SpotlightCard
                    className="h-full relative overflow-hidden group/card shadow-sm hover:shadow-md transition-all border-0"
                    contentClassName="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 backdrop-blur-xl saturate-150"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0">
                        <CardTitle className="text-base font-semibold">Tasks</CardTitle>
                        <CheckSquare className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold tracking-tighter text-blue-500 dark:text-blue-400">
                            {tasksDone || 0} <span className="text-muted-foreground text-2xl font-normal">/ {totalTasks}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Stay focused and get things done.</p>
                        <Progress value={completionRate} className="h-2 mt-4 bg-blue-100 dark:bg-blue-900/30" />
                    </CardContent>
                </SpotlightCard>
            </Link>
        </HoverEffect>
    )
}
