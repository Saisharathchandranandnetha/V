'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreVertical, ExternalLink, FileText, Youtube, Box, Image as ImageIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { deleteResource } from '@/app/dashboard/actions'
import { useTransition } from 'react'

export type ResourceType = 'url' | 'pdf' | 'youtube' | 'gltf' | 'lottie' | 'image' | 'spline'

export interface ResourceProps {
    id: string
    title: string
    type: ResourceType
    summary?: string
    tags?: string[]
    url?: string
    date: string
}

const typeIcons: Record<string, React.ReactNode> = {
    url: <ExternalLink className="h-4 w-4" />,
    pdf: <FileText className="h-4 w-4" />,
    youtube: <Youtube className="h-4 w-4" />,
    gltf: <Box className="h-4 w-4" />,
    spline: <Box className="h-4 w-4" />,
    lottie: <Box className="h-4 w-4" />,
    image: <ImageIcon className="h-4 w-4" />,
}

import { useState } from 'react'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { MoveToCollectionDialog } from '@/components/move-to-collection-dialog'
import { FolderInput } from 'lucide-react'

export function ResourceCard({ resource }: { resource: ResourceProps }) {
    const [isPending, startTransition] = useTransition()
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isMoveOpen, setIsMoveOpen] = useState(false)

    const handleDelete = () => {
        startTransition(async () => {
            await deleteResource(resource.id)
            setIsDeleteOpen(false)
        })
    }

    return (
        <>
            <Card className={`flex flex-col h-full hover:shadow-md transition-shadow ${isPending ? 'opacity-50' : ''}`}>
                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex gap-2 items-center text-sm font-medium text-muted-foreground w-full">
                            {typeIcons[resource.type] || <ExternalLink className="h-4 w-4" />}
                            <span className="capitalize">{resource.type}</span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/resources/${resource.id}/edit`} className="w-full cursor-pointer">
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsMoveOpen(true)
                                    }}
                                >
                                    <FolderInput className="mr-2 h-4 w-4" />
                                    Move to Collection
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsDeleteOpen(true)
                                    }}
                                    disabled={isPending}
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg leading-tight line-clamp-2">
                        {resource.url ? (
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:underline group-hover:text-primary transition-colors flex items-center gap-2">
                                {resource.title}
                                <ExternalLink className="h-3 w-3 opacity-50" />
                            </a>
                        ) : (
                            <Link href={`/dashboard/resources/${resource.id}`} className="hover:underline">
                                {resource.title}
                            </Link>
                        )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {new Date(resource.date).toLocaleDateString('en-US')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {resource.summary || 'No summary available.'}
                    </p>
                </CardContent>
                <CardFooter className="p-4 pt-0 gap-2 flex-wrap">
                    {resource.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal">
                            {tag}
                        </Badge>
                    ))}
                </CardFooter>
            </Card>

            <ConfirmDeleteDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                title="Delete Resource?"
                description="This will permanently delete this resource."
            />

            <MoveToCollectionDialog
                itemId={resource.id}
                itemType="resource"
                open={isMoveOpen}
                onOpenChange={setIsMoveOpen}
            // currentCollectionId={resource.collection_id} // If available in props
            />
        </>
    )
}
