'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreVertical, ExternalLink, FileText, Youtube, Box, Image as ImageIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { deleteResource } from '@/app/dashboard/actions'
import { useTransition } from 'react'
import { HoverEffect } from '@/components/ui/hover-effect'
import { SpotlightCard } from '@/components/ui/spotlight-card'

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
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { MoveToCollectionDialog } from '@/components/move-to-collection-dialog'
import { FolderInput } from 'lucide-react'

export function ResourceCard({ resource }: { resource: ResourceProps }) {
    const [isPending, startTransition] = useTransition()
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isMoveOpen, setIsMoveOpen] = useState(false)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const handleDelete = () => {
        startTransition(async () => {
            await deleteResource(resource.id)
            setIsDeleteOpen(false)
        })
    }

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect()
        mouseX.set(clientX - left)
        mouseY.set(clientY - top)
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, scale: 1.02 }}
                onMouseMove={handleMouseMove}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="h-full group/card relative"
            >
                <SpotlightCard className="h-full bg-card/40 backdrop-blur-xl border-border/50 saturate-150 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/40 hover:bg-card/60" spotlightColor="rgba(255, 255, 255, 0.15)">
                    {/* Glow Tracing Light moved inside SpotlightCard logic but we keep custom if needed, 
                        actually SpotlightCard handles the spotlight. 
                        We can remove the custom motion div for glow and just use SpotlightCard.
                    */}

                    <CardHeader className="p-4 pb-2 relative z-10">
                        <div className="flex justify-between items-start gap-2">
                            <div className="flex gap-2 items-center text-sm font-medium text-muted-foreground w-full">
                                {typeIcons[resource.type] || <ExternalLink className="h-4 w-4 text-primary" />}
                                <span className="capitalize tracking-wide">{resource.type}</span>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white/10">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass-dark border-white/10">
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
                                        className="text-red-500 focus:text-red-400 focus:bg-red-500/10"
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
                        <CardTitle className="text-lg leading-tight line-clamp-2 mt-1 font-sans">
                            {resource.url ? (
                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2 group">
                                    <span className="group-hover:underline">{resource.title}</span>
                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-y-1 group-hover:translate-y-0" />
                                </a>
                            ) : (
                                <Link href={`/dashboard/resources/${resource.id}`} className="hover:text-primary transition-colors">
                                    {resource.title}
                                </Link>
                            )}
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase tracking-widest opacity-60 font-medium">
                            {new Date(resource.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 flex-1 relative z-10">
                        <p className="text-sm text-foreground/70 line-clamp-3 font-body leading-relaxed">
                            {resource.summary || 'No summary available.'}
                        </p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 gap-2 flex-wrap relative z-10">
                        {resource.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] font-medium bg-white/5 border-white/5 px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors">
                                {tag}
                            </Badge>
                        ))}
                    </CardFooter>
                </SpotlightCard>
            </motion.div>

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
