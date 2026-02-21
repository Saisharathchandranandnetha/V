'use client';

import Link from 'next/link';
import Image from 'next/image';

export function LandingFooter() {
    return (
        <footer className="py-20 px-6 border-t border-white/5 bg-zinc-950/50">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
                {/* Brand Section */}
                <div className="col-span-2 lg:col-span-2">
                    <Link href="/" className="flex items-center gap-3 mb-6 group">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
                            <Image src="/branding/v1_icon.png" alt="Antigravity Logo" fill className="object-cover" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-tighter">Antigravity</span>
                    </Link>
                    <p className="text-muted-foreground/40 text-sm max-w-xs font-sans tracking-tight leading-relaxed">
                        The ultimate Operating System for executive biological and digital life management. Engineered for the 1%.
                    </p>
                </div>

                {/* Links Sections */}
                {Object.entries({
                    Product: ['Features', 'Pricing', 'Roadmap', 'Changelog'],
                    Company: ['About', 'Blog', 'Careers', 'Contact'],
                    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy']
                }).map(([category, links]) => (
                    <div key={category}>
                        <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase text-foreground mb-6">{category}</h4>
                        <ul className="space-y-4">
                            {links.map((link) => (
                                <li key={link}>
                                    <Link
                                        href="#"
                                        className="text-sm text-muted-foreground/50 hover:text-primary transition-colors font-sans tracking-tight"
                                    >
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-bold tracking-widest uppercase text-muted-foreground/30">
                <div>© 2026 ANTIGRAVITY v1.1 — ALL RIGHTS RESERVED.</div>
                <div className="flex gap-8">
                    <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
                    <Link href="#" className="hover:text-foreground transition-colors">LinkedIn</Link>
                    <Link href="#" className="hover:text-foreground transition-colors">GitHub</Link>
                </div>
            </div>
        </footer>
    );
}
