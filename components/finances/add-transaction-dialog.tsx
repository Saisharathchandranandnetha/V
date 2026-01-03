'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
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

const CATEGORIES = {
    Income: ['Salary', 'Freelance', 'Investment', 'Other'],
    Expense: ['Food', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other']
}

export function AddTransactionDialog() {
    const [open, setOpen] = useState(false)
    const [type, setType] = useState<'Income' | 'Expense'>('Expense')
    const [category, setCategory] = useState<string>('')

    async function onSubmit(formData: FormData) {
        await addTransaction(formData)
        setOpen(false)
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
                    <div className="grid grid-cols-2 gap-4">
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
                                {CATEGORIES[type].map(cat => (
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
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
