import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createRoadmap } from './actions'
import { DashboardSearch } from '@/components/dashboard-search'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { RoadmapsAutoCreate } from './roadmaps-auto-create'

export default async function RoadmapsPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string, add?: string }>
}) {
    const { q: searchQuery } = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: roadmaps } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })

    return (
        <div className="container py-8 max-w-5xl">
            <RoadmapsAutoCreate />
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Roadmaps</h1>
                    <p className="text-muted-foreground mt-1">Manage your learning paths and project plans.</p>
                </div>
                <form action={async () => {
                    'use server'
                    const newMap = await createRoadmap({ title: 'Untitled Roadmap' })
                    // Redirect handled in action or client via hook, but here we can just let Next.js handle it if we redirect there
                    // Actually createRoadmap returns data. Better to use a Client Component for the "Create" button 
                    // to handle redirect, or do redirect in action. 
                    // I will change the action to redirect!
                }}>
                    <CreateButton />
                </form>
            </div>

            <DashboardSearch placeholder="Search roadmaps..." className="mb-8" />

            <StaggerContainer key={searchQuery} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {roadmaps?.filter((r: any) =>
                    !searchQuery ||
                    (r.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                    (r.description && (r.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
                ).map((roadmap: any) => (
                    <StaggerItem key={roadmap.id} className="h-full">
                        <Link href={`/dashboard/roadmaps/${roadmap.id}`}>
                            <SpotlightCard className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                                <CardHeader>
                                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">{roadmap.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">
                                        {roadmap.description || "No description"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Progress</span>
                                            <span>{roadmap.progress}%</span>
                                        </div>
                                        <Progress value={roadmap.progress} className="h-2" />
                                        {roadmap.copied_from_chat && (
                                            <div className="pt-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                    Copied from Chat
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </SpotlightCard>
                        </Link>
                    </StaggerItem>
                ))}
            </StaggerContainer>

            {(!roadmaps || roadmaps.length === 0) && (
                <div className="text-center py-20 border-2 border-dashed rounded-xl">
                    <h3 className="text-lg font-medium">No roadmaps yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first roadmap to get started</p>
                    <form action={async () => {
                        'use server'
                        await createRoadmap({ title: 'My First Roadmap' })
                    }}>
                        <Button>Create Roadmap</Button>
                    </form>
                </div>
            )}
        </div>
    )
}

function CreateButton() {
    return (
        <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Roadmap
        </Button>
    )
}
