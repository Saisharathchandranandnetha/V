'use client'

import { Check, Copy, User, ArrowLeft, LayoutList, Workflow, FileText, GraduationCap, Globe, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { copyRoadmapFromShare } from '@/app/dashboard/roadmaps/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MermaidDiagram } from './MermaidDiagram'
import Link from 'next/link'

interface Step {
    id: string
    title: string
    description?: string | null
    order: number
    completed: boolean | null
    parent_step_id?: string | null
    linked_note_id?: string | null
    linked_path_id?: string | null
    linked_resource_id?: string | null
}

interface Roadmap {
    id: string
    title: string
    description?: string | null
    progress: number | null
    owner_id: string
    created_at: string
    owner?: {
        name: string | null
        avatar: string | null
    }
}

export function RoadmapView({ roadmap, steps, currentUserId }: { roadmap: Roadmap, steps: Step[], currentUserId: string }) {
    const router = useRouter()

    const handleCopy = async () => {
        const toastId = toast.loading('Adding to your roadmaps...')
        try {
            const newRoadmap = await copyRoadmapFromShare(roadmap.id)
            toast.success('Roadmap added to your personal collection!', { id: toastId })
            router.push(`/dashboard/roadmaps/${newRoadmap.id}`)
        } catch (e: any) {
            toast.error(e.message || 'Failed to copy roadmap', { id: toastId })
        }
    }

    const generateMermaidChart = (currentSteps: Step[]) => {
        if (currentSteps.length === 0) return 'graph TD;\n  Start[Start] --> End[End];'

        let chart = 'graph TD;\n'
        chart += '  classDef default fill:#1f2937,stroke:#374151,color:#f3f4f6,rx:5,ry:5;\n'
        chart += '  classDef completed fill:#059669,stroke:#047857,color:#ffffff;\n'

        currentSteps.forEach(step => {
            const label = step.title.replace(/["\n]/g, '') || 'Untitled'
            const style = step.completed ? ':::completed' : ''
            const nodeId = `step${step.id.replace(/-/g, '')}`

            // Node
            chart += `  ${nodeId}["${label}"]${style};\n`

            // Edge from Parent
            if (step.parent_step_id) {
                const parentNodeId = `step${step.parent_step_id.replace(/-/g, '')}`
                chart += `  ${parentNodeId} --> ${nodeId};\n`
            }
        })
        return chart
    }

    const isOwner = currentUserId === roadmap.owner_id

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/roadmaps')} className="pl-0 hover:bg-transparent hover:text-primary">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Roadmaps
                </Button>
            </div>

            <div className="mb-8 space-y-4">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{roadmap.title}</h1>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <span>Shared by</span>
                            <div className="flex items-center gap-1">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={roadmap.owner?.avatar || ''} />
                                    <AvatarFallback>{roadmap.owner?.name?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">{roadmap.owner?.name || 'Unknown'}</span>
                            </div>
                            <span>•</span>
                            <span>{new Date(roadmap.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    {!isOwner && (
                        <Button onClick={handleCopy}>
                            <Copy className="h-4 w-4 mr-2" />
                            Add to My Roadmaps
                        </Button>
                    )}
                    {isOwner && (
                        <Button variant="outline" onClick={() => router.push(`/dashboard/roadmaps/${roadmap.id}`)}>
                            Edit Roadmap
                        </Button>
                    )}
                </div>

                {roadmap.description && (
                    <p className="text-muted-foreground">{roadmap.description}</p>
                )}

                <div className="flex items-center gap-4">
                    <Progress value={roadmap.progress || 0} className="h-2" />
                    <span className="text-sm font-medium text-muted-foreground w-12 text-right">{roadmap.progress || 0}%</span>
                </div>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="list" className="flex items-center gap-2">
                        <LayoutList className="h-4 w-4" />
                        List View
                    </TabsTrigger>
                    <TabsTrigger value="flowchart" className="flex items-center gap-2">
                        <Workflow className="h-4 w-4" />
                        Flowchart View
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="mt-0 space-y-3">
                    {(() => {
                        const getStepDepth = (stepId: string, stepsList: Step[]): number => {
                            let depth = 0
                            let currentId = stepsList.find(s => s.id === stepId)?.parent_step_id
                            while (currentId) {
                                depth++
                                currentId = stepsList.find(s => s.id === currentId)?.parent_step_id
                                if (depth > 10) break
                            }
                            return depth
                        }

                        return steps
                            .sort((a, b) => a.order - b.order)
                            .map((step, index) => {
                                const depth = getStepDepth(step.id, steps)
                                return (
                                    <div key={step.id} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card/50" style={{ marginLeft: `${depth * 2}rem` }}>
                                        <div className={cn(
                                            "flex items-center justify-center h-6 w-6 rounded-full border border-border mt-0.5 min-d-6",
                                            step.completed ? "bg-primary border-primary text-primary-foreground" : "bg-muted"
                                        )}>
                                            {step.completed ? <Check className="h-3 w-3" /> : <span className="text-xs">{index + 1}</span>}
                                        </div>
                                        <div>
                                            <h3 className={cn("font-medium", step.completed && "text-muted-foreground line-through")}>
                                                {step.title}
                                            </h3>
                                            {step.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                                            )}

                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {step.linked_note_id && (
                                                    <Link href={`/dashboard/notes?id=${step.linked_note_id}`}>
                                                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 px-2">
                                                            <FileText className="h-3 w-3" />
                                                            Note
                                                            <ExternalLink className="h-2 w-2 opacity-50" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                {step.linked_path_id && (
                                                    <Link href={`/dashboard/paths/${step.linked_path_id}`}>
                                                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 px-2">
                                                            <GraduationCap className="h-3 w-3" />
                                                            Path
                                                            <ExternalLink className="h-2 w-2 opacity-50" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                {step.linked_resource_id && (
                                                    <Link href={`/dashboard/resources/${step.linked_resource_id}`}>
                                                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 px-2">
                                                            <Globe className="h-3 w-3" />
                                                            Resource
                                                            <ExternalLink className="h-2 w-2 opacity-50" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                    })()}
                </TabsContent>

                <TabsContent value="flowchart" className="mt-0">
                    <div className="border border-border rounded-xl p-4 bg-card/50">
                        <MermaidDiagram chart={generateMermaidChart(steps)} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
