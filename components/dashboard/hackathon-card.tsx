'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, MapPin, Globe, Calendar, Users, ArrowRight, Zap, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const HACKATHONS = {
    national: [
        {
            id: 'n1',
            name: 'Smart India Hackathon 2025',
            organizer: 'Ministry of Education',
            date: 'Apr 10 – Apr 12',
            location: 'Pan India',
            prize: '₹1,00,000',
            theme: 'EdTech & Governance',
            status: 'registering',
            participants: '5,000+',
            daysLeft: 18,
            color: '#f97316'
        },
        {
            id: 'n2',
            name: 'HackIndia 2025',
            organizer: 'StartupIndia',
            date: 'May 3 – May 5',
            location: 'Bengaluru, KA',
            prize: '₹75,000',
            theme: 'FinTech & AI',
            status: 'upcoming',
            participants: '2,000+',
            daysLeft: 41,
            color: '#8b5cf6'
        },
        {
            id: 'n3',
            name: 'Kavach 2025',
            organizer: 'MHA – Govt of India',
            date: 'Jun 14 – Jun 16',
            location: 'New Delhi',
            prize: '₹2,00,000',
            theme: 'Cybersecurity',
            status: 'upcoming',
            participants: '10,000+',
            daysLeft: 83,
            color: '#ef4444'
        }
    ],
    international: [
        {
            id: 'i1',
            name: 'MIT Reality Hack 2025',
            organizer: 'MIT Media Lab',
            date: 'Mar 22 – Mar 25',
            location: 'Boston, USA',
            prize: '$50,000',
            theme: 'XR & Spatial Computing',
            status: 'registering',
            participants: '500+',
            daysLeft: 6,
            color: '#3b82f6'
        },
        {
            id: 'i2',
            name: 'NASA Space Apps Challenge',
            organizer: 'NASA',
            date: 'Oct 4 – Oct 6',
            location: 'Global (Virtual)',
            prize: 'Mission Tour',
            theme: 'Earth, Space & Ocean',
            status: 'upcoming',
            participants: '50,000+',
            daysLeft: 214,
            color: '#06b6d4'
        },
        {
            id: 'i3',
            name: 'MLH Global Hack Week',
            organizer: 'Major League Hacking',
            date: 'Apr 7 – Apr 14',
            location: 'Online',
            prize: 'Swag & Prizes',
            theme: 'Open Theme',
            status: 'registering',
            participants: '15,000+',
            daysLeft: 15,
            color: '#10b981'
        }
    ]
}

const STATUS_CONFIG = {
    registering: { label: 'Registering', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
    upcoming: { label: 'Upcoming', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
    live: { label: 'Live Now', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' }
}

export function HackathonCard() {
    const [tab, setTab] = useState<'national' | 'international'>('national')
    const items = HACKATHONS[tab]

    return (
        <div className="relative flex flex-col h-full w-full rounded-2xl overflow-hidden bg-zinc-950/40 border border-white/10 backdrop-blur-md">
            {/* Ambient glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

            {/* Header — always a single row, never wraps */}
            <div className="flex items-center justify-between gap-2 px-3 sm:px-5 pt-3 sm:pt-4 pb-2 shrink-0 relative z-10">
                {/* Left: icon + title */}
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    <div className="p-1.5 rounded-full bg-white/10 text-amber-400 shrink-0">
                        <Trophy className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h2 className="text-sm sm:text-base font-semibold text-white/90 truncate leading-tight">Hackathons</h2>
                            <span className="px-1.5 py-0.5 text-[8px] uppercase tracking-wide font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full animate-pulse whitespace-nowrap shrink-0">
                                Integrating Soon
                            </span>
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-white/40 leading-tight hidden sm:block">Upcoming opportunities</p>
                    </div>
                </div>

                {/* Right: toggle — compact, never wraps */}
                <div className="relative flex items-center shrink-0 bg-white/5 border border-white/10 rounded-full p-0.5 gap-0">
                    {(['national', 'international'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={cn(
                                'relative px-2 sm:px-3 py-1 text-[9px] sm:text-[11px] font-semibold rounded-full transition-all duration-300 z-10 flex items-center gap-1 whitespace-nowrap',
                                tab === t ? 'text-zinc-900' : 'text-white/50'
                            )}
                        >
                            {tab === t && (
                                <motion.div
                                    layoutId="hack-pill"
                                    className="absolute inset-0 rounded-full bg-white"
                                    transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-0.5">
                                {t === 'national' ? <MapPin className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                                {t === 'national' ? 'National' : 'Intl'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable cards */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 flex gap-2 sm:gap-3 px-3 sm:px-4 pb-3 pt-1 overflow-x-auto snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {items.map((hack, idx) => (
                        <motion.div
                            key={hack.id}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.06, duration: 0.35 }}
                            className="relative flex-shrink-0 rounded-xl border border-white/8 bg-white/5 hover:bg-white/[0.08] transition-colors p-2.5 sm:p-3.5 flex flex-col justify-between cursor-pointer snap-center"
                            style={{ width: 'clamp(160px, 65vw, 250px)' }}
                        >
                            {/* Color bar */}
                            <div
                                className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                                style={{ background: `linear-gradient(90deg, transparent, ${hack.color}, transparent)` }}
                            />

                            <div>
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                    <span className={cn(
                                        'px-1.5 py-0.5 text-[8px] uppercase tracking-wide font-bold rounded-full border',
                                        STATUS_CONFIG[hack.status as keyof typeof STATUS_CONFIG].bg,
                                        STATUS_CONFIG[hack.status as keyof typeof STATUS_CONFIG].color
                                    )}>
                                        {STATUS_CONFIG[hack.status as keyof typeof STATUS_CONFIG].label}
                                    </span>
                                    <span className="text-[9px] font-semibold flex items-center gap-0.5 text-white/50">
                                        <Clock className="w-2.5 h-2.5" />
                                        <span style={{ color: hack.color }}>{hack.daysLeft}d</span>
                                    </span>
                                </div>

                                <h3 className="font-semibold text-white/90 text-xs sm:text-sm leading-snug mt-1.5 line-clamp-2">
                                    {hack.name}
                                </h3>
                                <p className="text-[9px] text-white/40 mt-0.5">{hack.organizer}</p>
                            </div>

                            <div className="mt-2 space-y-1 text-[9px] sm:text-[10px] text-white/50">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-white/25 shrink-0" />
                                    <span className="truncate">{hack.date}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-white/25 shrink-0" />
                                    <span className="truncate">{hack.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-white/25 shrink-0" />
                                    <span className="truncate">{hack.participants}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-white/25 shrink-0" />
                                    <span className="font-medium text-white/70 truncate">{hack.prize}</span>
                                </div>
                            </div>

                            <button className="mt-2.5 w-full flex items-center justify-center gap-1 border border-white/10 rounded-lg py-1.5 text-[9px] sm:text-[10px] font-medium text-white/50 hover:text-white hover:border-white/25 transition-all">
                                Learn more <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
