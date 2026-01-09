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
} from "@/components/ui/sheet"
import { Menu, LogOut, Shield } from 'lucide-react'
import { sidebarNavItems } from '@/components/sidebar'
import { signout } from '@/app/login/actions'
import { SubmitButton } from '@/components/submit-button'

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
                                        onClick={() => setOpen(false)}
                                    >
                                        <Link href={item.href}>
                                            <item.icon className="mr-2 h-4 w-4" />
                                            {item.title}
                                        </Link>
                                    </Button>
                                ))}
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
