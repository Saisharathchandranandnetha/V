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
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
                        <Image src="/branding/v1_icon.png" alt="Antigravity Logo" fill className="object-cover" />
                    </div>
                    <span className="font-display font-bold text-xl tracking-tighter">Antigravity</span>
                </Link>

                {/* Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    {['Features', 'Pricing', 'Roadmap', 'Blog'].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
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
