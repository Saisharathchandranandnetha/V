'use client'

import { ChatSidebar } from './ChatSidebar'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

// This will be used in the server layout to wrap content
export function ChatLayout({
    children,
    teams
}: {
    children: React.ReactNode
    teams: any[]
}) {
    const [open, setOpen] = useState(false)

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-2rem)] rounded-xl border border-border overflow-hidden bg-background/50 backdrop-blur-sm shadow-sm relative">
            {/* Mobile Sidebar Trigger - Floating Action Button */}
            <div className="md:hidden fixed bottom-6 right-6 z-50">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="default" size="icon" className="h-12 w-12 rounded-full shadow-lg">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-80">
                        <SheetTitle className="sr-only">Chat Menu</SheetTitle>
                        <ChatSidebar teams={teams} onSelect={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
            </div>

            <div className="w-64 hidden md:block border-r border-border bg-card/30">
                <ChatSidebar teams={teams} />
            </div>
            <main className="flex-1 flex flex-col min-w-0 bg-background/30 w-full relative">
                {children}
            </main>
        </div>
    )
}
