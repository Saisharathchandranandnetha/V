import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResourceCard } from '@/components/resource-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch Collection Details
    const { data: collection } = await supabase
        .from('collections')
        .select('name')
        .eq('id', id)
        .single()

    if (!collection) {
        return <div>Collection not found</div>
    }

    // Parallel Fetching
    const [
        { data: resources },
        { data: habits },
        { data: tasks },
        { data: goals },
        { data: notes },
        { data: paths }
    ] = await Promise.all([
        supabase.from('resources').select('*').eq('collection_id', id),
        supabase.from('habits').select('*').eq('collection_id', id),
        supabase.from('tasks').select('*').eq('collection_id', id),
        supabase.from('goals').select('*').eq('collection_id', id),
        supabase.from('notes').select('*').eq('collection_id', id),
        supabase.from('learning_paths').select('*').eq('collection_id', id)
    ])

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/collections">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">{collection.name}</h1>
            </div>

            <Tabs defaultValue="resources" className="w-full">
                <TabsList>
                    <TabsTrigger value="resources">Resources ({resources?.length || 0})</TabsTrigger>
                    <TabsTrigger value="habits">Habits ({habits?.length || 0})</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks ({tasks?.length || 0})</TabsTrigger>
                    <TabsTrigger value="goals">Goals ({goals?.length || 0})</TabsTrigger>
                    <TabsTrigger value="notes">Notes ({notes?.length || 0})</TabsTrigger>
                    <TabsTrigger value="paths">Paths ({paths?.length || 0})</TabsTrigger>
                </TabsList>

                {/* Resources Content */}
                <TabsContent value="resources" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {resources?.map((resource: any) => (
                            <ResourceCard key={resource.id} resource={resource} />
                        ))}
                        {resources?.length === 0 && <p className="text-muted-foreground">No resources in this collection.</p>}
                    </div>
                </TabsContent>

                {/* Habits Content */}
                <TabsContent value="habits" className="mt-6">
                    <div className="grid gap-4">
                        {habits?.map((habit: any) => (
                            <Card key={habit.id}>
                                <CardHeader><CardTitle>{habit.name}</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground">Frequency: {habit.frequency}</p></CardContent>
                            </Card>
                        ))}
                        {habits?.length === 0 && <p className="text-muted-foreground">No habits in this collection.</p>}
                    </div>
                </TabsContent>

                {/* Tasks Content */}
                <TabsContent value="tasks" className="mt-6">
                    <div className="grid gap-4">
                        {tasks?.map((task: any) => (
                            <Card key={task.id}>
                                <CardHeader><CardTitle>{task.title}</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground">Status: {task.status}</p></CardContent>
                            </Card>
                        ))}
                        {tasks?.length === 0 && <p className="text-muted-foreground">No tasks in this collection.</p>}
                    </div>
                </TabsContent>

                {/* Goals Content */}
                <TabsContent value="goals" className="mt-6">
                    <div className="grid gap-4">
                        {goals?.map((goal: any) => (
                            <Card key={goal.id}>
                                <CardHeader><CardTitle>{goal.title}</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground">Target: {goal.target_value} {goal.unit}</p></CardContent>
                            </Card>
                        ))}
                        {goals?.length === 0 && <p className="text-muted-foreground">No goals in this collection.</p>}
                    </div>
                </TabsContent>

                {/* Notes Content */}
                <TabsContent value="notes" className="mt-6">
                    <div className="grid gap-4">
                        {notes?.map((note: any) => (
                            <Card key={note.id}>
                                <CardHeader><CardTitle>{note.title}</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p></CardContent>
                            </Card>
                        ))}
                        {notes?.length === 0 && <p className="text-muted-foreground">No notes in this collection.</p>}
                    </div>
                </TabsContent>

                {/* Learning Paths Content */}
                <TabsContent value="paths" className="mt-6">
                    <div className="grid gap-4">
                        {paths?.map((path: any) => (
                            <Card key={path.id}>
                                <CardHeader><CardTitle>{path.title}</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground">{path.description}</p></CardContent>
                            </Card>
                        ))}
                        {paths?.length === 0 && <p className="text-muted-foreground">No learning paths in this collection.</p>}
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    )
}
