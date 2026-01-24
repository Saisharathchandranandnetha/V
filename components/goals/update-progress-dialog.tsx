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
import { updateGoalProgress } from '@/app/dashboard/goals/actions'

interface Goal {
    id: string
    title: string
    current_value: number
    target_value: number
    unit: string
}

export function UpdateProgressDialog({ goal }: { goal: Goal }) {
    const [open, setOpen] = useState(false)
    const [current, setCurrent] = useState(goal.current_value)

    async function handleSubmit() {
        await updateGoalProgress(goal.id, current)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                    Update Progress
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Progress</DialogTitle>
                    <DialogDescription>
                        Update your progress for {goal.title}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="current" className="text-right">
                            Current ({goal.unit})
                        </Label>
                        <Input
                            id="current"
                            type="number"
                            value={current}
                            onChange={(e) => setCurrent(Number(e.target.value))}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
