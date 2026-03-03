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
    team?: { name: string } | null
    project?: { name: string } | null
    message?: {
        sender: { name: string } | null
    } | null
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
        Low: 'bg-blue-100/50 text-blue-500',
        Medium: 'bg-gray-100/50 text-gray-500',
        High: 'bg-orange-100/50 text-orange-500',
        Urgent: 'bg-red-100/50 text-red-500',
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
            <div className="flex flex-col md:flex-row h-[75vh] min-h-[500px] gap-6 overflow-x-auto pb-4 items-start">
                {COLUMNS.map((col) => {
                    const colTasks = tasks.filter((t) => t.status === col.id)
                    return (
                        <div key={col.id} className="flex-1 min-w-[320px] flex flex-col gap-4 bg-muted/20 p-4 rounded-xl h-full border border-white/5">
                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                <h3 className="font-semibold text-sm text-foreground/80 tracking-tight">{col.title}</h3>
                                <Badge variant="secondary" className="bg-background">{colTasks.length}</Badge>
                            </div>

                            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                                {colTasks.length === 0 && (
                                    <div className="h-24 border rounded-lg border-dashed border-white/10 flex items-center justify-center text-muted-foreground/60 text-xs font-medium">
                                        Drop tasks here
                                    </div>
                                )}
                                {colTasks.map((task) => (
                                    <Card key={task.id} className="cursor-move hover:border-primary/40 transition-colors bg-card/80 backdrop-blur-sm">
                                        <CardHeader className="p-4 pb-2 space-y-0 flex flex-row items-start justify-between">
                                            <Badge variant="outline" className={cn("text-[10px] px-2 py-0 h-5 border-none font-medium", priorityColor[task.priority as keyof typeof priorityColor])}>
                                                {task.priority}
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground/60 hover:text-foreground">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 border-white/10 bg-background/95 backdrop-blur-sm">
                                                    <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem className="text-xs cursor-pointer focus:bg-white/5" onClick={() => handleStatusChange(task, 'Todo')}>
                                                        Move to To Do
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-xs cursor-pointer focus:bg-white/5" onClick={() => handleStatusChange(task, 'In Progress')}>
                                                        Move to In Progress
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-xs cursor-pointer focus:bg-white/5" onClick={() => handleStatusChange(task, 'Done')}>
                                                        Move to Done
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem className="text-xs cursor-pointer focus:bg-white/5" onClick={() => setEditingTask(task)}>
                                                        Edit Ticket
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-xs cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                        onClick={() => setDeletingTask(task)}
                                                    >
                                                        Delete Ticket
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-1">
                                            <CardTitle className={cn("text-sm font-medium leading-tight mb-2 tracking-tight", task.status === 'Done' && "line-through text-muted-foreground")}>
                                                {task.title}
                                            </CardTitle>

                                            {task.description && (
                                                <p className="text-xs text-muted-foreground/70 line-clamp-2 mb-3 leading-relaxed">
                                                    {task.description}
                                                </p>
                                            )}

                                            <div className="flex flex-col gap-2 mt-auto">
                                                {task.due_date && (
                                                    <div className="flex items-center text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 bg-muted/30 w-fit px-2 py-1 rounded">
                                                        Due: {format(new Date(task.due_date), 'MMM d')}
                                                    </div>
                                                )}

                                                {task.status === 'Done' && task.completed_at && task.completion_reason && (
                                                    <div className="mt-1 text-[10px] bg-emerald-500/10 text-emerald-500/80 p-2 rounded-md border border-emerald-500/10">
                                                        <span className="font-bold tracking-wide uppercase block mb-1">Resolved {format(new Date(task.completed_at), 'MMM d')}</span>
                                                        <span className="italic opacity-80">&quot;{task.completion_reason}&quot;</span>
                                                    </div>
                                                )}

                                                {(task.team || task.project) && task.message?.sender && (
                                                    <div className="mt-1 text-[10px] text-muted-foreground/50 font-medium">
                                                        Origin: {task.message.sender.name} ({task.team?.name || task.project?.name})
                                                    </div>
                                                )}
                                            </div>
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
