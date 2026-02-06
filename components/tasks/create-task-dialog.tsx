'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
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
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createTask } from '@/app/dashboard/tasks/actions'
import { useRouter, useSearchParams } from 'next/navigation'

export function CreateTaskDialog({ defaultDate, onAdd }: { defaultDate?: Date, onAdd?: (task: any) => void }) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [open, setOpen] = useState(false)
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
    const effectiveDate = defaultDate || new Date()
    // Format date as YYYY-MM-DD for input value if we wanted to show it, 
    // but the requirement is to "select date ... and task ... added before" - implies hidden or read-only context.
    // User requested: "while addind tasks i should not not get an option of due date"
    // So we will hide the date input and pass it silently.

    async function onSubmit(formData: FormData) {
        setLoading(true)

        // Optimistic Update
        if (onAdd) {
            const title = formData.get('title') as string
            const priority = (formData.get('priority') as string) || 'Medium'
            const description = formData.get('description') as string
            const newTask = {
                id: crypto.randomUUID(),
                title,
                priority,
                status: 'Todo',
                due_date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : new Date().toISOString(), // Match server format if possible, or ISO
                description,
                created_at: new Date().toISOString()
            }
            onAdd(newTask)
            setOpen(false)
        }

        try {
            await createTask(formData)
            if (!onAdd) setOpen(false)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-4 py-4">
                    <input type="hidden" name="due_date" value={format(effectiveDate, 'yyyy-MM-dd')} />

                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" placeholder="What needs to be done?" required autoFocus />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="Details..." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select name="priority" defaultValue="Medium">
                            <SelectTrigger>
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Due Date is hidden as requested, dictated by the selected calendar date */}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Task
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    )
}
