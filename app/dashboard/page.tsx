import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PlusCircle, CalendarCheck, CheckSquare, Target, DollarSign, ArrowUpRight, ArrowDownLeft, Library, BookOpen, Route, BarChart3, Settings, StickyNote, FolderOpen, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Please log in</div>

    const today = new Date().toISOString().split('T')[0]

    // Fetch Habits Status
    const { data: habits } = await supabase.from('habits').select('id')
    const { count: habitsCompleted } = await supabase.from('habit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('status', true)
        .in('habit_id', (await supabase.from('habits').select('id').eq('user_id', user.id)).data?.map(h => h.id) || [])

    // Fetch Tasks Status
    const { count: tasksPending } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'Done')
    const { count: tasksDone } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'Done')

    // Fetch Goals Status
    const { data: goalsVector } = await supabase.from('goals').select('current_value, target_value').eq('user_id', user.id)
    const activeGoals = goalsVector?.length || 0
    // Simple average progress
    let avgProgress = 0
    if (goalsVector && goalsVector.length > 0) {
        const totalProgress = goalsVector.reduce((acc, g) => acc + Math.min((g.current_value / g.target_value) * 100, 100), 0)
        avgProgress = totalProgress / goalsVector.length
    }

    // Fetch Finances
    const { data: transactions } = await supabase.from('transactions').select('amount, type').eq('user_id', user.id)
    const income = transactions?.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0) || 0
    const expense = transactions?.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0) || 0
    const balance = income - expense

    // Fetch Content Counts
    const { count: resourcesCount } = await supabase.from('resources').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const { count: pathsCount } = await supabase.from('learning_paths').select('*', { count: 'exact', head: true })
    const { count: notesCount } = await supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const { count: collectionsCount } = await supabase.from('collections').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your productivity & finances.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tasksPending}</div>
                        <p className="text-xs text-muted-foreground">{tasksDone} completed</p>
                    </CardContent>
                </Card>
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
            </div>

            {/* Content Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Collections & Categories</CardTitle>
                        <Layers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{collectionsCount || 0}</div>
                        <p className="text-xs text-muted-foreground">organized folders</p>
                    </CardContent>
                </Card>
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
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-7">
                    <CardHeader>
                        <CardTitle>Quick Links</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal" asChild>
                            <Link href="/dashboard/habits">
                                <CalendarCheck className="h-6 w-6 mb-1" />
                                <span className="text-sm font-medium">Habits</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal" asChild>
                            <Link href="/dashboard/tasks">
                                <CheckSquare className="h-6 w-6 mb-1" />
                                <span className="text-sm font-medium">Tasks</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal" asChild>
                            <Link href="/dashboard/goals">
                                <Target className="h-6 w-6 mb-1" />
                                <span className="text-sm font-medium">Goals</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal" asChild>
                            <Link href="/dashboard/finances">
                                <DollarSign className="h-6 w-6 mb-1" />
                                <span className="text-sm font-medium">Finances</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal" asChild>
                            <Link href="/dashboard/resources">
                                <Library className="h-6 w-6 mb-1" />
                                <span className="text-sm font-medium">Resources</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal" asChild>
                            <Link href="/dashboard/collections">
                                <BookOpen className="h-6 w-6 mb-1" />
                                <span className="text-sm font-medium">Collections</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal" asChild>
                            <Link href="/dashboard/paths">
                                <Route className="h-6 w-6 mb-1" />
                                <span className="text-sm font-medium">Learning Paths</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal" asChild>
                            <Link href="/dashboard/analytics">
                                <BarChart3 className="h-6 w-6 mb-1" />
                                <span className="text-sm font-medium">Analytics</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center p-2 text-center whitespace-normal" asChild>
                            <Link href="/dashboard/settings">
                                <Settings className="h-6 w-6 mb-1" />
                                <span className="text-sm font-medium">Settings</span>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Placeholder for future detailed activity or calendar */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Welcome Back</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-40 text-center space-y-4">
                            <p className="text-lg font-medium">Today is {format(new Date(), 'MMMM d, yyyy')}</p>
                            <p className="text-muted-foreground">
                                "The secret of getting ahead is getting started."
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
