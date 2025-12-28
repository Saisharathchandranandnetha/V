'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button" // Ensure we have Button if we need custom trigger
import { ReactNode } from "react"

interface ConfirmDeleteDialogProps {
    trigger?: ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onConfirm: () => void
    title?: string
    description?: string
    disabled?: boolean
}

export function ConfirmDeleteDialog({
    trigger,
    open,
    onOpenChange,
    onConfirm,
    title = "Are you absolutely sure?",
    description = "This action cannot be undone. This will permanently delete this item.",
    disabled = false
}: ConfirmDeleteDialogProps) {

    const handleConfirm = (e: React.MouseEvent) => {
        e.preventDefault()
        onConfirm()
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className="bg-red-600 focus:ring-red-600 hover:bg-red-700"
                        disabled={disabled}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
