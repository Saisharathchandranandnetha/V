'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface DashboardContentProps {
    children: React.ReactNode
    deviceType?: string | null
}

export function DashboardContent({ children, deviceType }: DashboardContentProps) {
    const pathname = usePathname()
    const isChat = pathname?.startsWith('/dashboard/chat')

    if (isChat) {
        return (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {/* Optional: Show Device Type even in chat? Maybe not to save space, or small at top? 
                     User showed it in screenshot. Let's keep it but ensure it doesn't break flex.
                     Actually, better to hide it for clean chat, or put it in a dismissible way.
                     Screenshot showed it pushing content.
                     If I hide it, it solves space. 
                     I'll render it but compact or just render it. 
                */}
                <div className="md:hidden px-4 py-2 text-xs text-muted-foreground shrink-0">
                    Detected Device: {deviceType}
                </div>
                <div className="hidden md:block mb-0 text-xs text-muted-foreground shrink-0 px-4 pt-2">
                    Detected Device: {deviceType}
                </div>
                {children}
            </div>
        )
    }

    return (
        <ScrollArea className="flex-1 min-h-0">
            <main className="p-6 md:p-8">
                <div className="mb-4 text-xs text-muted-foreground md:hidden">
                    Detected Device: {deviceType}
                </div>
                <div className="hidden md:block mb-4 text-xs text-muted-foreground">
                    Detected Device: {deviceType}
                </div>
                {children}
            </main>
        </ScrollArea>
    )
}
