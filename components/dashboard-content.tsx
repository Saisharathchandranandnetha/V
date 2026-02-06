'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface DashboardContentProps {
    children: React.ReactNode
    deviceType?: string | null
}

import { AnimatePresence, motion } from 'framer-motion'
import { GridBreakingOverlay } from './ui/grid-breaking-overlay'

export function DashboardContent({ children, deviceType }: DashboardContentProps) {
    const pathname = usePathname()
    const isChat = pathname?.startsWith('/dashboard/chat')

    const transitionProps = {
        initial: { opacity: 0, y: 10, scale: 0.99 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.99 },
        transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as any }
    }

    if (isChat) {
        return (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                <GridBreakingOverlay />
                <div className="md:hidden px-4 py-2 text-xs text-muted-foreground shrink-0 select-none">
                    Detected Device: {deviceType}
                </div>
                <div className="hidden md:block mb-0 text-xs text-muted-foreground shrink-0 px-4 pt-2 select-none">
                    Detected Device: {deviceType}
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        {...transitionProps}
                        className="flex-1 flex flex-col min-h-0"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </div>
        )
    }

    return (
        <div className="flex-1 min-h-0 relative">
            <GridBreakingOverlay />
            <main className="p-4 md:p-8 relative z-10 w-full max-w-[1600px] mx-auto">
                <div className="mb-4 text-xs text-muted-foreground md:hidden select-none">
                    Detected Device: {deviceType}
                </div>
                <div className="hidden md:block mb-4 text-xs text-muted-foreground select-none">
                    Detected Device: {deviceType}
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        {...transitionProps}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    )
}
