'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Pencil, Save, X } from 'lucide-react'
import { createCategory, deleteCategory, updateCategory } from './actions'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'

interface Category {
    id: string
    name: string
}

export default function CategoriesManager({ categories }: { categories: Category[] | null }) {
    const [newCategoryName, setNewCategoryName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const handleCreate = async () => {
        if (!newCategoryName.trim()) return

        setIsCreating(true)
        const formData = new FormData()
        formData.append('name', newCategoryName)

        try {
            await createCategory(formData)
            setNewCategoryName('')
        } catch (error) {
            console.error('Failed to create category', error)
        } finally {
            setIsCreating(false)
        }
    }

    const startEditing = (category: Category) => {
        setEditingId(category.id)
        setEditName(category.name)
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditName('')
    }

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return

        const formData = new FormData()
        formData.append('name', editName)

        try {
            await updateCategory(id, formData)
            setEditingId(null)
        } catch (error) {
            console.error('Failed to update category', error)
        }
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        try {
            await deleteCategory(deleteId)
            setDeleteId(null) // Close dialog
        } catch (error) {
            console.error('Failed to delete category', error)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Categories</CardTitle>
                <CardDescription>Create, edit, or delete categories to organize your resources.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-2 items-end">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="new-category">New Category Name</Label>
                        <Input
                            id="new-category"
                            placeholder="e.g. Design Systems, React Hooks"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                    </div>
                    <Button onClick={handleCreate} disabled={isCreating || !newCategoryName.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                    </Button>
                </div>

                <div className="space-y-2">
                    {categories?.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No categories created yet.</p>
                    ) : (
                        categories?.map((category) => (
                            <div key={category.id} className="flex items-center justify-between p-3 border rounded-md">
                                {editingId === category.id ? (
                                    <div className="flex-1 flex items-center gap-2 mr-2">
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdate(category.id)}
                                            autoFocus
                                        />
                                        <Button size="icon" variant="ghost" onClick={() => handleUpdate(category.id)}>
                                            <Save className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={cancelEditing}>
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-medium">{category.name}</span>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => startEditing(category)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setDeleteId(category.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>

            <ConfirmDeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Category?"
                description="This will permanently delete this category."
                trigger={null}
            />
        </Card>
    )
}
