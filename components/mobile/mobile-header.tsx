'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function MobileHeader() {
    const pathname = usePathname()
    // Hide on chat pages
    if (pathname?.startsWith('/dashboard/chat')) return null

    return (
        <div className="md:hidden flex items-center justify-between p-4 sticky top-0 z-50">
            <Link href="/dashboard" className="font-syne font-bold text-xl tracking-tight text-foreground/90 backdrop-blur-md bg-background/30 rounded-full px-4 py-1.5 border border-white/5 shadow-sm">
                V
            </Link>
            <div className="backdrop-blur-md bg-background/30 rounded-full p-1 border border-white/5 shadow-sm">
                <ThemeToggle />
            </div>
        </div>
    )
}
