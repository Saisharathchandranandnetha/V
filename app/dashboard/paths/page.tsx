import { auth } from '@/auth'
import { db } from '@/lib/db'
import { learningPaths } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { LearningPathCard, LearningPathProps } from '@/components/learning-path-card'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { ViewSelector } from './view-selector'
import { DashboardSearch } from '@/components/dashboard-search'
import { PathsAutoRedirect } from './paths-auto-redirect'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LearningPathsPage(props: {
    searchParams: Promise<{ view?: string, q?: string, add?: string }>
}) {
    const searchParams = await props.searchParams
    const view = searchParams.view || 'active'
    const searchQuery = searchParams.q || ''

    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const paths = await db.select().from(learningPaths).where(eq(learningPaths.userId, session.user.id))

    // Filter client-side by view (is_completed column not in schema — show all)
    const filteredPaths = paths.filter((p: any) =>
        !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <PathsAutoRedirect />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Learning Paths</h1>
                    <p className="text-muted-foreground">Follow structured paths to master new skills.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="w-full sm:w-auto"><ViewSelector /></div>
                    <Link href="/dashboard/paths/new" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Add Path</Button>
                    </Link>
                </div>
            </div>
            <DashboardSearch placeholder="Search learning paths..." />
            {filteredPaths.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-muted-foreground min-h-[200px]">
                    {view === 'completed' ? "No completed learning paths found." : "No active learning paths found. Create one to get started!"}
                </div>
            ) : (
                <StaggerContainer key={view + searchQuery} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full min-w-0">
                    {filteredPaths.map((path: any) => (
                        <StaggerItem key={path.id} className="h-full">
                            <LearningPathCard path={path as any} />
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            )}
        </div>
    )
}
