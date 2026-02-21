'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MagneticText } from '@/components/ui/magnetic-text';
import { Play } from 'lucide-react';
import Image from 'next/image';

export function LandingHero() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-40 animate-pulse" />

            <div className="max-w-5xl mx-auto text-center z-10">
                {/* Confidence Line */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex justify-center mb-10"
                >
                    <div className="px-4 py-2 rounded-full glass-dark border border-white/10 flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-5 h-5 rounded-full border border-background bg-zinc-800 flex items-center justify-center overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-tr from-zinc-700 to-zinc-500" />
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/80">
                            Loved by <span className="text-foreground">2,000+</span> executive builders
                        </span>
                    </div>
                </motion.div>

                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <MagneticText>
                        <h1 className="text-6xl md:text-8xl font-display font-bold tracking-[-0.05em] leading-[0.9] mb-8">
                            Your Entire Life.<br /> <span className="text-primary italic">One OS.</span>
                        </h1>
                    </MagneticText>
                </motion.div>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 1 }}
                    className="text-lg md:text-xl text-muted-foreground/60 max-w-2xl mx-auto mb-12 font-sans tracking-tight leading-relaxed"
                >
                    Track tasks, habits, goals and finances — with enlightened AI that actually takes action for you.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <Button size="lg" className="h-14 px-10 text-xs font-bold tracking-widest uppercase bg-white text-black hover:bg-white/90 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                        Start for Free →
                    </Button>
                    <Button size="lg" variant="outline" className="h-14 px-10 text-xs font-bold tracking-widest uppercase rounded-full border-white/10 backdrop-blur-md bg-white/5 hover:bg-white/10 gap-3 group">
                        <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                        Watch Demo
                    </Button>
                </motion.div>

                {/* Hero Visual Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
                    className="mt-24 relative w-full aspect-[16/9] rounded-t-[2.5rem] overflow-hidden border-t border-x border-white/10 glass-dark shadow-[0_-20px_80px_rgba(0,0,0,0.5)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                    {/* Placeholder for actual product screenshot/video */}
                    <div className="absolute inset-0 bg-zinc-900/40 flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
                        <span className="text-zinc-700 font-display font-bold text-4xl opacity-20">ONYX ENGINE INTERFACE</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
