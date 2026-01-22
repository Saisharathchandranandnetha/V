'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addTeamMember } from '@/app/dashboard/teams/actions'
import { UserPlus } from 'lucide-react'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

interface AddMemberDialogProps {
    teamId: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function AddMemberDialog({ teamId, open, onOpenChange }: AddMemberDialogProps) {
    // If controlled, use parent state, else local. 
    // Simplified: Just use local for now, but usually it's triggered from a Dropdown so we need to handle open state carefully or use the Dialog directly.
    // Actually, DropdownMenuItem closing conflicts with Dialog open. 
    // Best pattern: The DialogTrigger is INSIDE the DropdownMenu? No, that closes the menu.
    // We should separate them or use the "select to open" pattern.

    // Changing approach: This component will be the Dialog itself. The Trigger is handled by the caller or passed as child?
    // Let's make it usable as a standalone button OR controlled.

    // For simplicity in Sidebar, let's just make it a Dialog that renders a Trigger.
    // If valid trigger is passed, use it.

    const [internalOpen, setInternalOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')

    const isOpen = open !== undefined ? open : internalOpen
    const setOpen = onOpenChange || setInternalOpen

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setIsLoading(true)
        setMessage('')

        try {
            const formData = new FormData()
            formData.append('email', email)
            formData.append('teamId', teamId)
            const result = await addTeamMember(formData)

            if (result.success) {
                // Optionally show success message before closing? 
                // For now, just close as before, but maybe log or toast?
                setOpen(false)
                setEmail('')
            } else {
                setMessage(result.error || 'Failed to add member.')
            }
        } catch (error) {
            console.error('Failed to add member:', error)
            setMessage('An unexpected error occurred.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>
                        Invite a user to your team by their email address.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="col-span-3"
                                placeholder="user@example.com"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                        {message && <p className="text-sm text-destructive text-center">{message}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading || !email.trim()}>
                            {isLoading ? 'Adding...' : 'Add Member'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
