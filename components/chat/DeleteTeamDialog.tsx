'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteTeam } from '@/app/dashboard/teams/actions'

interface DeleteTeamDialogProps {
    teamId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteTeamDialog({ teamId, open, onOpenChange }: DeleteTeamDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const router = useRouter()

    const handleDelete = async () => {
        setIsLoading(true)
        try {
            await deleteTeam(teamId)
            onOpenChange(false)
            router.push('/dashboard/chat') // Redirect to main chat area
        } catch (error) {
            console.error('Failed to delete team:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={(val) => {
            if (!val) setConfirmText('')
            onOpenChange(val)
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the team
                        and all associated messages and projects.
                    </AlertDialogDescription>
                    <div className="py-2">
                        <p className="text-sm text-foreground/80 mb-2">
                            Type <span className="font-bold text-foreground">DELETE</span> to confirm.
                        </p>
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type DELETE"
                        />
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        disabled={isLoading || confirmText !== 'DELETE'}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? 'Deleting...' : 'Delete Team'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
