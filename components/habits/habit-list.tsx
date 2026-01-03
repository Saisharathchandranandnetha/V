'use client'

import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteHabit, toggleHabit } from '@/app/dashboard/habits/actions'
import { EditHabitDialog } from '@/components/habits/edit-habit-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { cn } from '@/lib/utils'

interface Habit {
    id: string
    name: string
    frequency: string
    habit_logs: {
        date: string
        status: boolean
    }[]
}

export function HabitList({ habits }: { habits: Habit[] }) {
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

    const today = new Date().toISOString().split('T')[0]

    async function handleToggle(habitId: string, currentStatus: boolean) {
        setLoadingIds(prev => new Set(prev).add(habitId))
        try {
            await toggleHabit(habitId, today, !currentStatus)
        } catch (error) {
            console.error('Failed to toggle habit', error)
        } finally {
            setLoadingIds(prev => {
                const next = new Set(prev)
                next.delete(habitId)
                return next
            })
        }
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => {
                const todayLog = habit.habit_logs.find(log => log.date === today)
                const isCompleted = todayLog?.status || false
                const isLoading = loadingIds.has(habit.id)

                // Calculate Streak (Simple version: consecutive days backwards from yesterday/today)
                // complex streak logic omitted for brevity, just showing count of total logs for now or last 30 days
                const completionCount = habit.habit_logs.filter(l => l.status).length

                return (
                    <Card key={habit.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {habit.name}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                                <EditHabitDialog habit={habit} />
                                <ConfirmDeleteDialog
                                    trigger={
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    }
                                    onConfirm={() => deleteHabit(habit.id)}
                                    title="Delete Habit"
                                    description="Are you sure you want to delete this habit? All progress will be lost."
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold">{completionCount} Days</div>
                                <Button
                                    size="icon"
                                    variant={isCompleted ? "default" : "outline"}
                                    className={cn(
                                        "h-10 w-10 transition-all",
                                        isCompleted && "bg-green-500 hover:bg-green-600 border-green-500"
                                    )}
                                    disabled={isLoading}
                                    onClick={() => handleToggle(habit.id, isCompleted)}
                                >
                                    <Check className={cn("h-6 w-6", isCompleted ? "text-white" : "text-muted-foreground")} />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {habit.frequency}
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
