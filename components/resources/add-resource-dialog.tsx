'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, Loader2 } from 'lucide-react'
import { createResource, createCategoryAndReturn } from '@/app/dashboard/actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function AddResourceDialog({ categories: initialCategories, onAdd }: { categories: any[], onAdd?: (r: any) => void }) {
    const [open, setOpen] = useState(false)
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
            toast.error('Failed to create category')
        } finally {
            setLoading(false)
        }
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(e.currentTarget)
            const type = formData.get('type') as string
            const title = formData.get('title') as string
            const summary = formData.get('summary') as string
            const tags = formData.get('tags') as string

            // Handle File Upload logic logic...
            if (type === 'pdf' && uploadType === 'file') {
                const fileInput = (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement)
                const file = fileInput?.files?.[0]

                if (!file) {
                    toast.error('Please select a file to upload')
                    setLoading(false)
                    return
                }

                const supabase = createClient()
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
                const filePath = `pdfs/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('resources')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('resources')
                    .getPublicUrl(filePath)

                formData.set('url', publicUrl)
            }
            // End file upload logic

            const url = formData.get('url') as string

            // Optimistic Update
            if (onAdd) {
                const newResource = {
                    id: crypto.randomUUID(),
                    title,
                    type,
                    summary,
                    tags,
                    url,
                    created_at: new Date().toISOString()
                }
                onAdd(newResource)
                setOpen(false)
            }

            const result = await createResource(formData)
            if (!onAdd) {
                setOpen(false)
                toast.success("Resource created")
            }


        } catch (error: any) {
            console.error('Error creating resource:', error)
            toast.error('Failed to create resource.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resource
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Resource</DialogTitle>
                    <DialogDescription>Add a link, file, or 3D model to your library.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4 py-4">
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
                                        {/* Nested form for category */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="catName">Name</Label>
                                                <Input
                                                    id="catName"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    placeholder="e.g., Design Patterns"
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button type="button" onClick={handleCreateCategory} disabled={loading || !newCategoryName.trim()}>
                                                    {loading ? 'Creating...' : 'Create'}
                                                </Button>
                                            </DialogFooter>
                                        </div>
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

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Resource
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
