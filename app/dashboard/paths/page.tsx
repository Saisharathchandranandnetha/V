
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LearningPathCard, LearningPathProps } from '@/components/learning-path-card'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { ViewSelector } from './view-selector'
import { DashboardSearch } from '@/components/dashboard-search'
import { PathsAutoRedirect } from './paths-auto-redirect'

export const dynamic = 'force-dynamic'

export default async function LearningPathsPage(props: {
    searchParams: Promise<{ view?: string, q?: string, add?: string }>
}) {
    const searchParams = await props.searchParams
    const view = searchParams.view || 'active'
    const searchQuery = searchParams.q || ''
    const supabase = await createClient()

    let query = supabase.from('learning_paths').select('*')

    if (view === 'completed') {
        query = query.eq('is_completed', true)
    } else {
        query = query.neq('is_completed', true)
    }

    const { data: paths } = await query.order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <PathsAutoRedirect />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Learning Paths</h1>
                    <p className="text-muted-foreground">Follow structured paths to master new skills.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="w-full sm:w-auto">
                        <ViewSelector />
                    </div>
                    <Link href="/dashboard/paths/new" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Path
                        </Button>
                    </Link>
                </div>
            </div>

            <DashboardSearch placeholder="Search learning paths..." />

            {(!paths || paths.length === 0) ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-muted-foreground min-h-[200px]">
                    {view === 'completed'
                        ? "No completed learning paths found."
                        : "No active learning paths found. Create one to get started!"
                    }
                </div>
            ) : (
                <StaggerContainer key={view + searchQuery} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full min-w-0">
                    {paths.filter((p: LearningPathProps) =>
                        !searchQuery ||
                        (p.title?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                    ).map((path: LearningPathProps) => (
                        <StaggerItem key={path.id} className="h-full">
                            <LearningPathCard path={path} />
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            )}
        </div>
    )
}
