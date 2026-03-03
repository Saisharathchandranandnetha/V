
"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import {
  CheckCircle,
  Zap,
  TrendingUp,
  Layout,
  ArrowRight,
  Target,
  Wallet,
  BookOpen
} from 'lucide-react'
import * as motion from 'framer-motion/client'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Layout size={18} />
            </div>
            V
          </div>
          <nav className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          <div className="container px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm"
              >
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                v2.0 is now live
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50"
              >
                Master Your Life <br />
                with <span className="text-primary italic">V</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-muted-foreground max-w-2xl leading-relaxed"
              >
                The all-in-one personal operating system. Track habits, manage tasks, control finances, and organize knowledge in one beautiful workspace.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4"
              >
                <Link href="/login">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:scale-105 group">
                    Start for Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-primary/20 bg-background/50 backdrop-blur-sm hover:bg-primary/5 transition-all">
                    Explore Features
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Hero Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-background/30 backdrop-blur-sm border-t border-white/5">
          <div className="container px-6 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to <span className="text-primary">excel</span></h2>
              <p className="text-muted-foreground text-lg">Stop juggling multiple apps. V brings your entire digital life into one cohesive, intelligent system.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Target className="text-primary" size={32} />}
                title="Habit Tracking"
                description="Build positive routines with streak tracking, analytics, and gamified progress bars."
              />
              <FeatureCard
                icon={<CheckCircle className="text-blue-500" size={32} />}
                title="Task Management"
                description="Organize your day with a powerful task manager supporting projects, priorities, and deadlines."
              />
              <FeatureCard
                icon={<Wallet className="text-green-500" size={32} />}
                title="Finance Tracker"
                description="Keep your finances in check. Track income, expenses, and visualize your savings goals."
              />
              <FeatureCard
                icon={<BookOpen className="text-cyan-500" size={32} />}
                title="Knowledge Base"
                description="A second brain for your ideas. Create notes, organize resources, and never lose a thought."
              />
              <FeatureCard
                icon={<TrendingUp className="text-orange-500" size={32} />}
                title="Analytics & Insights"
                description="Visualize your productivity with beautiful charts and data-driven insights."
              />
              <FeatureCard
                icon={<Zap className="text-yellow-500" size={32} />}
                title="Gamification"
                description="Level up your life. Earn XP for completing tasks and staying consistent with habits."
              />
            </div>
          </div>
        </section>

        {/* Philosophy / CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="container px-6 mx-auto relative z-10">
            <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl p-8 md:p-16 text-center overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to take control?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Join thousands of users who have transformed their productivity with V.
                Start your journey today.
              </p>
              <Link href="/login">
                <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                  Get Started Now
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 bg-background/50 backdrop-blur-md">
        <div className="container px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-primary">
              <Layout size={14} />
            </div>
            V
          </div>
          <div className="text-sm text-muted-foreground text-center md:text-right">
            <p>© 2026 V. All rights reserved.</p>
            <p className="mt-1">Built for high-performers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <SpotlightCard className="bg-card/30 border-white/5 hover:border-primary/20 transition-colors">
      <div className="h-12 w-12 rounded-xl bg-background/50 border border-white/5 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </SpotlightCard>
  )
}
