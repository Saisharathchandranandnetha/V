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
import { updateGoal } from '@/app/dashboard/goals/actions'
import { Edit2 } from 'lucide-react'

interface Goal {
    id: string
    title: string
    type: string
    current_value: number
    target_value: number
    unit: string
    deadline: string | null
}

export function EditGoalDialog({ goal }: { goal: Goal }) {
    const [open, setOpen] = useState(false)
    const [type, setType] = useState(goal.type)

    async function handleSubmit(formData: FormData) {
        await updateGoal(goal.id, formData)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Goal</DialogTitle>
                    <DialogDescription>
                        Make changes to your goal here.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Title
                        </Label>
                        <Input
                            id="title"
                            name="title"
                            defaultValue={goal.title}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Type
                        </Label>
                        <Select name="type" defaultValue={type} onValueChange={setType}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Short Term">Short Term</SelectItem>
                                <SelectItem value="Mid Term">Mid Term</SelectItem>
                                <SelectItem value="Long Term">Long Term</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="target_value" className="text-right">
                            Target
                        </Label>
                        <Input
                            id="target_value"
                            name="target_value"
                            type="number"
                            defaultValue={goal.target_value}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit" className="text-right">
                            Unit
                        </Label>
                        <Input
                            id="unit"
                            name="unit"
                            defaultValue={goal.unit}
                            className="col-span-3"
                            placeholder="e.g. $, %, kg"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="deadline" className="text-right">
                            Deadline
                        </Label>
                        <Input
                            id="deadline"
                            name="deadline"
                            type="date"
                            defaultValue={goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : ''}
                            className="col-span-3"
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
