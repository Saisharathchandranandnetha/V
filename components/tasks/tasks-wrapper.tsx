'use client'

import { useState } from 'react'
import { isSameDay, isBefore, startOfDay, format } from 'date-fns'
import { ActivitiesCalendar } from './activities-calendar'
import { CreateTaskDialog } from './create-task-dialog'
import { TaskList } from './task-list'
import { TaskBoard } from './task-board'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutList, Kanban } from 'lucide-react'

// Define Task interface locally or import it if shared
interface Task {
    id: string
    title: string
    priority: string
    status: string
    due_date: string | null
    description?: string | null
    created_at: string
}

export function TasksWrapper({ tasks: initialTasks }: { tasks: Task[] }) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    // Filter Logic
    const filteredTasks = initialTasks.filter((task) => {
        const taskDate = task.due_date ? new Date(task.due_date) : new Date(task.created_at) // Fallback to created_at if no due date? Or just ignore?
        // Actually, let's assume due_date is the source of truth for "scheduled" day.

        // If task has no due date, maybe show it in backlog or 'Today' if created today?
        // Let's assume tasks ALWAYS have a due_date when created via our new UI.
        // For existing tasks without date, show them on Today or backlog.

        const targetDate = startOfDay(selectedDate)
        const checkDate = startOfDay(taskDate)

        if (isSameDay(targetDate, new Date())) {
            // "Today" View Logic:
            // Show: 
            // 1. Tasks due TODAY
            // 2. Tasks due BEFORE today that are NOT completed (Carryover)

            const isDueToday = isSameDay(checkDate, targetDate)
            const isOverdue = isBefore(checkDate, targetDate)
            const isIncomplete = task.status !== 'Done' && task.status !== 'Completed' // Adjust based on your status values

            return isDueToday || (isOverdue && isIncomplete)
        } else {
            // "Future/Past" View Logic:
            // Show ONLY tasks due on that specific date
            return isSameDay(checkDate, targetDate)
        }
    })

    return (
        <div className="space-y-6">
            <div className="grid gap-6">
                <ActivitiesCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">
                            Tasks for {format(selectedDate, 'EEEE, d MMMM')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} scheduled
                        </p>
                    </div>
                    <CreateTaskDialog defaultDate={selectedDate} />
                </div>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="list" className="flex items-center gap-2"><LayoutList className="h-4 w-4" /> List</TabsTrigger>
                        <TabsTrigger value="board" className="flex items-center gap-2"><Kanban className="h-4 w-4" /> Board</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="list" className="mt-0">
                    <TaskList tasks={filteredTasks} />
                </TabsContent>
                <TabsContent value="board" className="mt-0">
                    <TaskBoard tasks={filteredTasks} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
