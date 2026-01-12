'use client'

import { HoverEffect } from '@/components/ui/hover-effect'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { cn } from '@/lib/utils'
import { HabitItem } from './habit-item'

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

export function HabitList({ habits }: { habits: Habit[] }) {
    return (
        <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" delay={0.2}>
            {habits.map((habit) => (
                <StaggerItem key={habit.id}>
                    <HabitItem habit={habit} />
                </StaggerItem>
            ))}
        </StaggerContainer>
    )
}
