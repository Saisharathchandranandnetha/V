import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { Progress } from '@/components/ui/progress'
import { PlusCircle, CalendarCheck, CheckSquare, Target, DollarSign, ArrowUpRight, ArrowDownLeft, Library, BookOpen, Route, BarChart3, Settings, StickyNote, FolderOpen, Layers, Users, MessageSquare, Map as MapIcon, Layout, Trophy, Globe2, Flag, Clock, Newspaper, Rss, Zap, TrendingUp, Cpu } from 'lucide-react'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { habits, habitLogs, tasks, goals, transactions, resources, notes, collections, categories, learningPaths } from '@/lib/db/schema'
import { eq, and, or, isNull, lte, count } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { DateTimeDisplay } from '@/components/date-time-display'
import { HoverEffect } from '@/components/ui/hover-effect'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { Entrance } from '@/components/ui/entrance'
import { MagneticText } from '@/components/ui/magnetic-text'

export default async function DashboardPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')
    const userId = session.user.id

    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
    })
    const today = formatter.format(now)

    // Fetch all counts in parallel
    const [
        habitsData,
        habitLogsData,
        activeTasksData,
        goalsData,
        transactionsData,
        resourcesData,
        notesData,
        collectionsData,
    ] = await Promise.all([
        db.select({ id: habits.id }).from(habits).where(eq(habits.userId, userId)),
        db.select({ id: habitLogs.id }).from(habitLogs)
            .innerJoin(habits, eq(habitLogs.habitId, habits.id))
            .where(and(eq(habits.userId, userId), eq(habitLogs.date, today), eq(habitLogs.status, true))),
        db.select({ id: tasks.id, status: tasks.status }).from(tasks)
            .where(and(or(eq(tasks.userId, userId), eq(tasks.assignedTo, userId)))),
        db.select({ currentValue: goals.currentValue, targetValue: goals.targetValue }).from(goals)
            .where(eq(goals.userId, userId)),
        db.select({ amount: transactions.amount, type: transactions.type }).from(transactions)
            .where(eq(transactions.userId, userId)),
        db.select({ id: resources.id }).from(resources).where(eq(resources.userId, userId)),
        db.select({ id: notes.id }).from(notes).where(eq(notes.userId, userId)),
        db.select({ id: collections.id }).from(collections).where(eq(collections.userId, userId)),
    ])

    const habitsCount = habitsData.length
    const habitsCompleted = habitLogsData.length
    const tasksDone = activeTasksData.filter(t => t.status === 'Done').length
    const tasksPending = activeTasksData.filter(t => t.status !== 'Done').length
    const resourcesCount = resourcesData.length
    const notesCount = notesData.length
    const collectionsCount = collectionsData.length

    let avgProgress = 0
    if (goalsData.length > 0) {
        const total = goalsData.reduce((acc, g) => {
            const cur = parseFloat(g.currentValue || '0')
            const tar = parseFloat(g.targetValue || '1')
            return acc + Math.min((cur / tar) * 100, 100)
        }, 0)
        avgProgress = total / goalsData.length
    }

    const income = transactionsData.filter(t => t.type === 'Income').reduce((a, t) => a + parseFloat(t.amount || '0'), 0)
    const expense = transactionsData.filter(t => t.type === 'Expense').reduce((a, t) => a + parseFloat(t.amount || '0'), 0)
    const balance = income - expense

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-4 border-b border-white/5">
                <div>
                    <MagneticText>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-2">
                            Intelligence
                        </h1>
                    </MagneticText>
                    <p className="text-[10px] font-bold text-muted-foreground/40 tracking-[0.3em] uppercase">
                        V_1.1 · ONYX PROFESSIONAL STATUS
                    </p>
                </div>
                <div className="flex flex-col md:items-end">
                    <DateTimeDisplay />
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_oklch(var(--primary))]" />
                        <span className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-70">Enlightened · Active</span>
                    </div>
                </div>
            </div>

            {/* Main Stats Bento Grid */}
            <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" delay={0.1}>
                {/* Daily Habits */}
                <StaggerItem className="lg:col-span-2">
                    <HoverEffect variant="lift" className="h-full">
                        <Link href="/dashboard/habits" className="block h-full">
                            <Card className="h-full hover:border-primary/40 transition-colors duration-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <CardTitle className="text-sm font-medium tracking-tight text-foreground/80">Daily Habits</CardTitle>
                                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                                        <CalendarCheck className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-5xl font-bold tracking-tighter text-glow">
                                        {habitsCompleted} <span className="text-muted-foreground/40 text-2xl font-normal tracking-tight">/ {habitsCount}</span>
                                    </div>
                                    <p className="text-xs font-semibold text-muted-foreground/60 tracking-widest uppercase mt-3">Action Protocol</p>
                                    <Progress value={(habitsCompleted / (habitsCount || 1)) * 100} className="h-1.5 mt-6 bg-white/5" />
                                </CardContent>
                            </Card>
                        </Link>
                    </HoverEffect>
                </StaggerItem>

                {/* Tasks */}
                <StaggerItem className="lg:col-span-2">
                    <HoverEffect variant="lift" className="h-full">
                        <Link href="/dashboard/tasks" className="block h-full">
                            <Card className="h-full hover:border-accent/40 transition-colors duration-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <CardTitle className="text-sm font-medium tracking-tight text-foreground/80">Tasks</CardTitle>
                                    <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center">
                                        <CheckSquare className="h-4 w-4 text-accent" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-5xl font-bold tracking-tighter text-glow" style={{ textShadow: '0 0 20px oklch(var(--accent) / 0.25)' }}>
                                        {tasksDone} <span className="text-muted-foreground/30 text-2xl font-normal tracking-tight">/ {tasksDone + tasksPending}</span>
                                    </div>
                                    <p className="text-xs font-semibold text-muted-foreground/60 tracking-widest uppercase mt-3">Execution Logic</p>
                                    <Progress value={tasksDone && (tasksDone + tasksPending) > 0 ? (tasksDone / (tasksDone + tasksPending)) * 100 : 0} className="h-1.5 mt-6 bg-white/5" />
                                </CardContent>
                            </Card>
                        </Link>
                    </HoverEffect>
                </StaggerItem>

                {/* Goal Progress */}
                <StaggerItem>
                    <HoverEffect variant="lift">
                        <Link href="/dashboard/goals" className="block h-full">
                            <Card className="h-full transition-colors duration-200 hover:border-primary/30">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-sm font-medium tracking-tight text-foreground/80">Goal Progress</CardTitle>
                                    <Target className="h-4 w-4 text-muted-foreground/50" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tighter text-glow-accent">{avgProgress.toFixed(0)}%</div>
                                    <Progress value={avgProgress} className="h-1 mt-4 bg-white/5" />
                                </CardContent>
                            </Card>
                        </Link>
                    </HoverEffect>
                </StaggerItem>

                {/* Net Balance */}
                <StaggerItem className="lg:col-span-2 md:col-span-2">
                    <HoverEffect variant="lift" className="h-full">
                        <Link href="/dashboard/finances" className="block h-full">
                            <Card className="h-full transition-colors duration-200 hover:border-emerald-500/30">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <CardTitle className="text-sm font-medium tracking-tight text-foreground/80">Net Balance</CardTitle>
                                    <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                                        <DollarSign className="h-4 w-4 text-emerald-500" />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex justify-between items-end">
                                    <div>
                                        <div className={`text-5xl font-bold tracking-tighter ${balance >= 0 ? 'text-glow' : 'text-red-500'}`}>
                                            {formatCurrency(balance)}
                                        </div>
                                        <p className="text-xs font-semibold text-muted-foreground/60 tracking-widest uppercase mt-3">Asset Liquidity</p>
                                    </div>
                                    <div className="flex flex-col gap-2 text-right">
                                        <span className="flex items-center justify-end text-sm font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm">
                                            <ArrowUpRight className="h-3 w-3 mr-1" />{formatCurrency(income)}
                                        </span>
                                        <span className="flex items-center justify-end text-sm font-bold text-red-400 bg-red-400/10 px-3 py-1.5 rounded-xl border border-red-500/20 shadow-sm">
                                            <ArrowDownLeft className="h-3 w-3 mr-1" />{formatCurrency(expense)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </HoverEffect>
                </StaggerItem>

                {/* Resources + Notes */}
                <StaggerItem className="lg:col-span-2">
                    <div className="grid grid-cols-2 gap-4 h-full">
                        <HoverEffect variant="lift" className="h-full">
                            <Link href="/dashboard/resources" className="block h-full">
                                <Card className="h-full flex flex-col justify-center items-center text-center p-6 transition-colors duration-200 hover:border-primary/30">
                                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                                        <Library className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="text-3xl font-bold tracking-tighter text-foreground/90">{resourcesCount}</div>
                                    <p className="text-[10px] font-bold text-muted-foreground/80 tracking-widest uppercase mt-1">Resources</p>
                                </Card>
                            </Link>
                        </HoverEffect>
                        <HoverEffect variant="lift" className="h-full">
                            <Link href="/dashboard/notes" className="block h-full">
                                <Card className="h-full flex flex-col justify-center items-center text-center p-6 transition-colors duration-200 hover:border-orange-500/30">
                                    <div className="h-10 w-10 rounded-md bg-orange-500/10 flex items-center justify-center mb-3">
                                        <StickyNote className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div className="text-3xl font-bold tracking-tighter text-foreground/90">{notesCount}</div>
                                    <p className="text-[10px] font-bold text-muted-foreground/80 tracking-widest uppercase mt-1">Personal Notes</p>
                                </Card>
                            </Link>
                        </HoverEffect>
                    </div>
                </StaggerItem>
            </StaggerContainer>

            {/* Quick Links */}
            <div className="space-y-4 mt-12 pb-12">
                <h3 className="text-2xl font-bold tracking-tight text-foreground/80 mb-6">Quick Access</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    <HoverEffect variant="lift" className="col-span-2 md:col-span-2 lg:col-span-2">
                        <Link href="/dashboard/roadmaps" className="block h-full w-full">
                            <Card className="h-full flex flex-col justify-between p-6 transition-colors duration-200 hover:border-primary/30">
                                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-6">
                                    <MapIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-display font-medium text-xl tracking-tight text-foreground/90">Active Roadmaps</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-2">Strategic Journeys</p>
                                </div>
                            </Card>
                        </Link>
                    </HoverEffect>
                    {[
                        { href: '/dashboard/collections', icon: BookOpen, label: 'Library' },
                        { href: '/dashboard/categories', icon: Layers, label: 'Logic' },
                        { href: '/dashboard/teams', icon: Users, label: 'Network' },
                        { href: '/dashboard/chat', icon: MessageSquare, label: 'Comm' },
                    ].map(({ href, icon: Icon, label }) => (
                        <HoverEffect key={href} variant="lift" className="col-span-1">
                            <Link href={href}>
                                <Card className="flex flex-col items-center justify-center h-40 transition-colors duration-200 hover:border-primary/30 group">
                                    <Icon className="h-6 w-6 mb-3 text-primary group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/80">{label}</span>
                                </Card>
                            </Link>
                        </HoverEffect>
                    ))}
                    <HoverEffect variant="lift" className="col-span-2">
                        <Link href="/dashboard/analytics" className="block h-full w-full">
                            <Card className="h-full flex flex-col justify-between p-6 transition-colors duration-200 hover:border-primary/30">
                                <BarChart3 className="h-6 w-6 text-muted-foreground mb-4" />
                                <div>
                                    <h4 className="font-display font-medium text-lg tracking-tight text-foreground/90">System Analytics</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-1">Market Logic · Pattern Recognition</p>
                                </div>
                            </Card>
                        </Link>
                    </HoverEffect>
                    <HoverEffect variant="lift" className="col-span-1">
                        <Link href="/dashboard/settings">
                            <Card className="flex flex-col items-center justify-center h-40 transition-colors duration-200 hover:border-primary/30 group">
                                <Settings className="h-6 w-6 mb-3 text-muted-foreground group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/80">Config</span>
                            </Card>
                        </Link>
                    </HoverEffect>
                </div>
            </div>

            {/* Two-column section: left = future content, right = sidebar cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 pb-12">

                {/* LEFT: placeholder for upcoming features (2/3 width) */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="p-6 border-dashed border-white/5 flex flex-col items-center justify-center min-h-[200px] text-center">
                        <BarChart3 className="h-8 w-8 text-muted-foreground/30 mb-3" />
                        <p className="text-sm font-semibold text-muted-foreground/50 tracking-wide">More widgets coming soon</p>
                        <p className="text-xs text-muted-foreground/30 mt-1">AI insights · Activity heatmap · Weekly review</p>
                    </Card>
                </div>

                {/* RIGHT SIDEBAR: Hackathon + Tech News stacked (1/3 width) */}
                <div className="lg:col-span-1 space-y-4">

                    {/* Hackathon Registrations */}
                    <Card className="p-4 border-dashed border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-md bg-yellow-500/10 flex items-center justify-center">
                                    <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground/90">Hackathons</h3>
                                    <p className="text-[10px] text-muted-foreground">Upcoming competitions</p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-bold tracking-widest uppercase">
                                <Clock className="h-2.5 w-2.5" /> Soon
                            </span>
                        </div>

                        {/* National */}
                        <div className="mb-3">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Flag className="h-3 w-3 text-orange-400" />
                                <span className="text-[10px] font-bold tracking-widest uppercase text-orange-400">National</span>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { name: 'Smart India Hackathon 2025', date: 'Dec 2025' },
                                    { name: 'HackWithInfy (Infosys)', date: 'Q3 2025' },
                                    { name: 'Flipkart Grid 7.0', date: 'TBA' },
                                ].map((h, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                        <p className="text-xs text-foreground/80 leading-tight truncate">{h.name}</p>
                                        <span className="shrink-0 text-[9px] font-bold text-orange-400/70 bg-orange-500/10 px-1.5 py-0.5 rounded-full">{h.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* International */}
                        <div className="pt-3 border-t border-white/5">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Globe2 className="h-3 w-3 text-violet-400" />
                                <span className="text-[10px] font-bold tracking-widest uppercase text-violet-400">International</span>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { name: 'Google Solution Challenge', date: 'Jan 2026' },
                                    { name: 'NASA Space Apps', date: 'Oct 2025' },
                                    { name: 'MLH Global Hackathon', date: 'Rolling' },
                                ].map((h, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                        <p className="text-xs text-foreground/80 leading-tight truncate">{h.name}</p>
                                        <span className="shrink-0 text-[9px] font-bold text-violet-400/70 bg-violet-500/10 px-1.5 py-0.5 rounded-full">{h.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Daily Tech News */}
                    <Card className="p-4 border-dashed border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                    <Newspaper className="h-3.5 w-3.5 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground/90">Daily Tech News</h3>
                                    <p className="text-[10px] text-muted-foreground">AI · Security · Dev · Web3</p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold tracking-widest uppercase shrink-0">
                                <Rss className="h-2.5 w-2.5" /> Soon
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { icon: Cpu, label: 'AI & ML', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                                { icon: Globe2, label: 'Web3', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                { icon: Zap, label: 'Security', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                                { icon: TrendingUp, label: 'Startups', color: 'text-green-400', bg: 'bg-green-500/10' },
                            ].map(({ icon: Icon, label, color, bg }) => (
                                <div key={label} className={`flex items-center gap-2 p-2.5 rounded-lg ${bg} border border-white/5`}>
                                    <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
                                    <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 text-[10px] text-muted-foreground/50 text-center">
                            Curated headlines delivered daily
                        </p>
                    </Card>

                </div>
            </div>
        </div>
    )
}