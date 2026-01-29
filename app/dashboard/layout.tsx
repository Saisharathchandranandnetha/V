
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getUserSettings } from '@/app/dashboard/settings/actions'
import { ThemeSync } from '@/components/theme-sync'
import { ScrollArea } from '@/components/ui/scroll-area'

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

                <ScrollArea className="flex-1 min-h-0">
                    <main className="p-6 md:p-8">
                        <div className="mb-4 text-xs text-muted-foreground md:hidden">
                            Detected Device: {deviceType}
                        </div>
                        <div className="hidden md:block mb-4 text-xs text-muted-foreground">
                            Detected Device: {deviceType}
                        </div>
                        {children}
                    </main>
                </ScrollArea>
            </div>
        </div>
    )
}
