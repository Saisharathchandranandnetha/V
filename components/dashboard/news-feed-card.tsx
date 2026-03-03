'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Compass, ArrowRight, Sparkles } from 'lucide-react'

const NEWS_ITEMS = [
    {
        id: '1',
        title: 'The Future of Autonomous AI Agents',
        source: 'TechCrunch',
        time: '2h ago',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
        category: 'AI & Tech'
    },
    {
        id: '2',
        title: 'DeepMind breakthrough in Protein Folding',
        source: 'Nature',
        time: '5h ago',
        imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=800',
        category: 'Science'
    },
    {
        id: '3',
        title: 'Global Markets Rally Amid Tech Earnings',
        source: 'Bloomberg',
        time: '12h ago',
        imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800',
        category: 'Finance'
    },
    {
        id: '4',
        title: 'SpaceX announces new Mars mission timeline',
        source: 'Space.com',
        time: '1d ago',
        imageUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800',
        category: 'Space'
    }
]

export function NewsFeedCard() {
    const containerRef = useRef<HTMLDivElement>(null)

    return (
        <div className="relative flex flex-col h-full w-full rounded-2xl overflow-hidden bg-zinc-950/40 border border-white/10 backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-5 pt-3 sm:pt-4 pb-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <div className="p-1.5 rounded-full bg-white/10 text-white shrink-0">
                        <Compass className="w-4 h-4" />
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-white/90 truncate shrink-0">V_Mach</span>
                    <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] uppercase tracking-wide font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full animate-pulse whitespace-nowrap shrink-0">
                        Integrating Soon
                    </span>
                </div>
                <button className="text-[10px] sm:text-xs font-medium text-white/40 hover:text-white transition-colors flex items-center gap-1 shrink-0 ml-2">
                    View <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {/* Horizontal scrollable cards */}
            <div
                ref={containerRef}
                className="flex-1 flex gap-2 sm:gap-3 px-3 sm:px-4 pb-3 pt-1.5 overflow-x-auto snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {NEWS_ITEMS.map((item, idx) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                        className="relative flex-shrink-0 rounded-xl overflow-hidden snap-center cursor-pointer group border border-white/5"
                        style={{ width: 'clamp(150px, 62vw, 240px)' }}
                    >
                        {/* Image */}
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                            style={{ backgroundImage: `url(${item.imageUrl})` }}
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        {/* Content */}
                        <div className="absolute inset-0 p-2.5 sm:p-3 flex flex-col justify-end">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wide text-white bg-white/20 backdrop-blur-sm rounded">
                                    {item.category}
                                </span>
                                <span className="text-[9px] text-white/60 flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5" /> {item.time}
                                </span>
                            </div>
                            <h3 className="text-xs sm:text-sm font-semibold leading-snug text-white group-hover:text-emerald-400 transition-colors line-clamp-3">
                                {item.title}
                            </h3>
                            <p className="text-[9px] sm:text-xs text-white/40 mt-1">{item.source}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar{display:none}` }} />
        </div>
    )
}
