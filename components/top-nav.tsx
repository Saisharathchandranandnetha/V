'use client'

import { Bell, Search } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserNav } from '@/components/user-nav'

export function TopNav({ user }: { user: any }) {
    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/5 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Left side Search */}
            <div className="flex flex-1 items-center gap-4 hidden md:flex">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search workspace..."
                        className="h-9 w-full rounded-md border border-white/10 bg-sidebar/50 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border border-white/10 bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex text-muted-foreground">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>
            </div>

            {/* Right side Actions */}
            <div className="flex items-center gap-4 ml-auto">
                <button className="relative p-2 text-muted-foreground hover:bg-white/5 rounded-full transition-colors">
                    <Bell className="h-4 w-4" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                </button>
                <ThemeToggle />
                <div className="h-5 border-l border-white/10 mx-1" />
                <UserNav user={user} />
            </div>
        </header>
    )
}
