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
import { deleteProject } from '@/app/dashboard/chat/actions'
import { Loader2 } from 'lucide-react'

interface DeleteProjectDialogProps {
    teamId: string
    projectId: string
    projectName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteProjectDialog({ teamId, projectId, projectName, open, onOpenChange }: DeleteProjectDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setIsLoading(true)
        try {
            await deleteProject(projectId, teamId)
            onOpenChange(false)
            router.push(`/dashboard/chat/${teamId}`) // Redirect to team root
        } catch (error) {
            console.error('Failed to delete project:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <span className="font-semibold text-foreground">{projectName}</span>?
                        <br />
                        This action cannot be undone. All messages and tasks in this project will be permanently removed.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Delete Project
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
