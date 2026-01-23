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
    Shield,
    Users,
    ChevronDown,
    MessageSquare,
    Layout
} from 'lucide-react'
import { signout } from '@/app/login/actions'
import { SubmitButton } from '@/components/submit-button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Navigation items for the sidebar
export const sidebarNavItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Teams',
        href: '#',
        icon: Users,
        children: [
            {
                title: 'Teams Dashboard',
                href: '/dashboard/teams',
                icon: Layout,
            },
            {
                title: 'Teams Chat',
                href: '/dashboard/chat',
                icon: MessageSquare,
            }
        ]
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
                        {sidebarNavItems.map((item) => {
                            if (item.children) {
                                // Check if any child is active to open properly (optional, but good UX)
                                const isOpen = item.children.some(child => pathname.startsWith(child.href))
                                return (
                                    <Collapsible key={item.title} defaultOpen={isOpen} className="group/collapsible">
                                        <CollapsibleTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-between font-normal hover:bg-accent hover:text-accent-foreground"
                                            >
                                                <div className="flex items-center">
                                                    <item.icon className="mr-2 h-4 w-4" />
                                                    {item.title}
                                                </div>
                                                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="pl-6 space-y-1 mt-1">
                                                {item.children.map((child) => (
                                                    <Button
                                                        key={child.href}
                                                        variant={pathname === child.href ? 'secondary' : 'ghost'}
                                                        className="w-full justify-start h-8 text-sm"
                                                        asChild
                                                    >
                                                        <Link href={child.href}>
                                                            <child.icon className="mr-2 h-3.5 w-3.5" />
                                                            {child.title}
                                                        </Link>
                                                    </Button>
                                                ))}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )
                            }
                            return (
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
                            )
                        })}
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
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Sign Out</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to sign out?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <form action={signout}>
                                <AlertDialogAction type="submit" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sign Out</AlertDialogAction>
                            </form>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}
