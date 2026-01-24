import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { CreateGoalDialog } from '@/components/goals/create-goal-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { EditGoalDialog } from '@/components/goals/edit-goal-dialog'
import { DeleteGoalButton } from '@/components/goals/delete-goal-button'
import { UpdateProgressDialog } from '@/components/goals/update-progress-dialog'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { HoverEffect } from '@/components/ui/hover-effect'

interface Goal {
    id: string
    created_at: string
    title: string
    description?: string
    type: string
    priority: string
    current_value: number
    target_value: number
    unit: string
    deadline: string | null
    user_id: string
    status?: boolean
    updated_at?: string
}

export default async function GoalsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Please log in</div>
    }

    const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true })

    const goals = (goalsData || []) as Goal[]

    // Filter goals into active and completed
    const activeGoals = goals.filter(goal => goal.current_value < goal.target_value)
    const completedGoals = goals.filter(goal => goal.current_value >= goal.target_value)

    // Group active goals by type
    const groupedActiveGoals = activeGoals.reduce((acc, goal) => {
        const type = goal.type || 'Other'
        if (!acc[type]) acc[type] = []
        acc[type].push(goal)
        return acc
    }, {} as Record<string, Goal[]>)

    // Define sort order for types
    const typeOrder = ['Short Term', 'Mid Term', 'Long Term']
    const sortedTypes = Object.keys(groupedActiveGoals).sort((a, b) => {
        const indexA = typeOrder.indexOf(a)
        const indexB = typeOrder.indexOf(b)
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return a.localeCompare(b)
    })

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Goals</h2>
                    <p className="text-muted-foreground">Track your progress and achieve your dreams.</p>
                </div>
                <CreateGoalDialog />
            </div>

            {goals.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">No goals set yet. Create one to get started!</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Active Goals Section */}
                    {activeGoals.length > 0 && (
                        <div className="space-y-8">
                            {sortedTypes.map((type) => (
                                <div key={type} className="space-y-4">
                                    <h3 className="text-xl font-semibold">{type}</h3>
                                    <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {groupedActiveGoals[type].map((goal) => {
                                            const progress = Math.min((goal.current_value / goal.target_value) * 100, 100)

                                            return (
                                                <StaggerItem key={goal.id}>
                                                    <HoverEffect variant="lift">
                                                        <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                                                            <CardHeader className="pb-0 space-y-0 relative">
                                                                <div className="flex justify-between items-start w-full">
                                                                    <CardTitle className="text-base font-medium leading-tight pr-12 line-clamp-2 min-h-[2.5rem]" title={goal.title}>
                                                                        {goal.title}
                                                                    </CardTitle>
                                                                    <div className="absolute top-4 right-4 flex items-center gap-1">
                                                                        <EditGoalDialog goal={goal} />
                                                                        <DeleteGoalButton id={goal.id} />
                                                                    </div>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="space-y-4 pt-0">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-2xl font-bold">{goal.current_value}</span>
                                                                        <span className="text-muted-foreground text-base">/ {goal.target_value}</span>
                                                                        <span className="text-muted-foreground text-base ml-1">{goal.unit}</span>
                                                                    </div>
                                                                    <Progress value={progress} className="h-2.5 bg-secondary" indicatorClassName="bg-primary" />
                                                                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                                                        <span>{Math.round(progress)}% Complete</span>
                                                                        <span>Due {goal.deadline ? format(new Date(goal.deadline), 'MMM d, yyyy') : 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                                <UpdateProgressDialog goal={goal} />
                                                            </CardContent>
                                                        </Card>
                                                    </HoverEffect>
                                                </StaggerItem>
                                            )
                                        })}
                                    </StaggerContainer>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Completed Goals Section */}
                    {completedGoals.length > 0 && (
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-xl font-semibold text-muted-foreground">Completed Goals</h3>
                            <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {completedGoals.map((goal) => {
                                    return (
                                        <StaggerItem key={goal.id}>
                                            <HoverEffect variant="lift">
                                                <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm opacity-75">
                                                    <CardHeader className="pb-0 space-y-0 relative">
                                                        <div className="flex justify-between items-start w-full">
                                                            <CardTitle className="text-base font-medium leading-tight pr-12 line-clamp-2 min-h-[2.5rem] line-through text-muted-foreground" title={goal.title}>
                                                                {goal.title}
                                                            </CardTitle>
                                                            <div className="absolute top-4 right-4 flex items-center gap-1">
                                                                <EditGoalDialog goal={goal} />
                                                                <DeleteGoalButton id={goal.id} />
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4 pt-0">
                                                        <div className="space-y-2">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-2xl font-bold text-muted-foreground">{goal.current_value}</span>
                                                                <span className="text-muted-foreground text-base">/ {goal.target_value}</span>
                                                                <span className="text-muted-foreground text-base ml-1">{goal.unit}</span>
                                                            </div>
                                                            <Progress value={100} className="h-2.5 bg-secondary" indicatorClassName="bg-green-500" />
                                                            <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                                                <span className="text-green-600 font-bold">Completed</span>
                                                                <span>Finished {goal.updated_at ? format(new Date(goal.updated_at), 'MMM d, yyyy') : 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline" className="w-full" disabled>
                                                            Goal Achieved
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </HoverEffect>
                                        </StaggerItem>
                                    )
                                })}
                            </StaggerContainer>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
