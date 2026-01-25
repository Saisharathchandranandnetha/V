import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PlusCircle, CalendarCheck, CheckSquare, Target, DollarSign, ArrowUpRight, ArrowDownLeft, Library, BookOpen, Route, BarChart3, Settings, StickyNote, FolderOpen, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { DateTimeDisplay } from '@/components/date-time-display'
import { HoverEffect } from '@/components/ui/hover-effect'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { Entrance } from '@/components/ui/entrance'

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

    // 1. Start fetching user habits
    const userHabitsPromise = supabase.from('habits').select('id').eq('user_id', user.id)

    // 2. Start fetching independent data in parallel
    const tasksPendingPromise = supabase.from('tasks')
        .select('*', { count: 'exact', head: true })
        .or(`assigned_to.eq.${user.id},and(assigned_to.is.null,user_id.eq.${user.id})`)
        .neq('status', 'Done')
        .lte('due_date', endOfDayISO)

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

    // 3. Await user habits to proceed with dependent query
    const { data: userHabits } = await userHabitsPromise
    const habitIds = userHabits?.map(h => h.id) || []

    const habitLogsPromise = supabase.from('habit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('status', true)
        .in('habit_id', habitIds)

    // 4. Await all results
    const [
        { count: dailyHabitsCompleted },
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

    // Remap variables to match original names
    const habits = userHabits
    const habitsCompleted = dailyHabitsCompleted
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
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your productivity & finances.</p>
                </div>
                <DateTimeDisplay />
            </div>

            <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" delay={0.1}>
                <StaggerItem>
                    <HoverEffect variant="lift">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Daily Habits</CardTitle>
                                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{habitsCompleted} / {habits?.length || 0}</div>
                                <p className="text-xs text-muted-foreground">completed today</p>
                            </CardContent>
                        </Card>
                    </HoverEffect>
                </StaggerItem>
                <StaggerItem>
                    <HoverEffect variant="lift">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{tasksPending}</div>
                                <p className="text-xs text-muted-foreground">{tasksDone} completed</p>
                            </CardContent>
                        </Card>
                    </HoverEffect>
                </StaggerItem>
                <StaggerItem>
                    <HoverEffect variant="lift">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{avgProgress.toFixed(0)}%</div>
                                <Progress value={avgProgress} className="h-2 mt-2" />
                                <p className="text-xs text-muted-foreground mt-1">{activeGoals} active goals</p>
                            </CardContent>
                        </Card>
                    </HoverEffect>
                </StaggerItem>
                <StaggerItem>
                    <HoverEffect variant="lift">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(balance)}
                                </div>
                                <div className="flex text-xs text-muted-foreground mt-1 gap-2">
                                    <span className="flex items-center text-green-600"><ArrowUpRight className="h-3 w-3 mr-1" />{formatCurrency(income)}</span>
                                    <span className="flex items-center text-red-600"><ArrowDownLeft className="h-3 w-3 mr-1" />{formatCurrency(expense)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </HoverEffect>
                </StaggerItem>
            </StaggerContainer>

            {/* Content Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <HoverEffect variant="lift">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
                            <Library className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{resourcesCount || 0}</div>
                            <p className="text-xs text-muted-foreground">saved items</p>
                        </CardContent>
                    </Card>
                </HoverEffect>
                <HoverEffect variant="lift">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Collections</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{collectionsCount || 0}</div>
                            <p className="text-xs text-muted-foreground">organized folders</p>
                        </CardContent>
                    </Card>
                </HoverEffect>
                <HoverEffect variant="lift">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Categories</CardTitle>
                            <Layers className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{categoriesCount || 0}</div>
                            <p className="text-xs text-muted-foreground">resource types</p>
                        </CardContent>
                    </Card>
                </HoverEffect>
                <HoverEffect variant="lift">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Notes</CardTitle>
                            <StickyNote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{notesCount || 0}</div>
                            <p className="text-xs text-muted-foreground">ideas captured</p>
                        </CardContent>
                    </Card>
                </HoverEffect>
                <HoverEffect variant="lift">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Learning Paths</CardTitle>
                            <Route className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pathsCount || 0}</div>
                            <p className="text-xs text-muted-foreground">active courses</p>
                        </CardContent>
                    </Card>
                </HoverEffect>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-7">
                    <CardHeader>
                        <CardTitle>Quick Links</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <HoverEffect variant="glow" key="habits">
                            <Button variant="outline" className="h-24 w-full flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal border-0" asChild>
                                <Link href="/dashboard/habits">
                                    <CalendarCheck className="h-6 w-6 mb-1" />
                                    <span className="text-sm font-medium">Habits</span>
                                </Link>
                            </Button>
                        </HoverEffect>
                        <HoverEffect variant="glow" key="tasks">
                            <Button variant="outline" className="h-24 w-full flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal border-0" asChild>
                                <Link href="/dashboard/tasks">
                                    <CheckSquare className="h-6 w-6 mb-1" />
                                    <span className="text-sm font-medium">Tasks</span>
                                </Link>
                            </Button>
                        </HoverEffect>
                        <HoverEffect variant="glow" key="goals">
                            <Button variant="outline" className="h-24 w-full flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal border-0" asChild>
                                <Link href="/dashboard/goals">
                                    <Target className="h-6 w-6 mb-1" />
                                    <span className="text-sm font-medium">Goals</span>
                                </Link>
                            </Button>
                        </HoverEffect>
                        <HoverEffect variant="glow" key="finances">
                            <Button variant="outline" className="h-24 w-full flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal border-0" asChild>
                                <Link href="/dashboard/finances">
                                    <DollarSign className="h-6 w-6 mb-1" />
                                    <span className="text-sm font-medium">Finances</span>
                                </Link>
                            </Button>
                        </HoverEffect>
                        <HoverEffect variant="glow" key="resources">
                            <Button variant="outline" className="h-24 w-full flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal border-0" asChild>
                                <Link href="/dashboard/resources">
                                    <Library className="h-6 w-6 mb-1" />
                                    <span className="text-sm font-medium">Resources</span>
                                </Link>
                            </Button>
                        </HoverEffect>
                        <HoverEffect variant="glow" key="collections">
                            <Button variant="outline" className="h-24 w-full flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal border-0" asChild>
                                <Link href="/dashboard/collections">
                                    <BookOpen className="h-6 w-6 mb-1" />
                                    <span className="text-sm font-medium">Collections</span>
                                </Link>
                            </Button>
                        </HoverEffect>
                        <HoverEffect variant="glow" key="paths">
                            <Button variant="outline" className="h-24 w-full flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal border-0" asChild>
                                <Link href="/dashboard/paths">
                                    <Route className="h-6 w-6 mb-1" />
                                    <span className="text-sm font-medium">Learning Paths</span>
                                </Link>
                            </Button>
                        </HoverEffect>
                        <HoverEffect variant="glow" key="notes">
                            <Button variant="outline" className="h-24 w-full flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal border-0" asChild>
                                <Link href="/dashboard/notes">
                                    <StickyNote className="h-6 w-6 mb-1" />
                                    <span className="text-sm font-medium">Notes</span>
                                </Link>
                            </Button>
                        </HoverEffect>
                        <HoverEffect variant="glow" key="categories">
                            <Button variant="outline" className="h-24 w-full flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal border-0" asChild>
                                <Link href="/dashboard/categories">
                                    <Layers className="h-6 w-6 mb-1" />
                                    <span className="text-sm font-medium">Categories</span>
                                </Link>
                            </Button>
                        </HoverEffect>
                        <HoverEffect variant="glow" key="analytics">
                            <Button variant="outline" className="h-24 w-full flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal border-0" asChild>
                                <Link href="/dashboard/analytics">
                                    <BarChart3 className="h-6 w-6 mb-1" />
                                    <span className="text-sm font-medium">Analytics</span>
                                </Link>
                            </Button>
                        </HoverEffect>
                        <HoverEffect variant="glow" key="settings">
                            <Button variant="outline" className="h-24 w-full flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal border-0" asChild>
                                <Link href="/dashboard/settings">
                                    <Settings className="h-6 w-6 mb-1" />
                                    <span className="text-sm font-medium">Settings</span>
                                </Link>
                            </Button>
                        </HoverEffect>
                    </CardContent>
                </Card>
            </div>      {/* Placeholder for future detailed activity or calendar */}
        </div>
    )
}

