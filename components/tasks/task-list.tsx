'use client'

import { format } from 'date-fns'
import { Calendar, Trash2 } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface Task {
    id: string
    title: string
    priority: string
    status: string
    due_date: string | null
    description?: string | null
}

export function TaskList({ tasks }: { tasks: Task[] }) {
    const priorityColor = {
        Low: 'bg-blue-100 text-blue-800',
        Medium: 'bg-gray-100 text-gray-800',
        High: 'bg-orange-100 text-orange-800',
        Urgent: 'bg-red-100 text-red-800',
    }

    return (
        <div className="space-y-4">
            {tasks.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    No tasks found. Create one to get started!
                </div>
            )}
            {tasks.map((task) => (
                <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-4 shadow-sm"
                >
                    <div className="flex items-center space-x-4">
                        <Select
                            defaultValue={task.status}
                            onValueChange={(val) => updateTaskStatus(task.id, val)}
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
                                        <Calendar className="mr-1 h-3 w-3" />
                                        {format(new Date(task.due_date), 'MMM d')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
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
            ))}
        </div>
    )
}
