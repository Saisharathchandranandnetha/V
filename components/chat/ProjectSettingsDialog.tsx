'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProject, deleteProject } from '@/app/dashboard/chat/actions'
import { addTeamMember, getTeamMembers, updateMemberRole, removeTeamMember } from '@/app/dashboard/teams/actions'
import { Settings, Trash2, UserPlus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { DeleteProjectDialog } from './DeleteProjectDialog'

interface ProjectSettingsDialogProps {
    teamId: string
    projectId: string
    currentName: string
    currentUserRole?: string
}

interface Member {
    id: string
    name: string
    email: string
    avatar: string
    role: string
    isCreator?: boolean
}

export function ProjectSettingsDialog({ teamId, projectId, currentName, currentUserRole = 'member' }: ProjectSettingsDialogProps) {
    const [name, setName] = useState(currentName)
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Delete Dialog State
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    const canEdit = ['owner', 'admin'].includes(currentUserRole)

    // Add Member State
    const [inviteEmail, setInviteEmail] = useState('')
    const [isInviting, setIsInviting] = useState(false)
    const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Members List State
    const [members, setMembers] = useState<Member[]>([])
    const [isLoadingMembers, setIsLoadingMembers] = useState(false)

    const router = useRouter()

    const fetchMembers = async () => {
        setIsLoadingMembers(true)
        try {
            const data = await getTeamMembers(teamId)
            // @ts-ignore
            setMembers(data)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoadingMembers(false)
        }
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) {
            setName(currentName)
            setInviteMessage(null)
            setInviteEmail('')
            fetchMembers()
        }
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await updateMemberRole(teamId, userId, newRole)
            setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m))
        } catch (error) {
            console.error('Failed to update role:', error)
        }
    }

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return
        try {
            await removeTeamMember(teamId, userId)
            setMembers(prev => prev.filter(m => m.id !== userId))
        } catch (error) {
            console.error('Failed to remove member:', error)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', name)
            formData.append('projectId', projectId)
            formData.append('teamId', teamId)
            await updateProject(formData)
            setOpen(false)
        } catch (error) {
            console.error('Failed to update project:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteEmail.trim()) return

        setIsInviting(true)
        setInviteMessage(null)

        try {
            const formData = new FormData()
            formData.append('email', inviteEmail)
            formData.append('teamId', teamId)
            const result = await addTeamMember(formData)

            if (result.success) {
                setInviteMessage({ type: 'success', text: result.message || 'Member added to team successfully!' })
                setInviteEmail('')
            } else {
                setInviteMessage({ type: 'error', text: result.error || 'Failed to add member.' })
            }
        } catch (error) {
            console.error('Failed to add member:', error)
            setInviteMessage({
                type: 'error',
                text: 'An unexpected error occurred.'
            })
        } finally {
            setIsInviting(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Settings className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Project Settings</DialogTitle>
                        <DialogDescription>
                            Manage your project settings and members.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Edit Name Section */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Project Name</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading || !canEdit}
                                />
                                {canEdit && (
                                    <Button onClick={handleUpdate} disabled={isLoading || !name.trim()}>
                                        Save
                                    </Button>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Add Member Section */}
                        {canEdit && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Add Member</Label>
                                    <DialogDescription className="text-xs">
                                        Invite users to the team to give them access to this project.
                                    </DialogDescription>
                                    <div className="flex gap-2">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="user@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            disabled={isInviting}
                                        />
                                        <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()} variant="secondary">
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Add
                                        </Button>
                                    </div>
                                    {inviteMessage && (
                                        <p className={`text-sm ${inviteMessage.type === 'success' ? 'text-green-500' : 'text-destructive'}`}>
                                            {inviteMessage.text}
                                        </p>
                                    )}
                                </div>
                                <Separator />
                            </>
                        )}

                        {/* Members List Section */}
                        <div className="space-y-2">
                            <Label>Project Members</Label>
                            <DialogDescription className="text-xs">
                                People with access to this project (via team membership).
                            </DialogDescription>

                            <div className="border rounded-md h-[150px] overflow-hidden bg-background/50">
                                {isLoadingMembers ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <ScrollArea className="h-full">
                                        <div className="p-2 space-y-2">
                                            {members.map((member) => (
                                                <div key={member.id} className="flex items-center justify-between gap-3 p-2 hover:bg-accent/50 rounded-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={member.avatar || ''} />
                                                            <AvatarFallback>{member.name?.[0] || '?'}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{member.name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {canEdit ? (
                                                            <>
                                                                <Select
                                                                    value={member.role}
                                                                    onValueChange={(val) => handleRoleChange(member.id, val)}
                                                                    disabled={member.isCreator}
                                                                >
                                                                    <SelectTrigger className="w-[90px] h-7 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="owner">Owner</SelectItem>
                                                                        <SelectItem value="admin">Admin</SelectItem>
                                                                        <SelectItem value="member">Member</SelectItem>
                                                                    </SelectContent>
                                                                </Select>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => handleRemoveMember(member.id)}
                                                                    disabled={member.isCreator}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        </div>

                        {/* Delete Section */}
                        {canEdit && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <Label className="text-destructive">Danger Zone</Label>
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => setShowDeleteDialog(true)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Project
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteProjectDialog
                teamId={teamId}
                projectId={projectId}
                projectName={currentName}
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            />
        </>
    )
}
