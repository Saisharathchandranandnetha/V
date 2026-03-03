
import { Sidebar } from '@/components/sidebar'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getUserSettings, isAdmin } from '@/app/dashboard/settings/actions'
import { ThemeSync } from '@/components/theme-sync'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DashboardContent } from '@/components/dashboard-content'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { FloatingDock } from '@/components/mobile/floating-dock'
import { AIAssistant } from '@/components/ai-assistant/ai-assistant'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const userSettings = await getUserSettings()
    const isTeamOnly = userSettings?.role === 'team_only'
    const adminUser = await isAdmin()

    const headersList = await headers()
    const deviceType = headersList.get('x-device-type')

    // Shape user to match what components expect
    const user = {
        id: session.user.id!,
        email: session.user.email!,
        name: session.user.name ?? '',
        image: session.user.image ?? '',
        user_metadata: { full_name: session.user.name, avatar_url: session.user.image },
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar - Fixed Full Height */}
            <aside className="hidden md:flex w-[260px] shrink-0 fixed inset-y-0 z-40 bg-sidebar border-r border-white/10">
                <Sidebar isAdmin={adminUser} isTeamOnly={isTeamOnly} className="w-full border-none" />
            </aside>

            {/* Main Content Area - Offset by sidebar width */}
            <div className="flex-1 flex flex-col min-h-screen relative z-10 md:pl-[260px]">
                <ThemeSync userTheme={(userSettings?.settings as any)?.theme as string | undefined} userId={user.id} />

                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 sticky top-0 z-50">
                    <Link href="/dashboard" className="font-display font-bold text-xl tracking-tight text-foreground/90 backdrop-blur-md bg-background/30 rounded-full px-4 py-1.5 border border-white/5 shadow-sm flex items-center gap-2">
                        V
                        <span className="flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                            </span>
                            <span className="text-[9px] font-bold tracking-widest uppercase text-primary/70">Beta</span>
                        </span>
                    </Link>
                    <div className="backdrop-blur-md bg-background/30 rounded-full p-1 border border-white/5 shadow-sm">
                        <ThemeToggle />
                    </div>
                </div>

                {/* New Floating Dock for Mobile */}
                <FloatingDock user={user} isAdmin={adminUser} isTeamOnly={isTeamOnly} />

                <DashboardContent deviceType={deviceType} isTeamOnly={isTeamOnly}>
                    {children}
                </DashboardContent>
            </div>

            {/* AI Assistant — floats over all dashboard pages */}
            <AIAssistant />
        </div>
    )
}
