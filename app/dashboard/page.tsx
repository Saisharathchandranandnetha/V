import { Suspense } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { DateTimeDisplay } from '@/components/date-time-display'
import { MagneticText } from '@/components/ui/magnetic-text'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { HabitStats } from '@/components/dashboard/habit-stats'
import { TaskStats } from '@/components/dashboard/task-stats'
import { GoalStats } from '@/components/dashboard/goal-stats'
import { FinanceStats } from '@/components/dashboard/finance-stats'
import { ResourceStats } from '@/components/dashboard/resource-stats'
import { QuickLinks } from '@/components/dashboard/quick-links'
import { Skeleton } from '@/components/ui/skeleton'

// Inline Skeletons for simplicity if they weren't copied
function StatsSkeleton() {
    return (
        <div className="h-40 rounded-xl bg-card/50 backdrop-blur-sm border p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-full mt-4" />
            </div>
        </div>
    )
}

function QuickLinksSkeleton() {
    return (
        <div className="space-y-2 mt-8">
            <Skeleton className="h-7 w-32" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Skeleton className="col-span-2 h-32 rounded-xl" />
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="col-span-1 h-32 rounded-xl" />
                ))}
            </div>
        </div>
    )
}

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/login')
    }
    const userId = session.user.id

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <MagneticText>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    </MagneticText>
                    <p className="text-muted-foreground">Overview of your productivity & finances.</p>
                </div>
                <DateTimeDisplay />
            </div>

            {/* Main Stats Bento Grid */}
            <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" delay={0.1}>
                {/* Daily Habits - Large Feature Card */}
                <StaggerItem className="lg:col-span-2">
                    <Suspense fallback={<StatsSkeleton />}>
                        <HabitStats userId={userId} />
                    </Suspense>
                </StaggerItem>

                <StaggerItem className="lg:col-span-2">
                    <Suspense fallback={<StatsSkeleton />}>
                        <TaskStats userId={userId} />
                    </Suspense>
                </StaggerItem>

                <StaggerItem>
                    <Suspense fallback={<StatsSkeleton />}>
                        <GoalStats userId={userId} />
                    </Suspense>
                </StaggerItem>

                <StaggerItem className="lg:col-span-2 md:col-span-2">
                    <Suspense fallback={<StatsSkeleton />}>
                        <FinanceStats userId={userId} />
                    </Suspense>
                </StaggerItem>

                <StaggerItem className="lg:col-span-2">
                    <Suspense fallback={<div className="grid grid-cols-2 gap-4 h-full"><StatsSkeleton /><StatsSkeleton /></div>}>
                        <ResourceStats userId={userId} />
                    </Suspense>
                </StaggerItem>
            </StaggerContainer>

            {/* Quick Links Bento - Asymmetrical */}
            <Suspense fallback={<QuickLinksSkeleton />}>
                <QuickLinks userId={userId} />
            </Suspense>
        </div>
    )
}