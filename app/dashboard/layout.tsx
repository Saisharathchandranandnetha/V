
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
import { MobileHeader } from '@/components/mobile/mobile-header'
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
        <div className="flex min-h-screen relative">
            {/* Desktop Sidebar - Fixed Position */}
            <aside className="hidden md:block w-64 fixed top-0 left-0 h-screen z-40 bg-transparent border-none">
                <Sidebar isAdmin={adminUser} isTeamOnly={isTeamOnly} className="h-full" />
            </aside>

            {/* Main Content Area - Padded to respect fixed sidebar */}
            <div className="flex-1 flex flex-col min-h-screen relative z-10 min-w-0 md:pl-64">
                <ThemeSync userTheme={(userSettings?.settings as any)?.theme as string | undefined} userId={user.id} />

                {/* Mobile Header - Cinematic Redesign */}
                <MobileHeader />

                {/* New Floating Dock for Mobile */}
                <FloatingDock user={user} isAdmin={adminUser} />

                <DashboardContent deviceType={deviceType} isTeamOnly={isTeamOnly}>
                    {children}
                </DashboardContent>
            </div>

            {/* AI Assistant — floats over all dashboard pages */}
            <AIAssistant />
        </div>
    )
}
