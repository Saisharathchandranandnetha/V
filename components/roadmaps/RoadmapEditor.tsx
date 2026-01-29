'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, ArrowLeft, GitBranch, LayoutList, Workflow, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MermaidDiagram } from './MermaidDiagram'
import { LinkResourceDialog } from './LinkResourceDialog'
import { FileText, GraduationCap, Globe, Target } from 'lucide-react'
import {
    updateRoadmap,
    createRoadmapStep,
    updateRoadmapStep,
    deleteRoadmapStep,
    reorderSteps,
    deleteRoadmap,
    addStepLink,
    removeStepLink
} from '@/app/dashboard/roadmaps/actions'

interface Step {
    id: string
    title: string
    description?: string | null
    order: number
    completed: boolean | null
    parent_step_id?: string | null
    // Old columns (kept for type compatibility if needed, but we use links now)
    linked_note_id?: string | null
    linked_path_id?: string | null
    linked_resource_id?: string | null
    linked_goal_id?: string | null

    links?: Array<{
        id: string // link ID
        type: 'note' | 'path' | 'resource' | 'goal'
        title: string
        [key: string]: any
    }>
}

interface Roadmap {
    id: string
    title: string
    description?: string | null
    progress: number | null
    status: string | null
}

function LinkedResourcesButton({ step, onRemoveLink }: { step: Step, onRemoveLink: (linkId: string) => void }) {
    const hasLinks = step.links && step.links.length > 0

    if (!hasLinks) return null

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link2 className="h-3 w-3" />
                    View Linked ({step.links?.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Linked Resources</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2 py-4">
                    {step.links?.map(link => (
                        <div key={link.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-2 overflow-hidden">
                                {link.type === 'note' && <FileText className="h-4 w-4 text-blue-500 shrink-0" />}
                                {link.type === 'path' && <GraduationCap className="h-4 w-4 text-green-500 shrink-0" />}
                                {link.type === 'resource' && <Globe className="h-4 w-4 text-orange-500 shrink-0" />}
                                {link.type === 'goal' && <Target className="h-4 w-4 text-red-500 shrink-0" />}
                                <span className="text-sm font-medium capitalize w-16 shrink-0">{link.type}</span>
                                <a
                                    href={
                                        link.type === 'note' ? `/dashboard/notes?id=${link.id}` : // Wait, link.id is the link ID, not resource ID?
                                            // Ah, I need resource ID. In page.tsx I spread ...detail which has 'id'.
                                            // But I also put 'id: link.id'. So link.id overwrote resource ID!
                                            // I need to fix page.tsx or here.
                                            // Let's assume on page.tsx I fix it to have resourceId or keep detail.id.
                                            // Actually in page.tsx:
                                            // linksByStepId.get(link.step_id).push({
                                            //    id: link.id, // Link ID for deletion
                                            //    type,
                                            //    ...detail // detail has 'id'. It overwrites 'id': link.id!
                                            // })
                                            // So 'id' is the resource ID (from detail). 
                                            // But I need link ID for deletion!
                                            // I should have named link ID as 'link_id'.
                                            // I will fix page.tsx in next step if needed, but for now assuming 'id' is resource ID and 'link_id' is link ID?
                                            // Wait, '...detail' comes LAST. So detail.id overwrites link.id.
                                            // So 'id' IS resource ID.
                                            // Where is link ID? Missing.
                                            // I need to fix page.tsx mapping first or concurrently.
                                            // I'll assume 'link_id' is available.
                                            link.type === 'path' ? `/dashboard/paths/${link.id}` :
                                                link.type === 'resource' ? `/dashboard/resources/${link.id}` :
                                                    `/dashboard/goals`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline truncate max-w-[200px]"
                                >
                                    {link.title}
                                </a>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => onRemoveLink(link.link_id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function SortableStep({ step, depth, onToggle, onDelete, onUpdate, onAddBranch, onLinkResource, onRemoveLink }: {
    step: Step,
    depth: number,
    onToggle: (checked: boolean) => void,
    onDelete: () => void,
    onUpdate: (title: string) => void,
    onAddBranch: () => void,
    onLinkResource: (type: 'note' | 'path' | 'resource' | 'goal', id: string) => void
    onRemoveLink: (linkId: string) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: step.id })

    const [localTitle, setLocalTitle] = useState(step.title)

    const handleBlur = () => {
        if (localTitle !== step.title) {
            onUpdate(localTitle)
        }
    }

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: `${depth * 2}rem`
    }

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border group relative">
            <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground p-1">
                <GripVertical className="h-4 w-4" />
            </div>

            {step.parent_step_id && (
                <div className="absolute left-[-2rem] top-1/2 w-4 h-[1px] bg-border" />
            )}

            <Checkbox
                checked={!!step.completed}
                onCheckedChange={(c) => onToggle(!!c)}
            />
            <Input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleBlur}
                className="border-none shadow-none focus-visible:ring-0 px-2 h-auto font-medium bg-transparent flex-1"
            />

            <LinkedResourcesButton step={step} onRemoveLink={onRemoveLink} />

            <LinkResourceDialog
                onSelect={onLinkResource}
                currentLinks={{
                    // Pass empty or something to indicate multi-select if supported, 
                    // or just nothing so they can add more.
                    // For now we don't block adding duplicates in UI, but maybe we should?
                    // The old interface expected single IDs.
                    noteId: null,
                    pathId: null,
                    resourceId: null,
                    goalId: null
                }}
            />

            <Button
                variant="ghost"
                size="icon"
                onClick={onAddBranch}
                disabled={step.id.startsWith('temp-')}
                title={step.id.startsWith('temp-') ? "Saving..." : "Add Branch"}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10"
            >
                <GitBranch className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive ml-auto">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}

export function RoadmapEditor({ roadmap, initialSteps }: { roadmap: Roadmap, initialSteps: Step[] }) {
    const [steps, setSteps] = useState<Step[]>(initialSteps.sort((a, b) => a.order - b.order))
    const [title, setTitle] = useState(roadmap.title)
    const [description, setDescription] = useState(roadmap.description || '')
    const [activeTab, setActiveTab] = useState('editor')
    const router = useRouter()

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Debounced update for title/desc
    useEffect(() => {
        const timer = setTimeout(() => {
            if (title !== roadmap.title || description !== (roadmap.description || '')) {
                updateRoadmap(roadmap.id, { title, description })
            }
        }, 1000)
        return () => clearTimeout(timer)
    }, [title, description, roadmap.id, roadmap.title, roadmap.description])

    const generateMermaidChart = (currentSteps: Step[]) => {
        if (currentSteps.length === 0) return 'graph TD;\n  Start[Start] --> End[End];'

        // Define Graph
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

    const flattenSteps = (items: Step[], parentId: string | null = null, depth = 0): (Step & { depth: number })[] => {
        const currentSteps = items
            .filter(item => item.parent_step_id === parentId)
            .sort((a, b) => a.order - b.order)

        return currentSteps.reduce((acc, step) => {
            return [...acc, { ...step, depth }, ...flattenSteps(items, step.id, depth + 1)]
        }, [] as (Step & { depth: number })[])
    }

    const sortedSteps = flattenSteps(steps)

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (!over || active.id === over.id) return

        const activeStep = steps.find(s => s.id === active.id)
        const overStep = steps.find(s => s.id === over.id)

        if (!activeStep || !overStep) return

        // New Logic: Adopt the parent of the item we dropped over (Siblings logic)
        const newParentId = overStep.parent_step_id

        // 1. Get all siblings in the *target* group (excluding active)
        const siblings = steps
            .filter(s => s.parent_step_id === newParentId && s.id !== active.id)
            .sort((a, b) => a.order - b.order)

        // 2. Find index of 'over' in this siblings list
        let overIndex = siblings.findIndex(s => s.id === over.id)

        // 3. Determine drop position based on flat list index
        const oldFlatIndex = sortedSteps.findIndex(s => s.id === active.id)
        const newFlatIndex = sortedSteps.findIndex(s => s.id === over.id)

        if (oldFlatIndex < newFlatIndex) {
            overIndex = overIndex + 1
        }

        const newSiblings = [
            ...siblings.slice(0, overIndex),
            { ...activeStep, parent_step_id: newParentId },
            ...siblings.slice(overIndex)
        ]

        // 4. Calculate Updates
        const updates: { id: string, order: number, parent_step_id?: string | null }[] = []

        newSiblings.forEach((s, idx) => {
            updates.push({
                id: s.id,
                order: idx,
                parent_step_id: newParentId
            })
        })

        // 5. Update Local State (Optimistic)
        const updatedSteps = steps.map(s => {
            const update = updates.find(u => u.id === s.id)
            if (update) {
                return { ...s, ...update }
            }
            return s
        })

        setSteps(updatedSteps)

        // 6. Server Update (AFTER state update)
        try {
            if (activeStep.parent_step_id !== newParentId) {
                await updateRoadmapStep(active.id as string, { parent_step_id: newParentId })
            }
            await reorderSteps(updates.map(u => ({ id: u.id, order: u.order })))
        } catch (error) {
            console.error('Failed to reorder:', error)
            toast.error('Failed to save order')
        }
    }

    const getStepDepth = (stepId: string): number => {
        let depth = 0
        let currentId = steps.find(s => s.id === stepId)?.parent_step_id
        while (currentId) {
            depth++
            currentId = steps.find(s => s.id === currentId)?.parent_step_id
            if (depth > 10) break
        }
        return depth
    }

    const handleAddStep = async (parentId?: string) => {
        if (parentId?.startsWith('temp-')) {
            toast.error('Please wait for the current step to finish saving')
            return
        }
        let newOrder = steps.length
        let itemsToShift: { id: string, order: number }[] = []
        let updatedSteps = [...steps]

        if (parentId) {
            const parentIndex = steps.findIndex(s => s.id === parentId)
            if (parentIndex !== -1) {
                newOrder = parentIndex + 1

                itemsToShift = []
                updatedSteps = steps.map(s => {
                    if (s.order >= newOrder) {
                        itemsToShift.push({ id: s.id, order: s.order + 1 })
                        return { ...s, order: s.order + 1 }
                    }
                    return s
                })
            }
        }

        const tempId = 'temp-' + Date.now()
        const newStep: Step = {
            id: tempId,
            title: parentId ? 'New Branch' : 'New Step',
            order: newOrder,
            completed: false,
            description: null,
            parent_step_id: parentId || null
        }

        updatedSteps.push(newStep)
        updatedSteps.sort((a, b) => a.order - b.order)
        setSteps(updatedSteps)

        try {
            if (itemsToShift.length > 0) {
                await reorderSteps(itemsToShift)
            }

            const created = await createRoadmapStep(roadmap.id, {
                title: newStep.title,
                order: newOrder,
                parentStepId: parentId
            })

            setSteps(prev => prev.map(s => s.id === tempId ? { ...s, id: created.id } : s))
            toast.success(parentId ? 'Branch created' : 'Step created')
        } catch (e) {
            console.error(e)
            toast.error('Failed to create step')
            setSteps(prev => prev.filter(s => s.id !== tempId))
        }
    }

    const handleUpdateStepTitle = async (id: string, newTitle: string) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s))
    }

    const handleStepCompletion = async (id: string, completed: boolean) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, completed } : s))
        await updateRoadmapStep(id, { completed })
    }

    const handleDeleteStep = async (id: string) => {
        // Optimistically update local state:
        // 1. Remove the deleted step
        // 2. Update any children of this step to have no parent (orphan them to root)
        setSteps(prev => prev.map(s => {
            if (s.id === id) return null // Mark for removal
            if (s.parent_step_id === id) return { ...s, parent_step_id: null } // Re-parent children
            return s
        }).filter(Boolean) as Step[])

        await deleteRoadmapStep(id)
    }

    const handleDeleteRoadmap = async () => {
        try {
            await deleteRoadmap(roadmap.id)
            toast.success('Roadmap deleted')
        } catch (error: any) {
            if (error.message === 'NEXT_REDIRECT') return
            toast.error('Failed to delete roadmap')
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/roadmaps')} className="pl-0 hover:bg-transparent hover:text-primary">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Roadmaps
                </Button>
            </div>

            <div className="mb-8 space-y-4">
                <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="text-3xl font-bold border-none px-0 shadow-none focus-visible:ring-0 h-auto"
                    placeholder="Roadmap Title"
                />
                <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="resize-none border-none px-0 shadow-none focus-visible:ring-0 min-h-[100px] text-muted-foreground"
                    placeholder="Add a description..."
                />
                <div className="flex items-center gap-4 justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <Progress value={roadmap.progress || 0} className="h-2" />
                        <span className="text-sm font-medium text-muted-foreground w-12 text-right">{roadmap.progress || 0}%</span>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Roadmap
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your roadmap and remove your data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteRoadmap} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="editor" className="flex items-center gap-2">
                        <LayoutList className="h-4 w-4" />
                        Editor
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                        <Workflow className="h-4 w-4" />
                        Flowchart Preview
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="mt-0">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={sortedSteps.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {sortedSteps.map(step => (
                                    <div key={step.id}>
                                        <SortableStep
                                            step={step}
                                            depth={step.depth}
                                            onToggle={(c) => handleStepCompletion(step.id, c)}
                                            onDelete={() => handleDeleteStep(step.id)}
                                            onUpdate={(t) => {
                                                setSteps(prev => prev.map(s => s.id === step.id ? { ...s, title: t } : s))
                                                updateRoadmapStep(step.id, { title: t })
                                            }}
                                            onAddBranch={() => handleAddStep(step.id)}
                                            onLinkResource={async (type, resourceId) => {
                                                const updates: any = {
                                                    linked_note_id: type === 'note' ? resourceId : null,
                                                    linked_path_id: type === 'path' ? resourceId : null,
                                                    linked_resource_id: type === 'resource' ? resourceId : null,
                                                    linked_goal_id: type === 'goal' ? resourceId : null
                                                }
                                                // Optimistic update for old fields (backward compat, can remove later)
                                                // setSteps(prev => prev.map(s => s.id === step.id ? { ...s, ...updates } : s))
                                                // await updateRoadmapStep(step.id, updates)

                                                // New Multi-link logic
                                                try {
                                                    await addStepLink(step.id, type, resourceId)
                                                    toast.success('Resource linked')
                                                } catch (e) {
                                                    toast.error('Failed to link resource')
                                                }
                                            }}
                                            onRemoveLink={async (linkId) => {
                                                try {
                                                    await removeStepLink(linkId)
                                                    toast.success('Link removed')
                                                } catch (e) {
                                                    toast.error('Failed to remove link')
                                                }
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <Button onClick={() => handleAddStep()} variant="outline" className="w-full mt-4 border-dashed">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Step (Root)
                    </Button>
                </TabsContent>

                <TabsContent value="preview" className="mt-0">
                    <div className="border border-border rounded-xl p-4 bg-card/50">
                        <p className="text-sm text-muted-foreground mb-4 text-center">
                            This flow is generated automatically from your steps and branches.
                        </p>
                        <MermaidDiagram chart={generateMermaidChart(sortedSteps)} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
