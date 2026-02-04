'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MagneticWrapper } from '@/components/ui/magnetic-wrapper'
import { updateSettings } from '@/app/dashboard/settings/actions'

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const cycleTheme = async () => {
        const themes = ['light', 'dark', 'system']
        const currentIndex = themes.indexOf(theme || 'system')
        const nextIndex = (currentIndex + 1) % themes.length
        const nextTheme = themes[nextIndex]

        setTheme(nextTheme)

        // Persist to DB if possible (background sync)
        try {
            await updateSettings({ theme: nextTheme })
        } catch (e) {
            // Silently fail if not in a dashboard context or DB update fails
        }
    }

    return (
        <div className={cn("flex items-center", className)}>
            <MagneticWrapper strength={0.4}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={cycleTheme}
                    className="relative h-10 w-10 rounded-full bg-accent/30 hover:bg-accent/50 group"
                >
                    <AnimatePresence mode="wait">
                        {theme === 'light' && (
                            <motion.div
                                key="sun"
                                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Sun className="h-5 w-5 text-amber-500" />
                            </motion.div>
                        )}
                        {theme === 'dark' && (
                            <motion.div
                                key="moon"
                                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Moon className="h-5 w-5 text-indigo-400" />
                            </motion.div>
                        )}
                        {(theme === 'system' || !theme) && (
                            <motion.div
                                key="monitor"
                                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Monitor className="h-5 w-5 text-muted-foreground" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tooltip hint */}
                    <span className="absolute top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity capitalize">
                        {theme}
                    </span>
                </Button>
            </MagneticWrapper>
        </div>
    )
}
