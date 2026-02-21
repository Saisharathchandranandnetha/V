'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, CheckSquare, Plus, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CinematicMenu } from './cinematic-menu';
import { Button } from '@/components/ui/button';
import { QuickActionsMenu } from './quick-actions-menu';

interface FloatingDockProps {
    user?: any;
    isAdmin?: boolean;
    isTeamOnly?: boolean;
}

export function FloatingDock({ user, isAdmin, isTeamOnly }: FloatingDockProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
    const pathname = usePathname();

    // Only show on mobile
    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] md:hidden w-[90%] max-w-[320px]">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
                    className="flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl "
                >
                    {!isTeamOnly ? (
                        <>
                            <DockItem
                                href="/dashboard"
                                active={pathname === '/dashboard'}
                                icon={<LayoutDashboard className="h-5 w-5" />}
                            />
                            <DockItem
                                href="/dashboard/tasks"
                                active={pathname.startsWith('/dashboard/tasks')}
                                icon={<CheckSquare className="h-5 w-5" />}
                            />
                        </>
                    ) : (
                        <>
                            <DockItem
                                href="/dashboard/teams"
                                active={pathname.startsWith('/dashboard/teams')}
                                icon={<LayoutDashboard className="h-5 w-5" />}
                            />
                            <DockItem
                                href="/dashboard/chat"
                                active={pathname.startsWith('/dashboard/chat')}
                                icon={<CheckSquare className="h-5 w-5" />}
                            />
                        </>
                    )}

                    {/* Central Action Button */}
                    <div className="relative -mt-6 mx-2">
                        <Button
                            size="icon"
                            onClick={() => setIsQuickActionsOpen(true)}
                            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.5)] border-4 border-black/50 overflow-hidden group"
                        >
                            <Plus className="h-6 w-6 text-primary-foreground group-hover:rotate-90 transition-transform duration-300" />
                        </Button>
                    </div>

                    {!isTeamOnly ? (
                        <DockItem
                            href="/dashboard/resources"
                            active={pathname.startsWith('/dashboard/resources')}
                            // Using a generic icon for "Library/Resources" if Library isn't imported, but assuming Lucide has it.
                            // Just using a placeholder styled generic div if icon missing, but standard Lucide icons work.
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-library"><rect width="8" height="18" x="3" y="3" rx="1" /><path d="M7 3v18" /><path d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z" /></svg>
                            }
                        />
                    ) : (
                        <DockItem
                            href="/dashboard/settings"
                            active={pathname.startsWith('/dashboard/settings')}
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                            }
                        />
                    )}

                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(true)}
                        className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-white/60 hover:text-white transition-colors relative z-[100]"
                    >
                        <Menu className="h-5 w-5" />
                        {/* Simple dot for active state if menu is technically 'active' contextually? No need. */}
                    </button>
                </motion.div>
            </div>

            <CinematicMenu
                open={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                user={user}
                isAdmin={isAdmin}
                isTeamOnly={isTeamOnly}
            />
            <QuickActionsMenu open={isQuickActionsOpen} onClose={() => setIsQuickActionsOpen(false)} />
        </>
    );
}

function DockItem({ href, icon, active }: { href: string; icon: React.ReactNode; active: boolean }) {
    return (
        <Link href={href}>
            <div className={cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                active ? "text-primary bg-primary/10" : "text-white/60 hover:text-white hover:bg-white/10"
            )}>
                {icon}
                {active && (
                    <motion.div
                        layoutId="dock-dot"
                        className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                    />
                )}
            </div>
        </Link>
    )
}
