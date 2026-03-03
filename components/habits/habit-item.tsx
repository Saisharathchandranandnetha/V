'use client'

import { useState, useOptimistic, startTransition } from 'react'
import { format } from 'date-fns'
import { Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteHabit, toggleHabit } from '@/app/dashboard/habits/actions'
import { EditHabitDialog } from '@/components/habits/edit-habit-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { HoverEffect } from '@/components/ui/hover-effect'
import { cn } from '@/lib/utils'

interface Habit {
    id: string
    name: string
    frequency: string
    created_at: string
    habit_logs: {
        date: string
        status: boolean
    }[]
}

export function HabitItem({ habit }: { habit: Habit }) {
    const now = new Date()
    // Ensure consistent date formatting
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const initialCompleted = habit.habit_logs.find(log => log.date === today)?.status || false

    // Optimistic state
    // We only need to optimize the 'isCompleted' status for immediate feedback
    const [optimisticCompleted, addOptimisticCompleted] = useOptimistic(
        initialCompleted,
        (state, newStatus: boolean) => newStatus
    )

    const [isPending, setIsPending] = useState(false)

    async function handleToggle() {
        const newStatus = !optimisticCompleted

        // Immediate visual update
        startTransition(() => {
            addOptimisticCompleted(newStatus)
        })

        setIsPending(true)
        try {
            await toggleHabit(habit.id, today, newStatus)
        } catch (error) {
            console.error('Failed to toggle habit', error)
            // Revert optimistic update is handled automatically if we rely on props, 
            // but useOptimistic persists until next prop update. 
            // If server fails, we might be desynced until revalidation.
            // For now, assume success or error toast (todo).
        } finally {
            setIsPending(false)
        }
    }

    const completionCount = habit.habit_logs.filter(l => l.status).length

    return (
        <HoverEffect variant="lift" className="h-full">
            <Card className="h-full transition-colors hover:border-primary/30 min-h-[140px] flex flex-col justify-between">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 p-4">
                    <CardTitle className="text-sm font-medium leading-tight pr-8">
                        {habit.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 absolute top-3 right-3">
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
                <CardContent className="p-4 pt-0 mt-auto">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col">
                            <span className="text-3xl font-bold tracking-tighter">{completionCount}</span>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/50">Total Days</span>
                        </div>
                        <Button
                            size="icon"
                            variant={optimisticCompleted ? "default" : "outline"}
                            className={cn(
                                "h-12 w-12 transition-all rounded-xl",
                                optimisticCompleted && "bg-emerald-500 hover:bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/20",
                                isPending && "opacity-70 scale-95"
                            )}
                            onClick={handleToggle}
                            disabled={isPending}
                        >
                            <Check className={cn("h-6 w-6", optimisticCompleted ? "text-white" : "text-muted-foreground")} />
                        </Button>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60">
                            {habit.frequency}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50">
                            Since {format(new Date(habit.created_at), 'MMM d, yy')}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </HoverEffect>
    )
}
