"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

interface ThemeSyncProps {
    userTheme?: string
}

export function ThemeSync({ userTheme }: ThemeSyncProps) {
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        if (userTheme && userTheme !== 'system' && userTheme !== theme) {
            setTheme(userTheme)
        }
    }, [userTheme, theme, setTheme])

    return null
}
