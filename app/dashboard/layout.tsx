
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getUserSettings } from '@/app/dashboard/settings/actions'
import { ThemeSync } from '@/components/theme-sync'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DashboardContent } from '@/components/dashboard-content'

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
        <div className="flex h-screen overflow-hidden">
            {/* Desktop Sidebar */}
            <Sidebar isAdmin={user.email === process.env.ADMIN_EMAIL} className="hidden md:block w-64 shrink-0" />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent">
                <ThemeSync userTheme={userSettings?.settings?.theme} userId={user.id} />
                {/* Mobile Header */}
                <div className="md:hidden border-b p-4 flex items-center justify-between bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                    <span className="font-semibold">LifeOS ({deviceType})</span>
                    <MobileNav isAdmin={user.email === process.env.ADMIN_EMAIL} />
                </div>

                <DashboardContent deviceType={deviceType}>
                    {children}
                </DashboardContent>
            </div>
        </div>
    )
}
