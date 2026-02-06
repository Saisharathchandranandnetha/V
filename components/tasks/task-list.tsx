'use client'

import { useState } from 'react'
import { format, isBefore, startOfDay } from 'date-fns'
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { CompleteTaskDialog } from '@/components/tasks/complete-task-dialog'
import { cn } from '@/lib/utils'
import { HoverEffect } from '@/components/ui/hover-effect'
import { SpotlightCard } from '@/components/ui/spotlight-card'

interface Task {
    id: string
    title: string
    priority: string
    status: string
    due_date: string | null
    description?: string | null
    completed_at?: string | null
    completion_reason?: string | null
    team?: { name: string } | null
    project?: { name: string } | null
    message?: {
        sender: { name: string } | null
    } | null
}

export function TaskList({ tasks }: { tasks: Task[] }) {
    const [completingTask, setCompletingTask] = useState<Task | null>(null)
    const priorityColor = {
        Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        Medium: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        High: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        Urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }

    const handleStatusChange = (task: Task, newStatus: string) => {
        if (newStatus === 'Done' && task.due_date && isBefore(new Date(task.due_date), startOfDay(new Date()))) {
            setCompletingTask(task)
        } else {
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
            <StaggerContainer className="flex flex-col gap-4" animate="show">
                {tasks.map((task) => (
                    <StaggerItem key={task.id} className="w-full">
                        <HoverEffect variant="lift">
                            <SpotlightCard className="transition-colors hover:border-primary/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className={cn("text-sm font-medium", task.status === 'Done' && "line-through text-muted-foreground")}>
                                            {task.title}
                                        </CardTitle>
                                        {(task.team || task.project) && task.message?.sender && (
                                            <p className="text-xs text-muted-foreground">
                                                By {task.message.sender.name} in {task.team?.name || task.project?.name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <EditTaskDialog task={task} />
                                        <ConfirmDeleteDialog
                                            trigger={
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            }
                                            onConfirm={() => deleteTask(task.id)}
                                            title="Delete Task"
                                            description="Are you sure you want to delete this task? This action cannot be undone."
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className={cn("rounded-sm px-1 font-normal", priorityColor[task.priority as keyof typeof priorityColor])}>
                                                    {task.priority}
                                                </Badge>
                                                {task.due_date && (
                                                    <span className="flex items-center text-xs text-muted-foreground">
                                                        <CalendarIcon className="mr-1 h-3 w-3" />
                                                        {format(new Date(task.due_date), 'MMM d')}
                                                    </span>
                                                )}
                                            </div>
                                            {task.status === 'Done' && task.completed_at && task.completion_reason && (
                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                    Completed: <span className="text-muted-foreground italic">{task.completion_reason}</span>
                                                </p>
                                            )}
                                        </div>

                                        <Select
                                            defaultValue={task.status}
                                            onValueChange={(val) => handleStatusChange(task, val)}
                                        >
                                            <SelectTrigger className="w-[130px] h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Todo">Todo</SelectItem>
                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                <SelectItem value="Done">Done</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </SpotlightCard>
                        </HoverEffect>
                    </StaggerItem>
                ))}
            </StaggerContainer>
        </div>
    )
}
