'use client'

import { useState } from 'react'
import { addMilestone, toggleMilestone, deleteMilestone } from '@/app/dashboard/goals/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2 } from 'lucide-react'

type Milestone = {
    id: string
    title: string
    completed: boolean | null
}

export function GoalMilestones({ goalId, milestones }: { goalId: string, milestones: Milestone[] }) {
    const [newTitle, setNewTitle] = useState('')
    const [loading, setLoading] = useState(false)

    const handleAdd = async () => {
        if (!newTitle.trim()) return
        setLoading(true)
        await addMilestone(goalId, newTitle)
        setNewTitle('')
        setLoading(false)
    }

    const handleToggle = async (id: string, completed: boolean) => {
        await toggleMilestone(id, completed)
    }

    const handleDelete = async (id: string) => {
        await deleteMilestone(id)
    }

    return (
        <div className="space-y-4 pt-4 mt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-muted-foreground">Milestones</h4>

            <div className="flex flex-col gap-2">
                {milestones.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No milestones yet.</p>
                ) : (
                    milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-center gap-2 text-sm group">
                            <Checkbox
                                checked={milestone.completed || false}
                                onCheckedChange={(c) => handleToggle(milestone.id, !!c)}
                            />
                            <span className={`flex-1 ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {milestone.title}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(milestone.id)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            <div className="flex items-center gap-2 pt-2">
                <Input
                    placeholder="Add a milestone..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd()
                    }}
                />
                <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAdd} disabled={loading || !newTitle.trim()}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
