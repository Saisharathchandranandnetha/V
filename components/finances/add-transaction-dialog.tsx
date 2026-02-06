'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { addTransaction } from '@/app/dashboard/finances/actions'
import { useSearchParams, useRouter } from 'next/navigation'

interface Category {
    id: string
    name: string
    type: 'Income' | 'Expense'
    user_id: string
}

interface Project {
    id: string
    name: string
}

const DEFAULT_CATEGORIES = {
    Income: ['Salary', 'Freelance', 'Investment', 'Other'],
    Expense: ['Food', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other']
}

export function AddTransactionDialog({ categories, projects, onAdd }: { categories: Category[], projects?: Project[], onAdd?: (t: any) => void }) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [type, setType] = useState<'Income' | 'Expense'>('Expense')
    const [category, setCategory] = useState<string>('')
    const [loading, setLoading] = useState(false)

    // Auto-open dialog if ?add=true is in URL
    useEffect(() => {
        if (searchParams.get('add') === 'true') {
            setOpen(true)
            const params = new URLSearchParams(searchParams.toString())
            params.delete('add')
            router.replace(`?${params.toString()}`, { scroll: false })
        }
    }, [searchParams, router])

    // Merge default categories with custom categories from DB
    const availableCategories = [
        ...DEFAULT_CATEGORIES[type],
        ...categories
            .filter(c => c.type === type && !DEFAULT_CATEGORIES[type].includes(c.name))
            .map(c => c.name)
    ].sort()

    // Ensure 'Other' is always at the end
    const sortedCategories = availableCategories.filter(c => c !== 'Other').concat('Other')
    // Remove duplicates just in case
    const uniqueCategories = Array.from(new Set(sortedCategories))

    async function onSubmit(formData: FormData) {
        setLoading(true)

        // Optimistic Update
        if (onAdd) {
            const type = formData.get('type') as 'Income' | 'Expense'
            const amount = parseFloat(formData.get('amount') as string)
            const dateStr = formData.get('date') as string
            const projectId = formData.get('projectId') as string
            const description = formData.get('description') as string
            const categoryName = formData.get('category') as string
            const customCategory = formData.get('custom_category') as string

            let finalCategoryName = categoryName
            if (categoryName === 'Other' && customCategory && customCategory.trim()) {
                finalCategoryName = customCategory.trim()
            }

            const newTransaction = {
                id: crypto.randomUUID(),
                type,
                amount,
                date: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
                category_id: 'temp',
                category_name: finalCategoryName,
                description,
                user_id: 'temp',
                project_id: projectId !== 'undefined' ? projectId : undefined
            }
            onAdd(newTransaction)
            setOpen(false)
        }

        try {
            const result = await addTransaction(formData)
            if (result?.error) {
                toast.error(result.error)
                // In a perfect world we would revert optimistic here
                return
            }
            if (!onAdd) {
                toast.success("Transaction added successfully")
                setOpen(false)
            } else {
                toast.success("Transaction added successfully")
            }
        } catch (error) {
            console.error('Failed to add transaction', error)
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Transaction
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type">Type</Label>
                            <Select name="type" value={type} onValueChange={(v: 'Income' | 'Expense') => setType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Income">Income</SelectItem>
                                    <SelectItem value="Expense">Expense</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="project">Project (Optional)</Label>
                        <Select name="projectId">
                            <SelectTrigger>
                                <SelectValue placeholder="Select Project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="undefined">None</SelectItem>
                                {projects?.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input type="number" name="amount" placeholder="0.00" required step="0.01" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" required onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {category === 'Other' && (
                        <div className="grid gap-2">
                            <Label htmlFor="custom_category">Custom Name (Optional)</Label>
                            <Input
                                name="custom_category"
                                placeholder="e.g. Side Hustle, Gift"
                                className="bg-muted/50"
                            />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input name="description" placeholder="Optional note" />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
