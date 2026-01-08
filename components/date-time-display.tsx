'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export function DateTimeDisplay() {
    const [mounted, setMounted] = useState(false)
    const [date, setDate] = useState(new Date())

    useEffect(() => {
        setMounted(true)
        const timer = setInterval(() => {
            setDate(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    if (!mounted) {
        return <div className="h-6 w-48 bg-muted animate-pulse rounded" /> // Loading skeleton
    }

    return (
        <div className="flex flex-col items-end">
            <p className="text-xl font-bold tracking-tight">
                {format(date, 'h:mm:ss a')}
            </p>
            <p className="text-sm text-muted-foreground font-medium">
                {format(date, 'EEEE, MMMM d, yyyy')}
            </p>
        </div>
    )
}
