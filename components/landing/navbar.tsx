'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

export function LandingNavbar() {
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const unsubscribe = scrollY.on('change', (latest) => {
            setIsScrolled(latest > 50);
        });
        return () => unsubscribe();
    }, [scrollY]);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-4 ${isScrolled ? 'glass-dark py-3' : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between font-sans">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-bl from-violet-600 to-indigo-600 shadow-[0_0_15px_rgba(139,92,246,0.3)] overflow-hidden">
                        <span className="absolute inset-0 bg-white/10" />
                        <span className="text-white font-black text-[17px] tracking-tighter relative z-10 italic">L</span>
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-primary font-black tracking-tight text-xl">LifeOs</span>
                </Link>

                {/* Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    {['Features', 'How It Works', 'Pricing'].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                            className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground/60 hover:text-foreground transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                </div>

                {/* CTAs */}
                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <Button variant="ghost" className="text-xs font-bold tracking-widest uppercase px-6">Login</Button>
                    </Link>
                    <Link href="/signup">
                        <Button className="bg-white text-black hover:bg-white/90 text-xs font-bold tracking-widest uppercase px-6 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </motion.nav>
    );
}
