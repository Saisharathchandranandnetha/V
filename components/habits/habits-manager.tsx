'use client'

import { useOptimistic, useTransition } from 'react'
import { HabitList } from './habit-list'
import { CreateHabitDialog } from './create-habit-dialog'
import { HabitsAnalyticsGraph } from './habits-analytics-graph'

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

interface HabitsManagerProps {
    initialHabits: Habit[]
}

export function HabitsManager({ initialHabits }: HabitsManagerProps) {
    const [isPending, startTransition] = useTransition()
    const [optimisticHabits, addOptimisticHabit] = useOptimistic(
        initialHabits,
        (state, newHabit: Habit) => [newHabit, ...state]
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Habits</h2>
                    <p className="text-muted-foreground">Build better habits, one day at a time.</p>
                </div>
                <CreateHabitDialog onAdd={(habit) => {
                    startTransition(() => {
                        addOptimisticHabit(habit)
                    })
                }} />
            </div>

            <HabitsAnalyticsGraph />

            <HabitList habits={optimisticHabits} />
        </div>
    )
}
