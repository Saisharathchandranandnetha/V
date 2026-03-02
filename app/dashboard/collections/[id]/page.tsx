import { db } from '@/lib/db'
import { collections, resources, habits, tasks, goals, notes, learningPaths } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResourceCard } from '@/components/resource-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default async function CollectionDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    // Fetch Collection Details
    const [collection] = await db.select({ name: collections.name })
        .from(collections)
        .where(eq(collections.id, params.id))
        .limit(1)

    if (!collection) {
        return <div>Collection not found</div>
    }

    // Parallel Fetching
    const [
        resourcesData,
        habitsData,
        tasksData,
        goalsData,
        notesData,
        pathsData
    ] = await Promise.all([
        db.select().from(resources).where(eq(resources.collectionId, params.id)),
        db.select().from(habits).where(eq(habits.collectionId, params.id)),
        db.select().from(tasks).where(eq(tasks.collectionId, params.id)),
        db.select().from(goals).where(eq(goals.collectionId, params.id)),
        db.select().from(notes).where(eq(notes.collectionId, params.id)),
        db.select().from(learningPaths).where(eq(learningPaths.collectionId, params.id))
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
                    <TabsTrigger value="resources">Resources ({resourcesData?.length || 0})</TabsTrigger>
                    <TabsTrigger value="habits">Habits ({habitsData?.length || 0})</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks ({tasksData?.length || 0})</TabsTrigger>
                    <TabsTrigger value="goals">Goals ({goalsData?.length || 0})</TabsTrigger>
                    <TabsTrigger value="notes">Notes ({notesData?.length || 0})</TabsTrigger>
                    <TabsTrigger value="paths">Paths ({pathsData?.length || 0})</TabsTrigger>
                </TabsList>

                {/* Resources Content */}
                <TabsContent value="resources" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {resourcesData?.map((resource: any) => (
                            <ResourceCard key={resource.id} resource={resource} />
                        ))}
                        {resourcesData?.length === 0 && <p className="text-muted-foreground">No resources in this collection.</p>}
                    </div>
                </TabsContent>

                {/* Habits Content */}
                <TabsContent value="habits" className="mt-6">
                    <div className="grid gap-4">
                        {habitsData?.map((habit: any) => (
                            <Card key={habit.id}>
                                <CardHeader><CardTitle>{habit.name}</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground">Frequency: {habit.frequency}</p></CardContent>
                            </Card>
                        ))}
                        {habitsData?.length === 0 && <p className="text-muted-foreground">No habits in this collection.</p>}
                    </div>
                </TabsContent>

                {/* Tasks Content */}
                <TabsContent value="tasks" className="mt-6">
                    <div className="grid gap-4">
                        {tasksData?.map((task: any) => (
                            <Card key={task.id}>
                                <CardHeader><CardTitle>{task.title}</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground">Status: {task.status}</p></CardContent>
                            </Card>
                        ))}
                        {tasksData?.length === 0 && <p className="text-muted-foreground">No tasks in this collection.</p>}
                    </div>
                </TabsContent>

                {/* Goals Content */}
                <TabsContent value="goals" className="mt-6">
                    <div className="grid gap-4">
                        {goalsData?.map((goal: any) => (
                            <Card key={goal.id}>
                                <CardHeader><CardTitle>{goal.title}</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground">Target: {goal.targetValue} {goal.unit}</p></CardContent>
                            </Card>
                        ))}
                        {goalsData?.length === 0 && <p className="text-muted-foreground">No goals in this collection.</p>}
                    </div>
                </TabsContent>

                {/* Notes Content */}
                <TabsContent value="notes" className="mt-6">
                    <div className="grid gap-4">
                        {notesData?.map((note: any) => (
                            <Card key={note.id}>
                                <CardHeader><CardTitle>{note.title}</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p></CardContent>
                            </Card>
                        ))}
                        {notesData?.length === 0 && <p className="text-muted-foreground">No notes in this collection.</p>}
                    </div>
                </TabsContent>

                {/* Learning Paths Content */}
                <TabsContent value="paths" className="mt-6">
                    <div className="grid gap-4">
                        {pathsData?.map((path: any) => (
                            <Card key={path.id}>
                                <CardHeader><CardTitle>{path.title}</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground">{path.description}</p></CardContent>
                            </Card>
                        ))}
                        {pathsData?.length === 0 && <p className="text-muted-foreground">No learning paths in this collection.</p>}
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    )
}
