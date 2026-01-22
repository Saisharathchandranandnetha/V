'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from "@/components/ui/scroll-area"
import { updateTeam, getTeamMembers, updateMemberRole, removeTeamMember } from '@/app/dashboard/teams/actions'
import { Loader2, Trash2 } from 'lucide-react'

interface TeamSettingsDialogProps {
    teamId: string
    currentName: string
    open: boolean
    onOpenChange: (open: boolean) => void
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

export function TeamSettingsDialog({ teamId, currentName, open, onOpenChange, currentUserRole = 'member' }: TeamSettingsDialogProps) {
    const [name, setName] = useState(currentName)
    const [isLoading, setIsLoading] = useState(false)
    const [members, setMembers] = useState<Member[]>([])
    const [isLoadingMembers, setIsLoadingMembers] = useState(false)

    const canEdit = ['owner', 'admin'].includes(currentUserRole)

    useEffect(() => {
        if (open) {
            fetchMembers()
        }
    }, [open, teamId])

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

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', name)
            formData.append('teamId', teamId)
            await updateTeam(formData)
            // Optional: show success
        } catch (error) {
            console.error('Failed to update team:', error)
        } finally {
            setIsLoading(false)
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Team Settings</DialogTitle>
                    <DialogDescription>
                        Manage your team profile and members.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="py-4">
                        <form onSubmit={handleUpdateName} className="space-y-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Team Name
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="col-span-3"
                                    disabled={isLoading || !canEdit}
                                />
                            </div>
                            {canEdit && (
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isLoading || !name.trim()}>
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </TabsContent>

                    <TabsContent value="members" className="flex-1 flex flex-col overflow-hidden mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-medium">Team Members ({members.length})</h3>
                        </div>

                        {isLoadingMembers ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-4">
                                    {members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Avatar>
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
                                                            <SelectTrigger className="w-[100px] h-8">
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
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            disabled={member.isCreator}
                                                            onClick={() => handleRemoveMember(member.id)}
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
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
