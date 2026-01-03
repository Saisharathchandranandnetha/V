'use client'

import { useState, useEffect } from 'react'
import { format, addDays, subDays, startOfWeek, isSameDay, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ActivitiesCalendarProps {
    selectedDate: Date
    onDateSelect: (date: Date) => void
}

export function ActivitiesCalendar({ selectedDate, onDateSelect }: ActivitiesCalendarProps) {
    const [currentStartDate, setCurrentStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

    // Reset calendar view when selectedDate changes externally to something far away?
    // For now, let's keep it simple.

    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentStartDate, i))

    const handlePrevious = () => setCurrentStartDate(prev => subDays(prev, 7))
    const handleNext = () => setCurrentStartDate(prev => addDays(prev, 7))
    const handleToday = () => {
        const today = new Date()
        onDateSelect(today)
        setCurrentStartDate(startOfWeek(today, { weekStartsOn: 1 }))
    }

    return (
        <div className="flex flex-col gap-4 bg-card border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold capitalize">
                        {format(selectedDate, 'MMMM yyyy')}
                    </h2>
                    {isToday(selectedDate) && (
                        <span className="text-sm text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">Today</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleToday} className="hidden sm:flex">
                        Today
                    </Button>
                    <div className="flex items-center border rounded-md">
                        <Button variant="ghost" size="icon" onClick={handlePrevious} className="h-8 w-8 rounded-none rounded-l-md">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 rounded-none rounded-r-md">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {weekDays.map((date) => {
                    const isSelected = isSameDay(date, selectedDate)
                    const isCurrentDay = isToday(date)

                    return (
                        <button
                            key={date.toString()}
                            onClick={() => onDateSelect(date)}
                            className={cn(
                                "flex flex-col items-center justify-center py-3 rounded-lg transition-all border",
                                isSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                                    : "bg-background hover:bg-muted border-transparent hover:border-border",
                                isCurrentDay && !isSelected && "text-primary border-primary/50"
                            )}
                        >
                            <span className="text-xs font-medium opacity-80 uppercase tracking-tighter">
                                {format(date, 'EEE')}
                            </span>
                            <span className={cn(
                                "text-lg font-bold",
                                isSelected ? "opacity-100" : "opacity-90"
                            )}>
                                {format(date, 'd')}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
