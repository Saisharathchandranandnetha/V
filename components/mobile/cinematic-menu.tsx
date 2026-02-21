import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { sidebarNavItems } from '@/lib/nav-config';
import { X, ChevronDown, LogOut, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signout } from '@/app/login/actions';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription
} from '@/components/ui/drawer';

interface CinematicMenuProps {
    open: boolean;
    onClose: () => void;
    user?: any;
    isAdmin?: boolean;
    isTeamOnly?: boolean;
}

export function CinematicMenu({ open, onClose, user, isAdmin, isTeamOnly }: CinematicMenuProps) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [open]);

    if (!mounted) return null;

    return (
        <Drawer open={open} onOpenChange={(val) => !val && onClose()}>
            <DrawerContent className="h-[90vh] flex flex-col rounded-t-[10px] bg-background">
                <DrawerHeader className="px-6 flex flex-row items-center justify-between space-y-0 shrink-0 mb-2 pt-8">
                    <DrawerTitle className="text-xl font-display font-bold tracking-tight">Menu</DrawerTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-black/5 -mr-2">
                        <X className="h-5 w-5 opacity-70" />
                    </Button>
                </DrawerHeader>

                <div
                    data-vaul-no-drag
                    className="flex-1 overflow-y-auto px-4 pb-10 min-h-0"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="space-y-1">
                        {sidebarNavItems.filter(item => {
                            if (isTeamOnly) {
                                return ['Teams', 'Settings'].includes(item.title)
                            }
                            return true
                        }).map((item, i) => (
                            <MenuItem key={item.href} item={item} pathname={pathname} />
                        ))}

                        {isAdmin && (
                            <Button
                                asChild
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start h-12 text-base font-normal mt-2",
                                    pathname === '/dashboard/admin' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                )}
                            >
                                <Link href="/dashboard/admin">
                                    <Shield className="mr-3 h-5 w-5" />
                                    Admin Dashboard
                                </Link>
                            </Button>
                        )}

                        <div className="my-4 border-t border-border/40" />

                        <form action={signout}>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-red-500 hover:bg-red-500/10 hover:text-red-500 h-12 text-base font-normal"
                                type="submit"
                            >
                                <LogOut className="mr-3 h-5 w-5" />
                                Sign Out
                            </Button>
                        </form>

                        <div className="h-10" />
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function MenuItem({ item, pathname }: { item: any; pathname: string }) {
    const isActive = pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const isChildActive = hasChildren && item.children.some((child: any) => pathname.startsWith(child.href));
    const [isOpen, setIsOpen] = useState(isChildActive);

    if (hasChildren) {
        return (
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-between h-12 text-base font-normal group",
                            (isActive || isChildActive) ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <div className="flex items-center">
                            <item.icon className={cn("mr-3 h-5 w-5", (isActive || isChildActive) ? "text-primary" : "text-muted-foreground/70")} />
                            {item.title}
                        </div>
                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1">
                    {item.children.map((child: any) => (
                        <Button
                            key={child.href}
                            variant="ghost"
                            asChild
                            className={cn(
                                "w-full justify-start h-10 text-sm font-normal",
                                pathname === child.href ? "text-primary bg-primary/10" : "text-muted-foreground/80 hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            <Link href={child.href}>
                                <child.icon className="mr-3 h-4 w-4" />
                                {child.title}
                            </Link>
                        </Button>
                    ))}
                </CollapsibleContent>
            </Collapsible>
        );
    }

    return (
        <Button
            variant="ghost"
            asChild
            className={cn(
                "w-full justify-start h-12 text-base font-normal",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
        >
            <Link href={item.href}>
                <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground/70")} />
                {item.title}
            </Link>
        </Button>
    );
}
