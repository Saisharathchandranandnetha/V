
import { Sidebar } from '@/components/sidebar'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const userSettings = await getUserSettings()
    const isTeamOnly = userSettings?.role === 'team_only'
    const adminUser = await isAdmin()

    if (isTeamOnly) {
    }


    const headersList = await headers()
    const deviceType = headersList.get('x-device-type')

    return (
        <div className="flex min-h-screen relative">
            {/* Desktop Sidebar - Sticky for root scroll */}
            <aside className="hidden md:block w-64 shrink-0 sticky top-0 h-screen z-40 bg-background/50 backdrop-blur-md">
                <Sidebar isAdmin={adminUser} isTeamOnly={isTeamOnly} className="h-full border-r" />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen relative z-10 min-w-0">
                <ThemeSync userTheme={userSettings?.settings?.theme} userId={user.id} />

                {/* Mobile Header - Cinematic Redesign */}
                <div className="md:hidden flex items-center justify-between p-4 sticky top-0 z-50">
                    <Link href="/dashboard" className="font-display font-bold text-xl tracking-tight text-foreground/90 backdrop-blur-md bg-background/30 rounded-full px-4 py-1.5 border border-white/5 shadow-sm">
                        V
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
