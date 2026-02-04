
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getUserSettings } from '@/app/dashboard/settings/actions'
import { ThemeSync } from '@/components/theme-sync'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DashboardContent } from '@/components/dashboard-content'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const userSettings = await getUserSettings()

    const headersList = await headers()
    const deviceType = headersList.get('x-device-type')

    return (
        <div className="flex min-h-screen relative">
            {/* Desktop Sidebar - Sticky for root scroll */}
            <aside className="hidden md:block w-64 shrink-0 sticky top-0 h-screen z-40 bg-background/50 backdrop-blur-md">
                <Sidebar isAdmin={user.email === process.env.ADMIN_EMAIL} className="h-full border-r" />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen relative z-10">
                <ThemeSync userTheme={userSettings?.settings?.theme} userId={user.id} />

                {/* Mobile Header */}
                <div className="md:hidden border-b p-4 flex items-center justify-between bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                    <span className="font-semibold text-primary">LifeOS ({deviceType})</span>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <MobileNav isAdmin={user.email === process.env.ADMIN_EMAIL} />
                    </div>
                </div>

                <DashboardContent deviceType={deviceType}>
                    {children}
                </DashboardContent>
            </div>
        </div>
    )
}
