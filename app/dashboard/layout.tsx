
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Desktop Sidebar */}
            <Sidebar className="hidden md:block w-64 shrink-0" />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
                {/* Mobile Header */}
                <div className="md:hidden border-b p-4 flex items-center justify-between bg-background sticky top-0 z-10">
                    <span className="font-semibold">LifeOS</span>
                    <MobileNav />
                </div>

                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
