'use client'

import { format } from 'date-fns'
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
import { deleteTask, updateTaskStatus } from '@/app/dashboard/tasks/actions'
import { cn } from '@/lib/utils'

interface Task {
    id: string
    title: string
    description?: string
    priority: string
    status: string
    due_date: string | null
}

// Columns
const COLUMNS = [
    { id: 'Todo', title: 'To Do' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Done', title: 'Done' },
]

export function TaskBoard({ tasks }: { tasks: Task[] }) {
    const priorityColor = {
        Low: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
        Medium: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        High: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
        Urgent: 'bg-red-100 text-red-800 hover:bg-red-100',
    }

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
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
                                                <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'Todo')}>
                                                    Move to To Do
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'In Progress')}>
                                                    Move to In Progress
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'Done')}>
                                                    Move to Done
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => deleteTask(task.id)}
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
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
