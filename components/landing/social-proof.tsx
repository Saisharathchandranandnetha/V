'use client';

import { motion } from 'framer-motion';

export function SocialProofBar() {
    return (
        <section className="py-20 border-y border-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    viewport={{ once: true }}
                    className="flex flex-col md:flex-row items-center justify-between gap-12"
                >
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground/40 mb-2">Featured In</p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-12 opacity-30 grayscale contrast-[1.5]">
                            <span className="font-display font-bold text-2xl tracking-tighter">ProductHunt</span>
                            <span className="font-display font-bold text-2xl tracking-tighter">YC</span>
                            <span className="font-display font-bold text-2xl tracking-tighter">TechCrunch</span>
                        </div>
                    </div>

                    <div className="h-px w-20 bg-white/5 md:h-12 md:w-px" />

                    <div className="flex gap-16 text-center">
                        <div>
                            <div className="text-3xl font-display font-bold tracking-tighter">2,000+</div>
                            <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/50 mt-1">Users</div>
                        </div>
                        <div>
                            <div className="text-3xl font-display font-bold tracking-tighter">50K+</div>
                            <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/50 mt-1">Actions</div>
                        </div>
                        <div>
                            <div className="text-3xl font-display font-bold tracking-tighter">4.9★</div>
                            <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/50 mt-1">Rating</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
