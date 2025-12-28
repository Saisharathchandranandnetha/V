'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreVertical, ExternalLink, Map, BookOpen, FolderInput, Pencil, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { deleteLearningPath } from '@/app/dashboard/actions'
import { useTransition } from 'react'
import Link from 'next/link'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { MoveToCollectionDialog } from '@/components/move-to-collection-dialog'

interface LearningPathProps {
    id: string
    title: string
    description?: string
    links?: string[]
    created_at: string
}

export function LearningPathCard({ path }: { path: LearningPathProps }) {
    const [isPending, startTransition] = useTransition()
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isMoveOpen, setIsMoveOpen] = useState(false)

    const handleDelete = () => {
        startTransition(async () => {
            await deleteLearningPath(path.id)
            setIsDeleteOpen(false)
        })
    }

    return (
        <>
            <Card className={`flex flex-col h-full hover:shadow-md transition-shadow ${isPending ? 'opacity-50' : ''}`}>
                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex gap-2 items-center text-sm font-medium text-muted-foreground w-full">
                            <Map className="h-4 w-4" />
                            <span>Learning Path</span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/paths/${path.id}/edit`} className="w-full cursor-pointer">
                                        <Pencil className="mr-2 h-4 w-4" />
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
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg leading-tight line-clamp-2">
                        {path.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {new Date(path.created_at).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {path.description || 'No description available.'}
                    </p>
                    {path.links && path.links.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Resources:</p>
                            <ul className="text-sm space-y-1">
                                {path.links.slice(0, 3).map((link, i) => (
                                    <li key={i} className="flex items-center gap-2 truncate">
                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                        <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline truncate text-blue-600">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                                {path.links.length > 3 && (
                                    <li className="text-xs text-muted-foreground pl-5">
                                        + {path.links.length - 3} more
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="p-4 pt-0">
                    <Button variant="outline" className="w-full text-xs" asChild>
                        <a href={path.links?.[0] || '#'} target="_blank" rel="noopener noreferrer">
                            Start Learning <BookOpen className="ml-2 h-3 w-3" />
                        </a>
                    </Button>
                </CardFooter>
            </Card>

            <ConfirmDeleteDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                title="Delete Learning Path?"
                description="This will permanently delete this learning path and cannot be undone."
            />

            <MoveToCollectionDialog
                itemId={path.id}
                itemType="path"
                open={isMoveOpen}
                onOpenChange={setIsMoveOpen}
            />
        </>
    )
}
