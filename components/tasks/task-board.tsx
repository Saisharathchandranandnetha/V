'use client'

import { useState } from 'react'
import { isBefore, startOfDay, format } from 'date-fns'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditTaskDialog } from '@/components/tasks/edit-task-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { CompleteTaskDialog } from '@/components/tasks/complete-task-dialog'
import { deleteTask, updateTaskStatus } from '@/app/dashboard/tasks/actions'
import { cn } from '@/lib/utils'

interface Task {
    id: string
    title: string
    description?: string | null
    priority: string
    status: string
    due_date: string | null
    completed_at?: string | null
    completion_reason?: string | null
}

// Columns
const COLUMNS = [
    { id: 'Todo', title: 'To Do' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Done', title: 'Done' },
]

export function TaskBoard({ tasks }: { tasks: Task[] }) {
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [deletingTask, setDeletingTask] = useState<Task | null>(null)
    const [completingTask, setCompletingTask] = useState<Task | null>(null)

    const priorityColor = {
        Low: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
        Medium: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        High: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
        Urgent: 'bg-red-100 text-red-800 hover:bg-red-100',
    }

    const handleStatusChange = (task: Task, newStatus: string) => {
        if (newStatus === 'Done' && task.due_date && isBefore(new Date(task.due_date), startOfDay(new Date()))) {
            setCompletingTask(task)
        } else {
            updateTaskStatus(task.id, newStatus, newStatus === 'Done' ? new Date().toISOString() : undefined)
        }
    }

    return (
        <>
            {editingTask && (
                <EditTaskDialog
                    task={editingTask}
                    onOpenChange={(open) => !open && setEditingTask(null)}
                    trigger={<span className="hidden" />} // Dummy trigger 
                />
            )}
            {deletingTask && (
                <ConfirmDeleteDialog
                    open={!!deletingTask}
                    onOpenChange={(open) => !open && setDeletingTask(null)}
                    onConfirm={() => {
                        deleteTask(deletingTask.id)
                        setDeletingTask(null)
                    }}
                    title="Delete Task"
                    description="Are you sure you want to delete this task? This action cannot be undone."
                />
            )}
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
            <div className="flex flex-col md:flex-row h-full gap-4 overflow-x-auto pb-4">
                {COLUMNS.map((col) => {
                    const colTasks = tasks.filter((t) => t.status === col.id)
                    return (
                        <div key={col.id} className="flex-1 min-w-[300px] flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">{col.title}</h3>
                                <Badge variant="secondary">{colTasks.length}</Badge>
                            </div>

                            <div className="flex flex-col gap-3">
                                {colTasks.length === 0 && (
                                    <div className="h-24 border rounded-lg border-dashed flex items-center justify-center text-muted-foreground text-sm">
                                        Empty
                                    </div>
                                )}
                                {colTasks.map((task) => (
                                    <Card key={task.id} className="cursor-move hover:shadow-md transition-shadow">
                                        <CardHeader className="p-4 pb-2 space-y-0 flex flex-row items-start justify-between">
                                            <Badge className={cn("text-[10px] px-1 py-0 h-5", priorityColor[task.priority as keyof typeof priorityColor])}>
                                                {task.priority}
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(task, 'Todo')}>
                                                        Move to To Do
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(task, 'In Progress')}>
                                                        Move to In Progress
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(task, 'Done')}>
                                                        Move to Done
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setDeletingTask(task)}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2">
                                            <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                                            {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>}
                                            {task.due_date && (
                                                <p className="text-xs text-muted-foreground mt-2">Due: {format(new Date(task.due_date), 'MMM d')}</p>
                                            )}
                                            {task.status === 'Done' && task.completed_at && task.completion_reason && (
                                                <div className="mt-2 text-xs bg-muted/50 p-2 rounded border">
                                                    <p className="font-semibold text-green-600 dark:text-green-400">Completed on {format(new Date(task.completed_at), 'MMM d')}</p>
                                                    <p className="text-muted-foreground italic mt-1">"{task.completion_reason}"</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}
