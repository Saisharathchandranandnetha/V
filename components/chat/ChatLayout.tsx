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
import { usePathname } from 'next/navigation'

// ... (keep logic same if possible, or add usePathname hook)
// Since I need hook, I need to check where to import
// Ah, the file is 'use client', so I can use usePathname.

// This will be used in the server layout to wrap content
export function ChatLayout({
    children,
    teams
}: {
    children: React.ReactNode
    teams: any[]
}) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()
    // Logic: 
    // If pathname is exactly '/dashboard/chat', show Sidebar (on mobile), hide Content (on mobile).
    // If pathname is '/dashboard/chat/xyz', hide Sidebar (on mobile), show Content (on mobile).

    const isRoot = pathname === '/dashboard/chat'

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-2rem)] rounded-xl border border-border overflow-hidden bg-background/50 backdrop-blur-sm shadow-sm relative">
            {/* Mobile Sidebar Trigger - Floating Action Button (Only on root or if we want it everywhere? Usually mostly on root) */}
            {/* Actually, if we are on root, we show sidebar full screen. If we are on chat, we hide sidebar. FAB allows opening sidebar on chat. */}

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

            {/* Sidebar: Hidden on mobile unless isRoot? 
                Actually, ChatSidebar component is used in page.tsx for mobile view.
                So here, we can hide this sidebar on mobile ALWAYS, and let page.tsx handle it?
                BUT page.tsx (TeamChatPage) does NOT have sidebar.
                So `ChatLayout` sidebar is for DESKTOP.
                Mobile Sidebar is handled via:
                1. Index page -> renders ChatSidebar manually.
                2. Detail page -> renders Chat only.
                
                So checking `ChatLayout.tsx` again:
                Line 41: `w-64 hidden md:block` -> This is correct for Desktop Sidebar.
                Line 44: `main ... flex-1` -> This is the content area.
                
                So, the layout ALREADY hides the sidebar on mobile.
                The issue is that `children` (the page content) is always shown.
                
                On `/dashboard/chat` (root):
                - Mobile: `ChatPage` renders `ChatSidebar` (line 12 of `app/dashboard/chat/page.tsx`).
                - Desktop: `ChatPage` renders "Select a Chat" placeholder (line 16).
                
                This works fine?
                
                On `/dashboard/chat/[id]`:
                - Mobile: `TeamChatPage` renders `ChatContainer`. Sidebar is hidden by Layout.
                - Desktop: Sidebar visible (Layout), Content visible.
                
                So the current implementation handles "List vs Detail" correctly via page logic.
                The missing piece is ONLY the "Back" button on detail page.
                
                Wait, replacing the file might be unnecessary if logic is sound.
                Let me re-read `ChatLayout.tsx`.
                Line 41: `hidden md:block`. Yes, strictly hidden on mobile.
                
                So I ONLY need to add Back button to `[teamId]/page.tsx`.
            */}

            <div className="w-64 hidden md:block border-r border-border bg-card/30">
                <ChatSidebar teams={teams} />
            </div>
            <main className="flex-1 flex flex-col min-w-0 bg-background/30 w-full relative">
                {children}
            </main>
        </div>
    )
}
