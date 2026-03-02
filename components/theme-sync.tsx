"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

interface ThemeSyncProps {
    userTheme?: string
    userId?: string
}

export function ThemeSync({ userTheme }: ThemeSyncProps) {
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        if (userTheme && userTheme !== theme) {
            setTheme(userTheme)
        }
    }, [userTheme, setTheme])

    return null
}
