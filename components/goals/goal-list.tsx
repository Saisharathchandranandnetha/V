'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { deleteGoal, updateGoalProgress } from '@/app/dashboard/goals/actions'
import { EditGoalDialog } from '@/components/goals/edit-goal-dialog'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { cn } from '@/lib/utils'

interface Goal {
    id: string
    title: string
    type: string
    current_value: number
    target_value: number
    unit: string
    deadline: string | null
}

export function GoalList({ goals }: { goals: Goal[] }) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState<number>(0)

    // Group by type
    const groupedGoals = {
        'Short Term': goals.filter(g => g.type === 'Short Term'),
        'Mid Term': goals.filter(g => g.type === 'Mid Term'),
        'Long Term': goals.filter(g => g.type === 'Long Term'),
    }

    const handleUpdate = async (id: string) => {
        await updateGoalProgress(id, editValue)
        setEditingId(null)
    }

    return (
        <div className="space-y-8">
            {Object.entries(groupedGoals).map(([type, typeGoals]) => {
                if (typeGoals.length === 0) return null
                return (
                    <div key={type} className="space-y-4">
                        <h3 className="text-xl font-semibold tracking-tight">{type}</h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {typeGoals.map((goal) => {
                                const percentage = Math.min((goal.current_value / goal.target_value) * 100, 100)

                                return (
                                    <Card key={goal.id}>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                {goal.title}
                                            </CardTitle>
                                            <div className="flex items-center gap-1">
                                                <EditGoalDialog goal={goal} />
                                                <ConfirmDeleteDialog
                                                    trigger={
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                    onConfirm={() => deleteGoal(goal.id)}
                                                    title="Delete Goal"
                                                    description="Are you sure you want to delete this goal? This action cannot be undone."
                                                />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold mb-2">
                                                {goal.current_value} / {goal.target_value} <span className="text-sm font-normal text-muted-foreground">{goal.unit}</span>
                                            </div>
                                            <Progress value={percentage} className="h-2 mb-2" />
                                            <p className="text-xs text-muted-foreground mb-4">
                                                {percentage.toFixed(0)}% Complete
                                                {goal.deadline && (
                                                    <span className="ml-2">• Due {format(new Date(goal.deadline), 'MMM d, yyyy')}</span>
                                                )}
                                            </p>

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setEditValue(goal.current_value)}>
                                                        Update Progress
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Update Progress: {goal.title}</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(Number(e.target.value))}
                                                                step="0.1"
                                                            />
                                                            <span className="text-sm text-muted-foreground">{goal.unit}</span>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button onClick={() => handleUpdate(goal.id)}>Save</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
            {goals.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    No goals set. Start planning your future!
                </div>
            )}
        </div>
    )
}
