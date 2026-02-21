'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function FinalCTA() {
    return (
        <section className="py-40 px-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[130px] rounded-full pointer-events-none opacity-40" />

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl md:text-7xl font-display font-bold tracking-tighter mb-8 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                        Start building your better life today.
                    </h2>

                    <p className="text-muted-foreground/60 text-lg md:text-xl mb-12 font-sans max-w-2xl mx-auto">
                        Join 2,000+ executives and builders mastering their productivity with the Onyx Operating System.
                    </p>

                    <div className="flex flex-col items-center gap-6">
                        <Link href="/signup">
                            <Button size="lg" className="h-16 px-12 text-xs font-bold tracking-[0.2em] uppercase bg-white text-black hover:bg-white/90 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                                Create Free Account →
                            </Button>
                        </Link>

                        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/40">
                            No credit card required · Set up in 2 minutes
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
