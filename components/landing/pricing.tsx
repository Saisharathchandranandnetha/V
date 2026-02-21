'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const plans = [
    {
        name: "Free",
        price: "$0",
        description: "Perfect for personal growth.",
        features: ["Unlimited Tasks", "Core Habits", "Basic Goals", "Community Support"],
        cta: "Get Started",
        highlight: false
    },
    {
        name: "Pro",
        price: "$12",
        period: "/mo",
        description: "The executive experience.",
        features: ["Everything in Free", "Onyx AI Agent", "Advanced Analytics", "Priority Execution"],
        cta: "Start Trial",
        highlight: true
    },
    {
        name: "Teams",
        price: "$29",
        period: "/mo",
        description: "Scale your collective mind.",
        features: ["Everything in Pro", "Team Collaboration", "Global Roadmaps", "Admin Dashboard"],
        cta: "Contact Us",
        highlight: false
    }
];

export function PricingSection() {
    return (
        <section id="pricing" className="py-32 px-6 bg-zinc-950/20">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-primary mb-4">Investment</p>
                    <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight">Transparent Pricing.</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.8 }}
                            viewport={{ once: true }}
                            className={`relative glass-dark border ${plan.highlight ? 'border-primary/50 ring-1 ring-primary/20' : 'border-white/5'} p-10 rounded-[2.5rem] flex flex-col`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-black text-[10px] font-bold tracking-widest uppercase rounded-full">
                                    Recommended
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-display font-bold tracking-tight mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl md:text-5xl font-display font-bold tracking-tighter">{plan.price}</span>
                                    {plan.period && <span className="text-muted-foreground/40 text-lg font-sans">{plan.period}</span>}
                                </div>
                                <p className="text-muted-foreground/60 text-sm mt-4">{plan.description}</p>
                            </div>

                            <div className="flex-1 space-y-4 mb-10">
                                {plan.features.map((f, j) => (
                                    <div key={j} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <Check className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="text-sm text-muted-foreground/80 font-sans tracking-tight">{f}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                className={`w-full h-12 rounded-xl text-xs font-bold tracking-widest uppercase transition-all ${plan.highlight
                                        ? 'bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.3)]'
                                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                    }`}
                            >
                                {plan.cta}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
