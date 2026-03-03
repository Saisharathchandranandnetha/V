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
            <Link href="/dashboard" className="flex items-center gap-2 backdrop-blur-md bg-background/30 rounded-full pl-2 pr-4 py-1.5 border border-white/5 shadow-sm hover:opacity-80 transition-opacity">
                <div className="relative shrink-0 flex items-center justify-center h-6 w-6 overflow-visible">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Right arm (Green) */}
                        <path d="M48 85 L85 15 L68 15 L40 68 Z" fill="#4ade80" />
                        {/* Left arm (Blue Arrow Body) */}
                        <path d="M48 85 C35 75 25 55 18 35 L32 30 C38 48 44 65 48 85 Z" fill="#3b82f6" />
                        {/* Arrow Head */}
                        <polygon points="10,40 30,15 42,35" fill="#3b82f6" />
                        {/* Stopwatch inner icon */}
                        <circle cx="62" cy="40" r="6" stroke="#166534" strokeWidth="2" fill="none" className="opacity-80" />
                        <path d="M62 37 L62 40 L64 42 M59 33 L65 33 M67 35 L69 33" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80" />
                    </svg>
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-black tracking-widest text-foreground uppercase leading-none drop-shadow-sm font-syne">LifeOs</span>
                    <span className="flex items-center gap-1 mt-0.5">
                        <span className="relative flex h-1.5 w-1.5 shadow-[0_0_6px_oklch(var(--primary))] rounded-full">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                        </span>
                        <span className="text-[7px] font-bold tracking-[0.2em] text-primary uppercase leading-none">BETA</span>
                    </span>
                </div>
            </Link>
            <div className="backdrop-blur-md bg-background/30 rounded-full p-1 border border-white/5 shadow-sm">
                <ThemeToggle />
            </div>
        </div>
    )
}
