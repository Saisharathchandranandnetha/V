'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
    {
        quote: "Antigravity replaced 4 apps for me. I haven't missed a habit in 3 weeks. The Onyx engine is incredibly precise.",
        author: "Arjun S.",
        role: "Software Engineer",
        rating: 5
    },
    {
        quote: "The unified view of my finances and tasks is a game changer. It's the first OS that actually feels professional.",
        author: "Sarah L.",
        role: "Product Designer",
        rating: 5
    },
    {
        quote: "Handled my entire team's roadmap transition in one afternoon with the AI agent. Absolutely elite support.",
        author: "Marcus K.",
        role: "Tech Lead",
        rating: 5
    }
];

export function Testimonials() {
    return (
        <section className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted-foreground/40 mb-4">Social Proof</p>
                    <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight">Trusted by Builders.</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1, duration: 0.8 }}
                            viewport={{ once: true }}
                            className="glass-dark border border-white/5 p-10 rounded-[2rem] flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex gap-1 mb-8">
                                    {[...Array(t.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                    ))}
                                </div>
                                <p className="text-xl font-sans text-muted-foreground/80 leading-relaxed italic mb-12">
                                    "{t.quote}"
                                </p>
                            </div>
                            <div className="flex items-center gap-4 border-t border-white/5 pt-8">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-tr from-zinc-700 to-zinc-600" />
                                </div>
                                <div>
                                    <div className="font-display font-bold tracking-tight">{t.author}</div>
                                    <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/40">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
