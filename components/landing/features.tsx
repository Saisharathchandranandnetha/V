'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Zap, BarChart3, ShieldCheck } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import Image from 'next/image';

const features = [
    {
        title: "AI that creates tasks by just talking",
        benefit: "Zero-Friction Interface",
        description: "Stop fiddling with IDs. Tell Antigravity what you need, and the Onyx engine handles the data layer execution.",
        icon: MessageSquare,
        color: "text-blue-400",
        bg: "bg-blue-400/5"
    },
    {
        title: "Never break your streak again",
        benefit: "Momentum Engineering",
        description: "Intelligent habit tracking with physically weighted momentum ensures your consistency is permanent.",
        icon: Zap,
        color: "text-amber-400",
        bg: "bg-amber-400/5"
    },
    {
        title: "See exactly where your time goes",
        benefit: "Total Transparency",
        description: "Professional-grade analytics visualizing your progress across tasks, habits, and financial movements.",
        icon: BarChart3,
        color: "text-primary",
        bg: "bg-primary/5"
    }
];

export function FeaturesSection() {
    return (
        <section id="features" className="py-32 px-6 bg-zinc-950/20">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-primary mb-4">Core Capabilities</p>
                    <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight">Engineered for Results.</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <SpotlightCard className="h-full glass-dark border-white/5 p-10 flex flex-col items-start text-left hover:border-white/10 transition-colors">
                                <div className={`p-4 rounded-2xl ${feature.bg} ${feature.color} mb-8 border border-white/5`}>
                                    <feature.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/40 mb-3">{feature.benefit}</h3>
                                <h4 className="text-2xl font-display font-bold tracking-tight mb-4 leading-snug">{feature.title}</h4>
                                <p className="text-muted-foreground/60 leading-relaxed font-sans">{feature.description}</p>
                            </SpotlightCard>
                        </motion.div>
                    ))}
                </div>

                {/* Secondary Feature Highlight */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 1 }}
                    viewport={{ once: true }}
                    className="mt-12 group"
                >
                    <div className="relative glass-dark border border-primary/20 rounded-[2.5rem] p-12 overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                            <div className="max-w-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-primary">Enterprise Grade</span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-6">Security & RLS Sovereignty</h3>
                                <p className="text-muted-foreground/60 leading-relaxed">Your data is governed by hardened Row Level Security. We never sell your life metrics. Your OS is truly personal.</p>
                            </div>
                            <div className="w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative group/img">
                                <Image
                                    src="/landing/security-visual.png"
                                    alt="Security & RLS Sovereignty Visualization"
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover/img:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
