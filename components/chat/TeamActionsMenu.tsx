'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, UserPlus, Settings, Trash2 } from "lucide-react"
import { useState } from "react"
import { AddMemberDialog } from "./AddMemberDialog"
import { TeamSettingsDialog } from "./TeamSettingsDialog"
import { DeleteTeamDialog } from "./DeleteTeamDialog"

interface TeamActionsMenuProps {
    teamId: string
    teamName: string
    currentUserRole?: string
}

export function TeamActionsMenu({ teamId, teamName, currentUserRole = 'member' }: TeamActionsMenuProps) {
    const [showAddMember, setShowAddMember] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showDelete, setShowDelete] = useState(false)

    const canEdit = ['owner', 'admin'].includes(currentUserRole)
    const isOwner = currentUserRole === 'owner'

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Team Options</DropdownMenuLabel>
                    {canEdit && (
                        <DropdownMenuItem onClick={() => setShowAddMember(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Member
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setShowSettings(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        {canEdit ? 'Settings' : 'Team Members'}
                    </DropdownMenuItem>
                    {isOwner && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setShowDelete(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Team
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AddMemberDialog
                teamId={teamId}
                open={showAddMember}
                onOpenChange={setShowAddMember}
            />

            <TeamSettingsDialog
                teamId={teamId}
                currentName={teamName}
                open={showSettings}
                onOpenChange={setShowSettings}
                currentUserRole={currentUserRole}
            />

            <DeleteTeamDialog
                teamId={teamId}
                open={showDelete}
                onOpenChange={setShowDelete}
            />
        </>
    )
}
