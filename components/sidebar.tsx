'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard,
    Library,
    BookOpen,
    Route,
    BarChart3,
    Settings,
    LogOut,
    CalendarCheck,
    CheckSquare,
    Target,
    DollarSign,
    StickyNote,
    Folder,
    Shield
} from 'lucide-react'
import { signout } from '@/app/login/actions'
import { SubmitButton } from '@/components/submit-button'

export const sidebarNavItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Habits',
        href: '/dashboard/habits',
        icon: CalendarCheck,
    },
    {
        title: 'Tasks',
        href: '/dashboard/tasks',
        icon: CheckSquare,
    },
    {
        title: 'Goals',
        href: '/dashboard/goals',
        icon: Target,
    },
    {
        title: 'Finances',
        href: '/dashboard/finances',
        icon: DollarSign,
    },
    {
        title: 'Resources',
        href: '/dashboard/resources',
        icon: Library,
    },
    {
        title: 'Categories',
        href: '/dashboard/categories',
        icon: BookOpen,
    },
    {
        title: 'Collections',
        href: '/dashboard/collections',
        icon: Folder, // Using Folder icon for Collections
    },
    {
        title: 'Learning Paths',
        href: '/dashboard/paths',
        icon: Route,
    },
    {
        title: 'Notes',
        href: '/dashboard/notes',
        icon: StickyNote,
    },
    {
        title: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
    },
    {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
    },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    isAdmin?: boolean
}

export function Sidebar({ className, isAdmin }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div className={cn('flex flex-col h-screen border-r bg-sidebar/50 backdrop-blur-md', className)}>
            <div className="flex-1 overflow-y-auto py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary flex items-center gap-2">
                        <div className="relative h-8 w-8 rounded-sm overflow-hidden">
                            <Image
                                src="/logo.png"
                                alt="LifeOS Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        LifeOS
                    </h2>
                    <div className="space-y-1">
                        {sidebarNavItems.map((item) => (
                            <Button
                                key={item.href}
                                variant={pathname === item.href ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={item.href}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                        {isAdmin && (
                            <Button
                                variant={pathname === '/dashboard/admin' ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href="/dashboard/admin">
                                    <Shield className="mr-2 h-4 w-4" />
                                    Admin
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-4 border-t">
                <form action={signout}>
                    <SubmitButton variant="outline" className="w-full justify-start" formAction={signout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </SubmitButton>
                </form>
            </div>
        </div>
    )
}
