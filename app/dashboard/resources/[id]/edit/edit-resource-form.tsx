'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Link as LinkIcon, ChevronLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { updateResource, createCategoryAndReturn } from '@/app/dashboard/actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface EditResourceFormProps {
    resource: any
    initialCategories: any[]
}

export function EditResourceForm({ resource, initialCategories }: EditResourceFormProps) {
    const [categories, setCategories] = useState(initialCategories || [])
    const [selectedCategory, setSelectedCategory] = useState<string>(resource.category_id || 'none')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return

        setLoading(true)
        try {
            const newCategory = await createCategoryAndReturn(newCategoryName)
            if (newCategory) {
                setCategories([...categories, newCategory])
                setSelectedCategory(newCategory.id)
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
                <h1 className="text-2xl font-bold tracking-tight">Edit Resource</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Details</CardTitle>
                    <CardDescription>Update the information for this resource.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form action={updateResource.bind(null, resource.id)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input id="url" name="url" defaultValue={resource.url} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" defaultValue={resource.title} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select name="type" defaultValue={resource.type}>
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
                                <Label htmlFor="category">Category (Optional)</Label>
                                <div className="flex gap-2">
                                    <Select
                                        name="category_id"
                                        value={selectedCategory}
                                        onValueChange={setSelectedCategory}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {categories.map((category: any) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
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
                                            <div className="space-y-4">
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
                                                    <Button onClick={handleCreateCategory} disabled={loading || !newCategoryName.trim()}>
                                                        {loading ? 'Creating...' : 'Create Category'}
                                                    </Button>
                                                </DialogFooter>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags</Label>
                            <Input id="tags" name="tags" defaultValue={resource.tags?.join(', ')} placeholder="react, design, ai (comma separated)" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="summary">Summary (Optional)</Label>
                            <Textarea id="summary" name="summary" defaultValue={resource.summary || ''} placeholder="Brief description of the resource..." />
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/dashboard/resources">Cancel</Link>
                            </Button>
                            <Button type="submit">Update Resource</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
