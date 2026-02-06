'use client'

import { useOptimistic } from 'react'
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
    const [optimisticHabits, addOptimisticHabit] = useOptimistic(
        initialHabits,
        (state, newHabit: Habit) => [newHabit, ...state]
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Habits</h2>
                    <p className="text-muted-foreground">Build better habits, one day at a time.</p>
                </div>
                <CreateHabitDialog onAdd={(habit) => addOptimisticHabit(habit)} />
            </div>

            <HabitsAnalyticsGraph />

            <HabitList habits={optimisticHabits} />
        </div>
    )
}
