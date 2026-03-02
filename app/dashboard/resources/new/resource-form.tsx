'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import { createResource, createCategoryAndReturn } from '@/app/dashboard/actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export default function ResourceForm({ initialCategories }: { initialCategories: any[] }) {
    const [categories, setCategories] = useState(initialCategories || [])
    const [selectedCategory, setSelectedCategory] = useState<string>('none')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [loading, setLoading] = useState(false)
    const [resourceType, setResourceType] = useState('url')
    const [uploadType, setUploadType] = useState('url')

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
                <h1 className="text-2xl font-bold tracking-tight">Add New Resource</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Resource Details</CardTitle>
                    <CardDescription>Add a link, file, or 3D model to your library.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={async (e) => {
                        e.preventDefault()
                        setLoading(true)

                        try {
                            const formData = new FormData(e.currentTarget)
                            const type = formData.get('type') as string

                            // Handle File Upload if selected
                            if (type === 'pdf' && uploadType === 'file') {
                                const fileInput = (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement)
                                const file = fileInput?.files?.[0]

                                if (!file) {
                                    alert('Please select a file to upload')
                                    setLoading(false)
                                    return
                                }

                                // Use an Object URL temporarily instead of Supabase storage
                                const publicUrl = URL.createObjectURL(file)
                                formData.set('url', publicUrl)
                            }

                            await createResource(formData)
                        } catch (error: any) {
                            // Ignore redirect errors
                            if (error?.message === 'NEXT_REDIRECT' || error?.digest?.startsWith('NEXT_REDIRECT')) {
                                throw error
                            }
                            console.error('Error creating resource:', error)
                            alert('Failed to create resource. Please try again.')
                        } finally {
                            setLoading(false)
                        }
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" placeholder="Resource Title" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select name="type" defaultValue="url" onValueChange={(val) => setResourceType(val)}>
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

                        {resourceType === 'pdf' ? (
                            <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                                <Label>Source</Label>
                                <RadioGroup defaultValue="url" onValueChange={setUploadType} className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="url" id="source-url" />
                                        <Label htmlFor="source-url">External URL</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="file" id="source-file" />
                                        <Label htmlFor="source-file">File Upload</Label>
                                    </div>
                                </RadioGroup>

                                {uploadType === 'url' ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="url">PDF URL</Label>
                                        <Input id="url" name="url" placeholder="https://example.com/doc.pdf" required />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="file">Upload PDF</Label>
                                        <Input id="file" type="file" accept=".pdf" required />
                                        {/* Hidden input to satisfy required 'url' field if needed by backend validation, handled by JS */}
                                        <input type="hidden" name="url" value={uploadType === 'file' ? 'placeholder' : ''} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="url">URL</Label>
                                <Input id="url" name="url" placeholder="https://..." required />
                            </div>
                        )}

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
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Resource'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
