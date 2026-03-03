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
    Layout,
    Map as MapIcon
} from 'lucide-react'
import { signOut } from 'next-auth/react'
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
import { MagneticWrapper } from '@/components/ui/magnetic-wrapper'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ScrollArea } from '@/components/ui/scroll-area'

import { sidebarNavItems } from '@/lib/nav-config'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    isAdmin?: boolean
    isTeamOnly?: boolean
}

export function Sidebar({ className, isAdmin, isTeamOnly }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div className={cn(
            'group flex flex-col h-[calc(100vh-2rem)] m-4 rounded-2xl border border-white/10 dark:border-white/5 bg-white/10 dark:bg-black/20 backdrop-blur-xl shadow-2xl transition-all duration-500 ease-out hover:bg-white/20 hover:dark:bg-black/30',
            className
        )}>
            <ScrollArea className="flex-1 pr-1">
                <div className="px-3 py-2">
                    <Link href="/dashboard" prefetch={false} className="block mb-6 px-4 hover:opacity-80 transition-opacity">
                        <h2 className="flex items-center gap-3">
                            <div className="relative shrink-0 flex items-center justify-center h-10 w-10 overflow-visible">
                                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* Right arm (Green) */}
                                    <path d="M48 85 L85 15 L68 15 L40 68 Z" fill="#4ade80" />
                                    {/* Left arm (Blue Arrow Body) */}
                                    <path d="M48 85 C35 75 25 55 18 35 L32 30 C38 48 44 65 48 85 Z" fill="#3b82f6" />
                                    {/* Arrow Head */}
                                    <polygon points="10,40 30,15 42,35" fill="#3b82f6" />
                                    {/* Stopwatch inner icon */}
                                    <circle cx="62" cy="40" r="6" stroke="#166534" strokeWidth="2" fill="none" className="opacity-80" />
                                    <path d="M62 37 L62 40 L64 42 M59 33 L65 33 M67 35 L69 33" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80" />
                                </svg>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[14px] font-black tracking-widest text-foreground uppercase leading-none drop-shadow-sm font-syne">LifeOS</span>
                                <span className="flex items-center gap-1.5 mt-1">
                                    <span className="relative flex h-2 w-2 shadow-[0_0_8px_oklch(var(--primary))] rounded-full">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                    </span>
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase leading-none">BETA</span>
                                </span>
                            </div>
                        </h2>
                    </Link>
                    <div className="space-y-1">
                        {sidebarNavItems.filter(item => {
                            if (isTeamOnly) return ['Teams', 'Settings'].includes(item.title)
                            return true
                        }).map((item) => {
                            if (item.children) {
                                // Check if any child is active to open properly (optional, but good UX)
                                const isOpen = typeof window !== 'undefined' ? item.children.some(child => pathname.startsWith(child.href)) : false
                                return (
                                    <Collapsible key={item.title} defaultOpen={isOpen} className="group/collapsible">
                                        <CollapsibleTrigger asChild>
                                            <div className="w-full">
                                                <MagneticWrapper strength={0.3}>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-between font-normal hover:bg-accent/50 hover:text-accent-foreground"
                                                    >
                                                        <div className="flex items-center">
                                                            <item.icon className="mr-2 h-4 w-4" />
                                                            {item.title}
                                                        </div>
                                                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                                    </Button>
                                                </MagneticWrapper>
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="pl-6 space-y-1 mt-1 border-l ml-3 border-border/50">
                                                {item.children.map((child) => (
                                                    <MagneticWrapper key={child.href} strength={0.25}>
                                                        <Button
                                                            variant={pathname === child.href ? 'secondary' : 'ghost'}
                                                            className={cn(
                                                                "w-full justify-start h-8 text-sm",
                                                                pathname === child.href && "bg-primary/10 text-primary font-medium"
                                                            )}
                                                            asChild
                                                        >
                                                            <Link href={child.href} prefetch={false}>
                                                                <child.icon className="mr-2 h-3.5 w-3.5" />
                                                                {child.title}
                                                            </Link>
                                                        </Button>
                                                    </MagneticWrapper>
                                                ))}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )
                            }
                            return (
                                <MagneticWrapper key={item.href} strength={0.25}>
                                    <Button
                                        variant={pathname === item.href ? 'secondary' : 'ghost'}
                                        className={cn(
                                            "w-full justify-start",
                                            pathname === item.href && "bg-primary/10 text-primary font-medium shadow-sm"
                                        )}
                                        asChild
                                    >
                                        <Link href={item.href} prefetch={false}>
                                            <item.icon className="mr-2 h-4 w-4" />
                                            {item.title}
                                        </Link>
                                    </Button>
                                </MagneticWrapper>
                            )
                        })}
                        {isAdmin && (
                            <Button
                                variant={pathname === '/dashboard/admin' ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href="/dashboard/admin" prefetch={false}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Admin
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/10 dark:border-white/5 flex items-center gap-2 rounded-b-xl">
                <ThemeToggle />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="flex-1 justify-start border-red-200/20 hover:bg-red-500/10 hover:text-red-600">
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
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => signOut({ callbackUrl: '/login' })}
                            >
                                Sign Out
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}
