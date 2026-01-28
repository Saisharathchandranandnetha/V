'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, BookOpen, StickyNote, ArrowDownToLine, Check, ExternalLink, Map as MapIcon } from 'lucide-react'
import { addToMyAccount } from '@/app/dashboard/chat/shared-actions'
import { toast } from 'sonner'
import Link from 'next/link'

interface SharedItem {
    id: string
    shared_type: 'resource' | 'note' | 'learning_path' | 'roadmap'
    created_at: string
    shared_by_user: {
        name: string
        avatar: string
    }
    // Content details joined
    details: {
        title: string
        summary?: string
        url?: string
        description?: string
        content?: string
    }
    original_item_id: string
    // Check if current user already has it
    is_added: boolean
}

interface SharedItemsListProps {
    items: SharedItem[]
    teamId: string
}

export function SharedItemsList({ items: initialItems, teamId }: SharedItemsListProps) {
    const [items, setItems] = useState(initialItems)
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set())

    const handleAdd = async (itemId: string) => {
        setAddingIds(prev => new Set(prev).add(itemId))
        try {
            await addToMyAccount(itemId)
            toast.success('Added to your account')
            setItems(prev => prev.map(item => item.id === itemId ? { ...item, is_added: true } : item))
        } catch (error: any) {
            toast.error(error.message || 'Failed to add item')
        } finally {
            setAddingIds(prev => {
                const next = new Set(prev)
                next.delete(itemId)
                return next
            })
        }
    }

    const renderCard = (item: SharedItem) => {
        const Icon = item.shared_type === 'resource' ? FileText :
            item.shared_type === 'learning_path' ? BookOpen :
                item.shared_type === 'roadmap' ? MapIcon : StickyNote

        return (
            <Card key={item.id} className="overflow-hidden">
                <CardHeader className="p-4 bg-muted/30 pb-2">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base line-clamp-1">{item.details.title}</CardTitle>
                                <CardDescription className="text-xs">
                                    Shared by {item.shared_by_user.name} • {new Date(item.created_at).toLocaleDateString()}
                                </CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="capitalize text-[10px] h-5 px-1.5">
                            {item.shared_type.replace('_', ' ')}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 text-sm text-muted-foreground">
                    <p className="line-clamp-2">
                        {item.details.summary || item.details.description || (item.details.content ? item.details.content.slice(0, 100) : 'No description')}
                    </p>
                    {item.details.url && (
                        <a href={item.details.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline mt-2 text-xs">
                            <ExternalLink className="h-3 w-3" />
                            {item.details.url}
                        </a>
                    )}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                    {/* View Button - For now just a placeholder or could open a modal */}
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleView(item)}>
                        {/* TODO: Add proper view link/modal */}
                        <span className={item.shared_type === 'roadmap' ? '' : 'cursor-not-allowed opacity-50'}>
                            {item.shared_type === 'roadmap' ? 'Open' : 'Preview'}
                        </span>
                    </Button>

                    <Button
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleAdd(item.id)}
                        disabled={item.is_added || addingIds.has(item.id)}
                        variant={item.is_added ? "secondary" : "default"}
                    >
                        {item.is_added ? (
                            <>
                                <Check className="h-3 w-3 mr-1" />
                                Added
                            </>
                        ) : (
                            <>
                                <ArrowDownToLine className="h-3 w-3 mr-1" />
                                {addingIds.has(item.id) ? 'Adding...' : 'Add to My Account'}
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    const handleView = (item: SharedItem) => {
        if (item.shared_type === 'roadmap') {
            window.location.href = `/dashboard/roadmaps/${item.id}`
        }
    }

    const filterItems = (type: string) => {
        if (type === 'all') return items
        return items.filter(item => item.shared_type === type)
    }

    return (
        <Tabs defaultValue="all" className="w-full h-full flex flex-col">
            <div className="px-6 border-b border-border flex items-center justify-between bg-card">
                <TabsList className="h-12 bg-transparent p-0 gap-4">
                    <TabsTrigger value="all" className="data-[state=active]:bg-primary/10 h-8 rounded-full px-4 text-xs">All</TabsTrigger>
                    <TabsTrigger value="resource" className="data-[state=active]:bg-primary/10 h-8 rounded-full px-4 text-xs">Resources</TabsTrigger>
                    <TabsTrigger value="learning_path" className="data-[state=active]:bg-primary/10 h-8 rounded-full px-4 text-xs">Learning Paths</TabsTrigger>
                    <TabsTrigger value="note" className="data-[state=active]:bg-primary/10 h-8 rounded-full px-4 text-xs">Notes</TabsTrigger>
                    <TabsTrigger value="roadmap" className="data-[state=active]:bg-primary/10 h-8 rounded-full px-4 text-xs">Roadmaps</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="all" className="flex-1 p-0 m-0 overflow-hidden">
                <ScrollArea className="h-full p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                        {filterItems('all').map(renderCard)}
                        {filterItems('all').length === 0 && (
                            <div className="col-span-full text-center py-20 text-muted-foreground">
                                No shared items found.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </TabsContent>

            {['resource', 'learning_path', 'note', 'roadmap'].map(type => (
                <TabsContent key={type} value={type} className="flex-1 p-0 m-0 overflow-hidden">
                    <ScrollArea className="h-full p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                            {filterItems(type).map(renderCard)}
                            {filterItems(type).length === 0 && (
                                <div className="col-span-full text-center py-20 text-muted-foreground">
                                    No {type.replace('_', ' ')}s found.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
            ))}
        </Tabs>
    )
}
