'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Folder, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteCollection, updateCollection } from '../settings/actions'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'


interface CollectionCardProps {
    collection: {
        id: string
        name: string
        resources: { count: number }[]
    }
}

export function CollectionCard({ collection }: CollectionCardProps) {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [newName, setNewName] = useState(collection.name)
    const [loading, setLoading] = useState(false)

    // Delete Handler
    const handleDelete = async () => {
        try {
            await deleteCollection(collection.id)
            setIsDeleteOpen(false)
        } catch (error) {
            console.error(error)
        }
    }

    // Update Handler
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName.trim()) return

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', newName)
            await updateCollection(collection.id, formData)
            setIsEditOpen(false)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="relative group">
                <Link href={`/dashboard/collections/${collection.id}`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                        <CardHeader>
                            <div className="flex items-start gap-2 pr-8 w-full min-w-0">
                                <Folder className="h-5 w-5 text-blue-500 shrink-0 mt-1" />
                                <CardTitle className="text-lg break-all whitespace-normal leading-tight min-w-0 flex-1">{collection.name}</CardTitle>
                            </div>
                            <CardDescription>
                                {collection.resources[0]?.count || 0} items
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsDeleteOpen(true)
                                }}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <ConfirmDeleteDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                title={`Delete "${collection.name}"?`}
                description="This will permanently delete this collection. Items inside will lose their collection tag but will not be deleted."
            />

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Collection</DialogTitle>
                        <DialogDescription>
                            Enter a new name for this collection.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="col-span-3"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loading || !newName.trim()}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
