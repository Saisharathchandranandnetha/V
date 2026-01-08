'use client'

import { useState } from 'react'
import { format, isBefore, startOfDay } from 'date-fns'
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { deleteTask, updateTaskStatus } from '@/app/dashboard/tasks/actions'
import { EditTaskDialog } from '@/components/tasks/edit-task-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { CompleteTaskDialog } from '@/components/tasks/complete-task-dialog'
import { cn } from '@/lib/utils'

interface Task {
    id: string
    title: string
    priority: string
    status: string
    due_date: string | null
    description?: string | null
    completed_at?: string | null
    completion_reason?: string | null
}

export function TaskList({ tasks }: { tasks: Task[] }) {
    const [completingTask, setCompletingTask] = useState<Task | null>(null)
    const priorityColor = {
        Low: 'bg-blue-100 text-blue-800',
        Medium: 'bg-gray-100 text-gray-800',
        High: 'bg-orange-100 text-orange-800',
        Urgent: 'bg-red-100 text-red-800',
    }

    const handleStatusChange = (task: Task, newStatus: string) => {
        if (newStatus === 'Done' && task.due_date && isBefore(new Date(task.due_date), startOfDay(new Date()))) {
            setCompletingTask(task)
        } else {
            // For simple completion (on time) or other status changes
            // If marking as Done, we must set completed_at to now.
            // If changing to Todo/In Progress, the action handles clearing it.
            updateTaskStatus(task.id, newStatus, newStatus === 'Done' ? new Date().toISOString() : undefined)
        }
    }

    return (
        <div className="space-y-4">
            {completingTask && (
                <CompleteTaskDialog
                    open={!!completingTask}
                    onOpenChange={(open) => !open && setCompletingTask(null)}
                    taskTitle={completingTask.title}
                    onConfirm={(date, reason) => {
                        updateTaskStatus(completingTask.id, 'Done', date.toISOString(), reason)
                        setCompletingTask(null)
                    }}
                />
            )}
            {tasks.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    No tasks found. Create one to get started!
                </div>
            )}
            {tasks.map((task) => (
                <div
                    key={task.id}
                    className="flex flex-col gap-2 rounded-lg border p-4 shadow-sm"
                >
                    <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
                        <div className="flex items-start md:items-center space-x-0 md:space-x-4 flex-col md:flex-row gap-2 md:gap-0 w-full md:w-auto">
                            <Select
                                defaultValue={task.status}
                                onValueChange={(val) => handleStatusChange(task, val)}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todo">Todo</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                            <div>
                                <h3 className={cn("font-medium", task.status === 'Done' && "line-through text-muted-foreground")}>{task.title}</h3>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <Badge variant="secondary" className={cn("rounded-sm px-1 font-normal", priorityColor[task.priority as keyof typeof priorityColor])}>
                                        {task.priority}
                                    </Badge>
                                    {task.due_date && (
                                        <span className="flex items-center">
                                            <CalendarIcon className="mr-1 h-3 w-3" />
                                            {format(new Date(task.due_date), 'MMM d')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 self-end md:self-auto">
                            <EditTaskDialog task={task} />
                            <ConfirmDeleteDialog
                                trigger={
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                }
                                onConfirm={() => deleteTask(task.id)}
                                title="Delete Task"
                                description="Are you sure you want to delete this task? This action cannot be undone."
                            />
                        </div>
                    </div>
                    {task.status === 'Done' && task.completed_at && task.completion_reason && (
                        <div className="text-xs bg-slate-50 p-2 rounded border mt-2 ml-0 md:ml-[156px]">
                            <p className="font-semibold text-green-600">Completed on {format(new Date(task.completed_at), 'MMM d')} <span className="text-muted-foreground font-normal italic">- "{task.completion_reason}"</span></p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
