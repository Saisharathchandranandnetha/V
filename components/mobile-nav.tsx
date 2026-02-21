'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet"
import { Menu, LogOut, Shield, ChevronDown } from 'lucide-react'
import { sidebarNavItems } from '@/lib/nav-config'
import { signout } from '@/app/login/actions'
import { SubmitButton } from '@/components/submit-button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export function MobileNav({ isAdmin }: { isAdmin?: boolean }) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="px-3 py-2">
                            <SheetTitle className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary flex items-center gap-2">
                                <div className="relative h-8 w-8 rounded-sm overflow-hidden">
                                    <Image
                                        src="/logo.png"
                                        alt="V Logo"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                V
                            </SheetTitle>
                            <div className="space-y-1">
                                {sidebarNavItems.map((item) => {
                                    if (item.children) {
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
                                                                onClick={() => setOpen(false)}
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
                                            onClick={() => setOpen(false)}
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="mr-2 h-4 w-4" />
                                                {item.title}
                                            </Link>
                                        </Button>
                                    )
                                })}
                            </div>
                            {isAdmin && (
                                <Button
                                    variant={pathname === '/dashboard/admin' ? 'secondary' : 'ghost'}
                                    className="w-full justify-start"
                                    asChild
                                    onClick={() => setOpen(false)}
                                >
                                    <Link href="/dashboard/admin">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Admin
                                    </Link>
                                </Button>
                            )}
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
            </SheetContent>
        </Sheet>
    )
}
