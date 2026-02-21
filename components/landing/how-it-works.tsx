'use client';

import { motion } from 'framer-motion';

const steps = [
    {
        number: "01",
        title: "Connect your life",
        description: "Add your tasks, habits and goals in seconds. Our system auto-links dependencies."
    },
    {
        number: "02",
        title: "Talk to your AI",
        description: "Tell it what you need — from rescheduling a sprint to logging a habit — it handles the rest."
    },
    {
        number: "03",
        title: "Track everything",
        description: "Watch your progress across every area of life with professional-grade analytics."
    }
];

export function HowItWorks() {
    return (
        <section className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted-foreground/40 mb-4">The Process</p>
                    <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight">Three Steps to Mastery.</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-16 relative">
                    {/* Connection Line (Desktop) */}
                    <div className="hidden md:block absolute top-24 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.2, duration: 0.8 }}
                            viewport={{ once: true }}
                            className="flex flex-col items-center text-center relative z-10"
                        >
                            <div className="w-20 h-20 rounded-full glass-dark border border-white/10 flex items-center justify-center mb-8 shadow-xl text-primary font-display font-bold text-2xl group transition-transform hover:scale-110">
                                {step.number}
                            </div>
                            <h3 className="text-2xl font-display font-bold tracking-tight mb-4">{step.title}</h3>
                            <p className="text-muted-foreground/60 leading-relaxed font-sans max-w-xs">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
