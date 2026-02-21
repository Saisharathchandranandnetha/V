import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { Progress } from '@/components/ui/progress'
import { PlusCircle, CalendarCheck, CheckSquare, Target, DollarSign, ArrowUpRight, ArrowDownLeft, Library, BookOpen, Route, BarChart3, Settings, StickyNote, FolderOpen, Layers, Users, MessageSquare, Map as MapIcon, Layout } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { DateTimeDisplay } from '@/components/date-time-display'
import { HoverEffect } from '@/components/ui/hover-effect'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { Entrance } from '@/components/ui/entrance'
import { MagneticText } from '@/components/ui/magnetic-text'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
    const today = formatter.format(now)



    // Calculate start and end of day in UTC for comparison
    // Since we want "Today" based on user's locale (Asia/Kolkata), we should construct the range accordingly.
    // However, DB stores in UTC. 
    // Simplified approach: Match the date string if stored as date, or range if timestamp.
    // tasks.due_date is timestamptz. 
    // Let's create a range for "Today in Kolkata" converted to UTC.

    // Actually, simpler: Use the local date string 'YYYY-MM-DD' and let Supabase/Postgres handle comparison if we cast?
    // BETTER: Construct ISO strings for the range.

    const startOfDay = new Date(now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' }))
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setHours(23, 59, 59, 999)

    const startOfDayISO = startOfDay.toISOString()
    const endOfDayISO = endOfDay.toISOString()

    // 1. Start fetching all metrics in parallel
    // Combined habits query: Get logs directly by filtering on joined habits
    const habitLogsPromise = supabase
        .from('habit_logs')
        .select('id, habits!inner(id)', { count: 'exact', head: true })
        .eq('habits.user_id', user.id)
        .eq('date', today)
        .eq('status', true)

    // Also need total habits count for denominator
    const totalHabitsPromise = supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    const tasksPendingPromise = supabase.from('tasks')
        .select('*', { count: 'exact', head: true })
        .or(`assigned_to.eq.${user.id},and(assigned_to.is.null,user_id.eq.${user.id})`)
        .neq('status', 'Done')
        .or(`due_date.lte.${endOfDayISO},due_date.is.null`)

    const tasksDonePromise = supabase.from('tasks')
        .select('*', { count: 'exact', head: true })
        .or(`assigned_to.eq.${user.id},and(assigned_to.is.null,user_id.eq.${user.id})`)
        .eq('status', 'Done')
        .gte('completed_at', startOfDayISO)
        .lte('completed_at', endOfDayISO)

    const goalsPromise = supabase.from('goals').select('current_value, target_value').eq('user_id', user.id)
    const transactionsPromise = supabase.from('transactions').select('amount, type').eq('user_id', user.id)
    const resourcesCountPromise = supabase.from('resources').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const pathsCountPromise = supabase.from('learning_paths').select('*', { count: 'exact', head: true }).neq('is_completed', true)
    const notesCountPromise = supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const collectionsCountPromise = supabase.from('collections').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const categoriesCountPromise = supabase.from('categories').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

    // 2. Await all results
    const [
        { count: dailyHabitsCompleted },
        { count: totalHabitsCount },
        { count: tasksPendingCount },
        { count: tasksDoneCount },
        { data: goalsData },
        { data: transactionsData },
        { count: resourcesCountData },
        { count: pathsCountData },
        { count: notesCountData },
        { count: collectionsCountData },
        { count: categoriesCountData }
    ] = await Promise.all([
        habitLogsPromise,
        totalHabitsPromise,
        tasksPendingPromise,
        tasksDonePromise,
        goalsPromise,
        transactionsPromise,
        resourcesCountPromise,
        pathsCountPromise,
        notesCountPromise,
        collectionsCountPromise,
        categoriesCountPromise
    ])

    // Remap variables to match original logic
    const habitsCompleted = dailyHabitsCompleted
    const habitsCount = totalHabitsCount
    const tasksPending = tasksPendingCount
    const tasksDone = tasksDoneCount
    const goalsVector = goalsData
    const transactions = transactionsData
    const resourcesCount = resourcesCountData
    const pathsCount = pathsCountData
    const notesCount = notesCountData
    const collectionsCount = collectionsCountData
    const categoriesCount = categoriesCountData

    const activeGoals = goalsVector?.length || 0
    // Simple average progress
    let avgProgress = 0
    if (goalsVector && goalsVector.length > 0) {
        const totalProgress = goalsVector.reduce((acc, g) => acc + Math.min((g.current_value / g.target_value) * 100, 100), 0)
        avgProgress = totalProgress / goalsVector.length
    }

    const income = transactions?.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0) || 0
    const expense = transactions?.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0) || 0
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
                {/* Daily Habits - Large Feature Card */}
                <StaggerItem className="lg:col-span-2">
                    <HoverEffect variant="lift" className="h-full">
                        <Link href="/dashboard/habits" className="block h-full">
                            <SpotlightCard className="h-full glass-dark border-primary/20 hover:border-primary/40 transition-colors duration-500">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <CardTitle className="text-lg font-bold tracking-tight text-foreground/90">Daily Habits</CardTitle>
                                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center shadow-lg border border-white/10">
                                        <CalendarCheck className="h-5 w-5 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-5xl font-bold tracking-tighter text-glow">
                                        {habitsCompleted || 0} <span className="text-muted-foreground/40 text-2xl font-normal tracking-tight">/ {habitsCount || 0}</span>
                                    </div>
                                    <p className="text-xs font-semibold text-muted-foreground/60 tracking-widest uppercase mt-3">Action Protocol</p>
                                    <Progress value={((habitsCompleted || 0) / (habitsCount || 1)) * 100} className="h-1.5 mt-6 bg-white/5" />
                                </CardContent>
                            </SpotlightCard>
                        </Link>
                    </HoverEffect>
                </StaggerItem>

                <StaggerItem className="lg:col-span-2">
                    <HoverEffect variant="lift" className="h-full">
                        <Link href="/dashboard/tasks" className="block h-full">
                            <SpotlightCard className="h-full glass-dark border-accent/20 hover:border-accent/40 transition-colors duration-500">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <CardTitle className="text-lg font-bold tracking-tight text-foreground/90">Tasks</CardTitle>
                                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center shadow-lg border border-white/10">
                                        <CheckSquare className="h-5 w-5 text-accent" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-5xl font-bold tracking-tighter text-glow" style={{ textShadow: '0 0 20px oklch(var(--accent) / 0.25)' }}>
                                        {tasksDone || 0} <span className="text-muted-foreground/30 text-2xl font-normal tracking-tight">/ {(tasksDone || 0) + (tasksPending || 0)}</span>
                                    </div>
                                    <p className="text-xs font-semibold text-muted-foreground/60 tracking-widest uppercase mt-3">Execution Logic</p>
                                    <Progress value={tasksDone && (tasksDone + (tasksPending || 0)) > 0 ? (tasksDone / (tasksDone + (tasksPending || 0))) * 100 : 0} className="h-1.5 mt-6 bg-white/5" />
                                </CardContent>
                            </SpotlightCard>
                        </Link>
                    </HoverEffect>
                </StaggerItem>

                <StaggerItem>
                    <HoverEffect variant="lift">
                        <Link href="/dashboard/goals" className="block h-full">
                            <SpotlightCard className="h-full glass-dark border-white/5">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-sm font-bold tracking-tight text-foreground/80">Goal Progress</CardTitle>
                                    <Target className="h-4 w-4 text-muted-foreground/50" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tighter text-glow-accent">{avgProgress.toFixed(0)}%</div>
                                    <Progress value={avgProgress} className="h-1 mt-4 bg-white/5" />
                                </CardContent>
                            </SpotlightCard>
                        </Link>
                    </HoverEffect>
                </StaggerItem>

                <StaggerItem className="lg:col-span-2 md:col-span-2">
                    <HoverEffect variant="lift" className="h-full">
                        <Link href="/dashboard/finances" className="block h-full">
                            <SpotlightCard className="h-full glass-dark border-emerald-500/10">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <CardTitle className="text-lg font-bold tracking-tight text-foreground/90">Net Balance</CardTitle>
                                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center shadow-lg border border-white/10">
                                        <DollarSign className="h-5 w-5 text-emerald-400" />
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
                            </SpotlightCard>
                        </Link>
                    </HoverEffect>
                </StaggerItem>

                <StaggerItem className="lg:col-span-2">
                    <div className="grid grid-cols-2 gap-4 h-full">
                        <HoverEffect variant="lift" className="h-full">
                            <Link href="/dashboard/resources" className="block h-full">
                                <SpotlightCard className="h-full glass-dark border-white/5 flex flex-col justify-center items-center text-center p-6 duration-500">
                                    <div className="h-12 w-12 rounded-2xl glass flex items-center justify-center mb-3 shadow-xl border border-white/10 group-hover:scale-110 transition-transform">
                                        <Library className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-3xl font-bold tracking-tighter text-foreground/90">{resourcesCount || 0}</div>
                                    <p className="text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase mt-1">Resources</p>
                                </SpotlightCard>
                            </Link>
                        </HoverEffect>
                        <HoverEffect variant="lift" className="h-full">
                            <Link href="/dashboard/notes" className="block h-full">
                                <SpotlightCard className="h-full glass-dark border-white/5 flex flex-col justify-center items-center text-center p-6 duration-500">
                                    <div className="h-12 w-12 rounded-2xl glass flex items-center justify-center mb-3 shadow-xl border border-white/10 group-hover:scale-110 transition-transform">
                                        <StickyNote className="h-6 w-6 text-orange-400" />
                                    </div>
                                    <div className="text-3xl font-bold tracking-tighter text-foreground/90">{notesCount || 0}</div>
                                    <p className="text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase mt-1">Personal Notes</p>
                                </SpotlightCard>
                            </Link>
                        </HoverEffect>
                    </div>
                </StaggerItem>
            </StaggerContainer>

            {/* Quick Links Bento - Asymmetrical */}
            <div className="space-y-4 mt-12 pb-12">
                <h3 className="text-2xl font-bold tracking-tight text-foreground/80 mb-6">Quick Access</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    <HoverEffect variant="glow" className="col-span-2 md:col-span-2 lg:col-span-2 relative group overflow-hidden rounded-[24px] border border-white/5">
                        <Link href="/dashboard/roadmaps" className="block h-full w-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-600/20 to-slate-900/60 opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
                            <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">
                                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mb-6 shadow-2xl border border-white/10 group-hover:scale-110 transition-transform">
                                    <MapIcon className="h-6 w-6 text-white" />
                                </div>
                                <div className="mt-auto">
                                    <h4 className="font-display font-bold text-2xl tracking-tight">Active Roadmaps</h4>
                                    <p className="text-xs font-bold text-white/50 tracking-widest uppercase mt-2">Strategic Journeys · V_1.0</p>
                                </div>
                            </div>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/collections" className="flex flex-col items-center justify-center h-40 glass-dark border border-white/5 rounded-[24px] hover:bg-white/5 transition-all duration-500 p-6 group">
                            <BookOpen className="h-7 w-7 mb-3 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground/60">Library</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/categories" className="flex flex-col items-center justify-center h-40 glass-dark border border-white/5 rounded-[24px] hover:bg-white/5 transition-all duration-500 p-6 group">
                            <Layers className="h-7 w-7 mb-3 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground/60">Logic</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/teams" className="flex flex-col items-center justify-center h-40 glass-dark border border-white/5 rounded-[24px] hover:bg-white/5 transition-all duration-500 p-6 group">
                            <Users className="h-7 w-7 mb-3 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground/60">Network</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/chat" className="flex flex-col items-center justify-center h-40 glass-dark border border-white/5 rounded-[24px] hover:bg-white/5 transition-all duration-500 p-6 group">
                            <MessageSquare className="h-7 w-7 mb-3 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground/60">Comm</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-2 relative group overflow-hidden rounded-[24px] border border-white/5">
                        <Link href="/dashboard/analytics" className="block h-full w-full">
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/30 to-black opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
                            <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">
                                <BarChart3 className="h-8 w-8 text-white/50 mb-4" />
                                <div>
                                    <h4 className="font-display font-bold text-xl tracking-tight">System Analytics</h4>
                                    <p className="text-xs font-bold text-white/40 tracking-widest uppercase mt-1">Market Logic · Pattern Recognition</p>
                                </div>
                            </div>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/settings" className="flex flex-col items-center justify-center h-40 glass-dark border border-white/5 rounded-[24px] hover:bg-white/5 transition-all duration-500 p-6 group">
                            <Settings className="h-7 w-7 mb-3 text-muted-foreground/40 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground/40">Config</span>
                        </Link>
                    </HoverEffect>
                </div>
            </div>
        </div>
    )
}

