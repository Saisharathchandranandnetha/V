'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import { createResource, createCollectionAndReturn } from '@/app/dashboard/actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export default function ResourceForm({ initialCollections }: { initialCollections: any[] }) {
    const [collections, setCollections] = useState(initialCollections || [])
    const [selectedCollection, setSelectedCollection] = useState<string>('none')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return

        setLoading(true)
        try {
            const newCollection = await createCollectionAndReturn(newCategoryName)
            if (newCollection) {
                setCollections([...collections, newCollection])
                setSelectedCollection(newCollection.id)
                setIsCreateOpen(false)
                setNewCategoryName('')
            }
        } catch (error) {
            console.error('Failed to create category', error)
            alert('Failed to create category')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Link href="/dashboard/resources">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Add New Resource</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Resource Details</CardTitle>
                    <CardDescription>Add a link, file, or 3D model to your library.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form action={createResource} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input id="url" name="url" placeholder="https://..." required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" placeholder="Resource Title" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select name="type" defaultValue="url">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="url">Web Link</SelectItem>
                                        <SelectItem value="pdf">PDF Document</SelectItem>
                                        <SelectItem value="youtube">YouTube Video</SelectItem>
                                        <SelectItem value="gltf">3D Model (GLTF)</SelectItem>
                                        <SelectItem value="spline">Spline Scene</SelectItem>
                                        <SelectItem value="image">Image</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="collection">Category (Optional)</Label>
                                <div className="flex gap-2">
                                    <Select
                                        name="collection_id"
                                        value={selectedCollection}
                                        onValueChange={setSelectedCollection}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {collections.map((collection: any) => (
                                                <SelectItem key={collection.id} value={collection.id}>
                                                    {collection.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="icon" type="button" title="Create New Category">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Create New Category</DialogTitle>
                                                <DialogDescription>
                                                    Add a new category to organize your resources.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleCreateCategory} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="catName">Name</Label>
                                                    <Input
                                                        id="catName"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="e.g., Design Patterns"
                                                        autoFocus
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                                        Cancel
                                                    </Button>
                                                    <Button type="submit" disabled={loading || !newCategoryName.trim()}>
                                                        {loading ? 'Creating...' : 'Create Category'}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags</Label>
                            <Input id="tags" name="tags" placeholder="react, design, ai (comma separated)" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="summary">Summary (Optional)</Label>
                            <Textarea id="summary" name="summary" placeholder="Brief description of the resource..." />
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/dashboard/resources">Cancel</Link>
                            </Button>
                            <Button type="submit">Save Resource</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
