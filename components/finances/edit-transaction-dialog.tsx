'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { updateTransaction } from '@/app/dashboard/finances/actions'
import { Edit2 } from 'lucide-react'
import { toast } from 'sonner'

interface Transaction {
    id: string
    type: 'Income' | 'Expense' | string
    amount: number
    category_name: string
    description?: string
    date: string
    project_id?: string | null
}

interface Category {
    id: string
    name: string
    type: 'Income' | 'Expense'
    user_id: string
}

const DEFAULT_CATEGORIES = {
    Income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other'],
    Expense: ['Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other']
}

interface Project {
    id: string
    name: string
}

export function EditTransactionDialog({ transaction, categories, projects }: { transaction: Transaction, categories: Category[], projects: Project[] }) {
    const [open, setOpen] = useState(false)
    const [type, setType] = useState<'Income' | 'Expense'>(transaction.type as 'Income' | 'Expense')

    // Determine initial category state
    const incomeCategories = [
        ...DEFAULT_CATEGORIES['Income'],
        ...categories.filter(c => c.type === 'Income' && !DEFAULT_CATEGORIES['Income'].includes(c.name)).map(c => c.name)
    ].sort()
    const expenseCategories = [
        ...DEFAULT_CATEGORIES['Expense'],
        ...categories.filter(c => c.type === 'Expense' && !DEFAULT_CATEGORIES['Expense'].includes(c.name)).map(c => c.name)
    ].sort()

    const availableCategories = type === 'Income' ? incomeCategories : expenseCategories

    // Ensure 'Other' is always at the end
    const sortedCategories = availableCategories.filter(c => c !== 'Other').concat('Other')
    const uniqueCategories = Array.from(new Set(sortedCategories))

    const isCustomInitially = !uniqueCategories.includes(transaction.category_name) && transaction.category_name !== 'Custom'
    const [category, setCategory] = useState<string>(isCustomInitially ? 'Custom' : transaction.category_name)
    const [customCategory, setCustomCategory] = useState<string>(isCustomInitially ? transaction.category_name : '')

    // Add transaction has project_id? Need to check Transaction interface and backend data.
    // Assuming backend returns project_id for transactions now. We need to update Transaction interface here.
    const [projectId, setProjectId] = useState<string>(transaction.project_id || 'undefined')

    async function handleSubmit(formData: FormData) {
        // If Custom is selected, override the category field with the custom value
        if (category === 'Custom') {
            formData.set('category', customCategory)
        }
        const result = await updateTransaction(transaction.id, formData)

        if (result?.error) {
            toast.error(result.error)
            return
        }

        toast.success("Transaction updated successfully")
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Transaction</DialogTitle>
                    <DialogDescription>
                        Make changes to your transaction here.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Type
                        </Label>
                        <Select name="type" defaultValue={type} onValueChange={(v: 'Income' | 'Expense') => setType(v)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Income">Income</SelectItem>
                                <SelectItem value="Expense">Expense</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Date
                        </Label>
                        <Input
                            id="date"
                            name="date"
                            type="date"
                            defaultValue={new Date(transaction.date).toISOString().split('T')[0]}
                            className="col-span-3"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="project" className="text-right">
                            Project
                        </Label>
                        <Select name="projectId" value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select Project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="undefined">None</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Amount
                        </Label>
                        <Input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            defaultValue={transaction.amount}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                            Category
                        </Label>
                        <Select
                            name="category"
                            value={category}
                            onValueChange={setCategory}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueCategories.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                                <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {category === 'Custom' && (
                        <div className="grid grid-cols-4 items-center gap-4 animate-in slide-in-from-top-2 fade-in">
                            <Label htmlFor="custom_category" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="custom_category"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="Enter custom category name"
                                className="col-span-3"
                                required
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Description
                        </Label>
                        <Input
                            id="description"
                            name="description"
                            defaultValue={transaction.description}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Date
                        </Label>
                        <Input
                            id="date"
                            name="date"
                            type="date"
                            defaultValue={new Date(transaction.date).toISOString().split('T')[0]}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
