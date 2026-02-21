'use client';

import { motion } from 'framer-motion';

export function ProblemSection() {
    return (
        <section className="py-32 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    viewport={{ once: true }}
                    className="glass-dark border border-white/5 rounded-[3rem] p-12 md:p-20 relative overflow-hidden"
                >
                    {/* Decorative Blur */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 blur-[80px] rounded-full" />

                    <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-12 text-center md:text-left leading-tight">
                        The "Productivity Paradox"
                    </h2>

                    <div className="space-y-8">
                        {[
                            "You have 5 apps for 5 things.",
                            "None of them talk to each other.",
                            "None of them actually help you think."
                        ].map((text, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.2, duration: 0.8 }}
                                viewport={{ once: true }}
                                className="flex items-center gap-6"
                            >
                                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                                    <span className="text-primary font-bold">0{i + 1}</span>
                                </div>
                                <p className="text-xl md:text-2xl text-muted-foreground/80 font-sans tracking-tight">
                                    {text}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        viewport={{ once: true }}
                        className="mt-16 text-lg text-primary/60 font-bold tracking-widest uppercase text-center"
                    >
                        It's time for a Unified Operating System.
                    </motion.p>
                </motion.div>
            </div>
        </section>
    );
}
