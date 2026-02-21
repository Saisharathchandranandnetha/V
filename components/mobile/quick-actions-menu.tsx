'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    FileText, CheckSquare, Zap, CreditCard, Target,
    Folder, Layers, Map, GraduationCap, StickyNote, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface QuickActionsMenuProps {
    open: boolean;
    onClose: () => void;
}

const actions = [
    { label: 'Add Resource', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', href: '/dashboard/resources?add=true' },
    { label: 'Add Task', icon: CheckSquare, color: 'text-green-400', bg: 'bg-green-500/10', href: '/dashboard/tasks?add=true' },
    { label: 'Add Habit', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', href: '/dashboard/habits?add=true' },
    { label: 'Add Transaction', icon: CreditCard, color: 'text-rose-400', bg: 'bg-rose-500/10', href: '/dashboard/finances?add=true' },
    { label: 'Add Goal', icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10', href: '/dashboard/goals?add=true' },
    { label: 'Add Category', icon: Folder, color: 'text-indigo-400', bg: 'bg-indigo-500/10', href: '/dashboard/categories?add=true' },
    { label: 'Add Collection', icon: Layers, color: 'text-cyan-400', bg: 'bg-cyan-500/10', href: '/dashboard/collections?add=true' },
    { label: 'Add Learning Path', icon: Map, color: 'text-teal-400', bg: 'bg-teal-500/10', href: '/dashboard/paths?add=true' },
    { label: 'Add Roadmap', icon: GraduationCap, color: 'text-orange-400', bg: 'bg-orange-500/10', href: '/dashboard/roadmaps?add=true' },
    { label: 'Add Note', icon: StickyNote, color: 'text-yellow-400', bg: 'bg-yellow-500/10', href: '/dashboard/notes?add=true' },
];

export function QuickActionsMenu({ open, onClose }: QuickActionsMenuProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [open]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[101] bg-background/95 backdrop-blur-xl border-t border-white/10 rounded-t-[2rem] p-6 pb-12 max-h-[85vh] overflow-y-auto"
                    >
                        {/* Handle bar */}
                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-8 opacity-50" />

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold font-display">Quick Add</h2>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {actions.map((action, i) => (
                                <Link key={action.label} href={action.href} onClick={onClose}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="flex flex-col items-center p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-white/5 active:scale-95 transition-all text-center gap-3 relative overflow-hidden group cursor-pointer"
                                    >
                                        <div className={cn("p-3 rounded-full mb-1 transition-colors", action.bg, action.color)}>
                                            <action.icon className="h-6 w-6" />
                                        </div>
                                        <span className="font-medium text-sm text-foreground/90">{action.label}</span>

                                        {/* Hover Glow */}
                                        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-tr from-transparent to-white/5 pointer-events-none")} />
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
