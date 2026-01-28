'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link2, Search, FileText, GraduationCap, Globe, Check, Target } from 'lucide-react'
import { getLinkableItems } from '@/app/dashboard/roadmaps/resource-actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface LinkableItem {
    id: string
    title: string
    type?: string
}

interface LinkResourceDialogProps {
    onSelect: (type: 'note' | 'path' | 'resource' | 'goal', id: string, title: string) => void
    currentLinks?: {
        noteId?: string | null
        pathId?: string | null
        resourceId?: string | null
        goalId?: string | null
    }
}

export function LinkResourceDialog({ onSelect, currentLinks }: LinkResourceDialogProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<{
        notes: LinkableItem[]
        paths: LinkableItem[]

        resources: LinkableItem[]
        goals: LinkableItem[]
    }>({ notes: [], paths: [], resources: [], goals: [] })

    useEffect(() => {
        if (open) {
            setLoading(true)
            getLinkableItems().then(res => {
                setItems(res)
                setLoading(false)
            })
        }
    }, [open])

    const filterItems = (list: LinkableItem[]) =>
        list.filter(item => item.title.toLowerCase().includes(search.toLowerCase()))

    const handleSelect = (type: 'note' | 'path' | 'resource' | 'goal', id: string, title: string) => {
        onSelect(type, id, title)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Link Resource" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Link Resource to Step</DialogTitle>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notes, paths, or resources..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Tabs defaultValue="notes" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                        <TabsTrigger value="paths">Paths</TabsTrigger>
                        <TabsTrigger value="resources">Resources</TabsTrigger>
                        <TabsTrigger value="goals">Goals</TabsTrigger>
                    </TabsList>

                    <TabsContent value="notes" className="mt-4">
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-1 pr-4">
                                {filterItems(items.notes).length === 0 ? (
                                    <p className="text-sm text-center text-muted-foreground py-8">No notes found.</p>
                                ) : (
                                    filterItems(items.notes).map(note => (
                                        <button
                                            key={note.id}
                                            onClick={() => handleSelect('note', note.id, note.title)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left group",
                                                currentLinks?.noteId === note.id && "bg-primary/10 text-primary"
                                            )}
                                        >
                                            <FileText className="h-4 w-4 shrink-0" />
                                            <span className="flex-1 truncate text-sm">{note.title}</span>
                                            {currentLinks?.noteId === note.id && <Check className="h-4 w-4" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="paths" className="mt-4">
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-1 pr-4">
                                {filterItems(items.paths).length === 0 ? (
                                    <p className="text-sm text-center text-muted-foreground py-8">No learning paths found.</p>
                                ) : (
                                    filterItems(items.paths).map(path => (
                                        <button
                                            key={path.id}
                                            onClick={() => handleSelect('path', path.id, path.title)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left group",
                                                currentLinks?.pathId === path.id && "bg-primary/10 text-primary"
                                            )}
                                        >
                                            <GraduationCap className="h-4 w-4 shrink-0" />
                                            <span className="flex-1 truncate text-sm">{path.title}</span>
                                            {currentLinks?.pathId === path.id && <Check className="h-4 w-4" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="resources" className="mt-4">
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-1 pr-4">
                                {filterItems(items.resources).length === 0 ? (
                                    <p className="text-sm text-center text-muted-foreground py-8">No resources found.</p>
                                ) : (
                                    filterItems(items.resources).map(res => (
                                        <button
                                            key={res.id}
                                            onClick={() => handleSelect('resource', res.id, res.title)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left group",
                                                currentLinks?.resourceId === res.id && "bg-primary/10 text-primary"
                                            )}
                                        >
                                            <Globe className="h-4 w-4 shrink-0" />
                                            <span className="flex-1 truncate text-sm">{res.title}</span>
                                            {currentLinks?.resourceId === res.id && <Check className="h-4 w-4" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>


                    <TabsContent value="goals" className="mt-4">
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-1 pr-4">
                                {filterItems(items.goals).length === 0 ? (
                                    <p className="text-sm text-center text-muted-foreground py-8">No goals found.</p>
                                ) : (
                                    filterItems(items.goals).map(goal => (
                                        <button
                                            key={goal.id}
                                            onClick={() => handleSelect('goal', goal.id, goal.title)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left group",
                                                currentLinks?.goalId === goal.id && "bg-primary/10 text-primary"
                                            )}
                                        >
                                            <Target className="h-4 w-4 shrink-0" />
                                            <span className="flex-1 truncate text-sm">{goal.title}</span>
                                            {currentLinks?.goalId === goal.id && <Check className="h-4 w-4" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
