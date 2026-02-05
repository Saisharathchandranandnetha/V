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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <MagneticText>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    </MagneticText>
                    <p className="text-muted-foreground">Overview of your productivity & finances.</p>
                </div>
                <DateTimeDisplay />
            </div>

            {/* Main Stats Bento Grid */}
            <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" delay={0.1}>
                {/* Daily Habits - Large Feature Card */}
                <StaggerItem className="lg:col-span-2">
                    <HoverEffect variant="lift" className="h-full">
                        <SpotlightCard className="h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-semibold">Daily Habits</CardTitle>
                                <CalendarCheck className="h-5 w-5 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold tracking-tighter text-indigo-500 dark:text-indigo-400">
                                    {habitsCompleted || 0} <span className="text-muted-foreground text-2xl font-normal">/ {habitsCount || 0}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">Consistent action creates success.</p>
                                <Progress value={((habitsCompleted || 0) / (habitsCount || 1)) * 100} className="h-2 mt-4 bg-indigo-100 dark:bg-indigo-900/30" />
                            </CardContent>
                        </SpotlightCard>
                    </HoverEffect>
                </StaggerItem>

                <StaggerItem>
                    <HoverEffect variant="lift">
                        <SpotlightCard>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{tasksPending}</div>
                                <p className="text-xs text-muted-foreground">{tasksDone} completed today</p>
                            </CardContent>
                        </SpotlightCard>
                    </HoverEffect>
                </StaggerItem>

                <StaggerItem>
                    <HoverEffect variant="lift">
                        <SpotlightCard>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{avgProgress.toFixed(0)}%</div>
                                <Progress value={avgProgress} className="h-1.5 mt-2" />
                            </CardContent>
                        </SpotlightCard>
                    </HoverEffect>
                </StaggerItem>

                <StaggerItem className="lg:col-span-2 md:col-span-2">
                    <HoverEffect variant="lift" className="h-full">
                        <SpotlightCard className="h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium">Net Balance</CardTitle>
                                <DollarSign className="h-5 w-5 text-green-500" />
                            </CardHeader>
                            <CardContent className="flex justify-between items-end">
                                <div>
                                    <div className={`text-3xl font-bold tracking-tighter ${balance >= 0 ? 'text-foreground' : 'text-red-600'}`}>
                                        {formatCurrency(balance)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Total liquid assets available</p>
                                </div>
                                <div className="flex flex-col gap-1 text-right">
                                    <span className="flex items-center justify-end text-sm text-green-600 bg-green-500/10 px-2 py-1 rounded-md">
                                        <ArrowUpRight className="h-3 w-3 mr-1" />{formatCurrency(income)}
                                    </span>
                                    <span className="flex items-center justify-end text-sm text-red-600 bg-red-500/10 px-2 py-1 rounded-md">
                                        <ArrowDownLeft className="h-3 w-3 mr-1" />{formatCurrency(expense)}
                                    </span>
                                </div>
                            </CardContent>
                        </SpotlightCard>
                    </HoverEffect>
                </StaggerItem>

                <StaggerItem className="lg:col-span-2">
                    <div className="grid grid-cols-2 gap-4 h-full">
                        <HoverEffect variant="lift" className="h-full">
                            <SpotlightCard className="h-full flex flex-col justify-center items-center text-center p-4">
                                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                                    <Library className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="text-2xl font-bold">{resourcesCount || 0}</div>
                                <p className="text-xs text-muted-foreground">Resources</p>
                            </SpotlightCard>
                        </HoverEffect>
                        <HoverEffect variant="lift" className="h-full">
                            <SpotlightCard className="h-full flex flex-col justify-center items-center text-center p-4">
                                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
                                    <StickyNote className="h-5 w-5 text-orange-500" />
                                </div>
                                <div className="text-2xl font-bold">{notesCount || 0}</div>
                                <p className="text-xs text-muted-foreground">Notes</p>
                            </SpotlightCard>
                        </HoverEffect>
                    </div>
                </StaggerItem>
            </StaggerContainer>

            {/* Quick Links Bento - Asymmetrical */}
            <div className="space-y-2 mt-8">
                <h3 className="text-xl font-bold tracking-tight">Quick Access</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <HoverEffect variant="glow" className="col-span-2 md:col-span-2 lg:col-span-2 relative group overflow-hidden rounded-xl">
                        <Link href="/dashboard/paths" className="block h-full w-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                                <Route className="h-8 w-8 text-white/80" />
                                <div>
                                    <h4 className="font-bold text-lg">Learning Paths</h4>
                                    <p className="text-sm text-white/70">{pathsCount || 0} active courses</p>
                                </div>
                            </div>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/habits" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <CalendarCheck className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Habits</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/tasks" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <CheckSquare className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Tasks</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/goals" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <Target className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Goals</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/finances" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <DollarSign className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Finances</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/resources" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <Library className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Resources</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/notes" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <StickyNote className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Notes</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/collections" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <BookOpen className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Collections</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/categories" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <Layers className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Categories</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/roadmaps" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <MapIcon className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Roadmaps</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/teams" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <Users className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Teams</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/chat" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <MessageSquare className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Chat</span>
                        </Link>
                    </HoverEffect>


                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/analytics" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <BarChart3 className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Analytics</span>
                        </Link>
                    </HoverEffect>

                    <HoverEffect variant="glow" className="col-span-1">
                        <Link href="/dashboard/settings" className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                            <Settings className="h-6 w-6 mb-2 text-primary" />
                            <span className="text-sm font-medium">Settings</span>
                        </Link>
                    </HoverEffect>
                </div>
            </div>
        </div>
    )
}

