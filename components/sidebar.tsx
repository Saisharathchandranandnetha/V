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
            'group flex flex-col h-[calc(100vh-2rem)] m-4 rounded-2xl border border-white/10 bg-sidebar/60 backdrop-blur-2xl shadow-2xl transition-all duration-500 ease-out hover:bg-sidebar/80 hover:shadow-primary/5 hover:border-sidebar-border/50',
            className
        )}>
            <ScrollArea className="flex-1 pr-1">
                <div className="px-3 py-2">
                    <Link href="/dashboard" className="block mb-6 px-4 hover:opacity-80 transition-opacity">
                        <h2 className="text-xl font-bold tracking-tighter text-primary flex items-center gap-3">
                            <div className="relative h-9 w-9 rounded-lg overflow-hidden shadow-sm">
                                <Image
                                    src="/logo.png"
                                    alt="V Logo"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            V
                        </h2>
                    </Link>
                    <div className="space-y-1">
                        {sidebarNavItems.filter(item => {
                            if (isTeamOnly) {
                                return ['Teams', 'Settings'].includes(item.title)
                            }
                            return true
                        }).map((item) => {
                            if (item.children) {
                                // Check if any child is active to open properly (optional, but good UX)
                                const isOpen = item.children.some(child => pathname.startsWith(child.href))
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
                                                            <Link href={child.href}>
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
                                        <Link href={item.href}>
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
                                <Link href="/dashboard/admin">
                                    <Shield className="mr-2 h-4 w-4" />
                                    Admin
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </ScrollArea>
            <div className="p-4 border-t/50 flex items-center gap-2 bg-background/20 backdrop-blur-md rounded-b-xl">
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
