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
import { createGoal } from '@/app/dashboard/goals/actions'

export function CreateGoalDialog() {
    const [open, setOpen] = useState(false)

    async function onSubmit(formData: FormData) {
        await createGoal(formData)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Set Goal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Set New Goal</DialogTitle>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Goal Title</Label>
                        <Input id="title" name="title" placeholder="e.g. Save $10k" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type">Type</Label>
                            <Select name="type" defaultValue="Short Term">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Short Term">Short Term</SelectItem>
                                    <SelectItem value="Mid Term">Mid Term</SelectItem>
                                    <SelectItem value="Long Term">Long Term</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="deadline">Target Date</Label>
                            <Input type="date" name="deadline" id="deadline" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="current_value">Current</Label>
                            <Input type="number" name="current_value" defaultValue="0" step="0.1" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="target_value">Target</Label>
                            <Input type="number" name="target_value" placeholder="100" required step="0.1" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Input name="unit" placeholder="%, $, books" defaultValue="%" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit">Create Goal</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
