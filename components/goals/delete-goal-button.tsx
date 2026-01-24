'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteGoal } from '@/app/dashboard/goals/actions'

export function DeleteGoalButton({ id }: { id: string }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={async () => await deleteGoal(id)}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
