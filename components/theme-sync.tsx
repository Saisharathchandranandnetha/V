"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface ThemeSyncProps {
    userTheme?: string
}

export function ThemeSync({ userTheme, userId }: { userTheme?: string, userId?: string }) {
    const { theme, setTheme } = useTheme()

    // Initial sync
    useEffect(() => {
        if (userTheme && userTheme !== theme) {
            setTheme(userTheme)
        }
    }, [userTheme, setTheme]) // Sync only when userTheme changes from props

    // Real-time sync
    useEffect(() => {
        if (!userId) return

        const supabase = createClient()

        const channel = supabase.channel(`user_theme_sync_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${userId}`
                },
                (payload: any) => {
                    const newSettings = payload.new.settings
                    const newTheme = newSettings?.theme

                    if (newTheme && newTheme !== theme) {
                        console.log('Syncing theme from remote:', newTheme)
                        setTheme(newTheme)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, theme, setTheme])

    return null
}
