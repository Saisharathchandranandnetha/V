
"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  Zap,
  TrendingUp,
  Layout,
  ArrowRight,
  Target,
  Wallet,
  BookOpen,
  ChevronDown,
} from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CanvasScrollSequence } from '@/components/landing/canvas-scroll-sequence'

export default function LandingPage() {
  // Hero text fades as user scrolls down the page
  const { scrollYProgress } = useScroll()
  const heroTextY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const heroTextOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  return (
    <div className="flex flex-col min-h-screen bg-black overflow-x-hidden">

      {/* ─── CANVAS: fixed behind everything, frames driven by FULL PAGE scroll ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CanvasScrollSequence />
      </div>

      {/* ─── HEADER ────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-2xl">
        <div className="container mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Layout size={16} />
            </div>
            <span className="text-white">LifeOs</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-white/60 hover:text-white text-sm">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-white text-sm h-9 px-5 rounded-full shadow-lg shadow-primary/25">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col">

        {/* ─── HERO ───────────────────────── */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Gentle vignette so text is readable directly over the animation */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_65%_at_50%_50%,transparent_25%,rgba(0,0,0,0.55)_100%)] pointer-events-none" />

          <motion.div
            style={{ y: heroTextY, opacity: heroTextOpacity }}
            className="relative z-10 text-center px-6 max-w-5xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.15em] uppercase text-primary mb-8 backdrop-blur-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              v2.0 Now Live
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-[clamp(3.5rem,8vw,8rem)] font-black tracking-[-0.04em] leading-[0.9] mb-8 text-white"
            >
              Your Entire Life.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-cyan-400">
                One OS.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="text-lg md:text-xl text-white/50 max-w-xl mx-auto mb-12 leading-relaxed"
            >
              Habits. Tasks. Finance. Knowledge. All unified in one intelligence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/login">
                <Button size="lg" className="h-14 px-10 text-base font-bold rounded-full bg-white text-black hover:bg-white/90 shadow-[0_0_60px_rgba(255,255,255,0.15)] transition-all hover:scale-105 group">
                  Start for Free
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="h-14 px-10 text-base font-bold rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm">
                  See Features
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 text-xs tracking-widest uppercase">
            <span>Scroll to explore</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </section>

        {/* ─── FEATURES — NO dark overlay, fully transparent ─── */}
        <section id="features" className="relative py-32">
          <div className="container mx-auto px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-6">
                Built for people who
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400"> refuse to settle.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: <Target className="text-violet-400" size={28} />, color: 'from-violet-500/15', title: 'Habit Tracking', desc: 'Build unbreakable routines with streaks, analytics, and gamified XP.' },
                { icon: <CheckCircle className="text-blue-400" size={28} />, color: 'from-blue-500/15', title: 'Task Management', desc: 'Prioritise ruthlessly. Ship faster with a zero-friction task engine.' },
                { icon: <Wallet className="text-emerald-400" size={28} />, color: 'from-emerald-500/15', title: 'Finance Tracker', desc: 'Full control of every penny. Track income, expenses, savings.' },
                { icon: <BookOpen className="text-cyan-400" size={28} />, color: 'from-cyan-500/15', title: 'Knowledge Base', desc: 'Your second brain. Capture ideas, link notes, never lose insight.' },
                { icon: <TrendingUp className="text-orange-400" size={28} />, color: 'from-orange-500/15', title: 'Analytics & Insights', desc: 'Data-driven clarity on every area of your life. Beautiful. Actionable.' },
                { icon: <Zap className="text-yellow-400" size={28} />, color: 'from-yellow-500/15', title: 'AI Automation', desc: "An AI that executes, not just suggests. Your co-pilot at full throttle." },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  whileHover={{ y: -4 }}
                  className="relative rounded-2xl p-7 bg-white/[0.06] backdrop-blur-xl border border-white/10 hover:border-white/25 transition-all duration-300 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} to-transparent pointer-events-none`} />
                  <div className="relative w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">{card.icon}</div>
                  <h3 className="relative text-lg font-bold text-white mb-2">{card.title}</h3>
                  <p className="relative text-white/50 text-sm leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA — fully transparent ─── */}
        <section className="relative py-32 mb-16">
          <div className="container mx-auto px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl text-center p-16 md:p-24 overflow-hidden"
            >
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/15 blur-[100px] rounded-full pointer-events-none" />
              <h2 className="relative text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
                Stop managing.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-cyan-400">Start thriving.</span>
              </h2>
              <Link href="/login">
                <Button size="lg" className="h-16 px-16 text-base mt-8 font-bold rounded-full bg-white text-black hover:bg-white/90 shadow-[0_0_80px_rgba(255,255,255,0.2)] transition-all hover:scale-105">
                  Get Started — It&apos;s Free
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

      </main>

      <footer className="relative z-10 border-t border-white/5 py-10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/30">
          <div className="flex items-center gap-2 font-bold text-white/60"><Layout size={14} /> LifeOs</div>
          <p>© 2026 LifeOs. Built for high-performers.</p>
        </div>
      </footer>
    </div>
  )
}
