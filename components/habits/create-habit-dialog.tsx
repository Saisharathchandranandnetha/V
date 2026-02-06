'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
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
import { createHabit } from '@/app/dashboard/habits/actions'

export function CreateHabitDialog({ onAdd }: { onAdd?: (habit: any) => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function onSubmit(formData: FormData) {
        setLoading(true)

        // Optimistic Update
        if (onAdd) {
            const name = formData.get('name') as string
            const frequency = formData.get('frequency') as string

            const tempHabit = {
                id: crypto.randomUUID(),
                name,
                frequency,
                created_at: new Date().toISOString(),
                habit_logs: []
            }
            onAdd(tempHabit)
            setOpen(false) // Close dialog immediately
        }

        try {
            await createHabit(formData)
            if (!onAdd) setOpen(false) // Fallback close if no optimistic handler
        } catch (error) {
            console.error(error)
            // Ideally revert optimistic update here, but for now we rely on revalidation
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Habit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Habit</DialogTitle>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" name="name" placeholder="e.g. Read 30 mins" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select name="frequency" defaultValue="Daily">
                            <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Daily">Daily</SelectItem>
                                <SelectItem value="Weekly">Weekly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Habit
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
