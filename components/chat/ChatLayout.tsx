import { ChatSidebar } from './ChatSidebar'

// This will be used in the server layout to wrap content
export function ChatLayout({
    children,
    teams
}: {
    children: React.ReactNode
    teams: any[]
}) {
    return (
        <div className="flex h-[calc(100vh-2rem)] rounded-xl border border-border overflow-hidden bg-background/50 backdrop-blur-sm shadow-sm">
            <div className="w-64 hidden md:block">
                <ChatSidebar teams={teams} />
            </div>
            <main className="flex-1 flex flex-col min-w-0 bg-background/30">
                {children}
            </main>
        </div>
    )
}
