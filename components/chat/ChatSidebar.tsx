'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Hash, Users, Folder, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useState } from 'react'
import { CreateTeamDialog } from './CreateTeamDialog'
import { CreateProjectDialog } from './CreateProjectDialog'
import { TeamActionsMenu } from './TeamActionsMenu'


export type Project = {
    id: string
    name: string
    team_id: string
}

export type Team = {
    id: string
    name: string
    currentUserRole?: string
    projects: Project[]
}

interface ChatSidebarProps {
    teams: Team[]
    onSelect?: () => void
}

export function ChatSidebar({ teams, onSelect }: ChatSidebarProps) {
    const params = useParams()
    const pathname = usePathname()
    const currentTeamId = params.teamId as string

    // State for collapsible teams, default all open for now
    const [openTeams, setOpenTeams] = useState<Record<string, boolean>>(
        teams.reduce((acc, team) => ({ ...acc, [team.id]: true }), {})
    )

    const toggleTeam = (teamId: string) => {
        setOpenTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }))
    }

    return (
        <div className="flex flex-col h-full border-r border-border bg-card/30 backdrop-blur-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-lg">Teams</h2>
                <CreateTeamDialog />
            </div>

            <ScrollArea className="flex-1 p-2">
                <div className="space-y-4">
                    {teams.length === 0 && (
                        <div className="text-sm text-muted-foreground p-2">
                            No teams yet. Create one to start chatting!
                        </div>
                    )}

                    {teams.map((team) => (
                        <Collapsible
                            key={team.id}
                            open={openTeams[team.id]}
                            onOpenChange={() => toggleTeam(team.id)}
                        >
                            <div className="flex items-center group">
                                <Link
                                    href={`/dashboard/chat/${team.id}`}
                                    onClick={onSelect}
                                    className={cn(
                                        "flex-1 flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                                        currentTeamId === team.id && !pathname.includes('/project/') ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    <Users className="h-4 w-4" />
                                    {team.name}
                                </Link>
                                <TeamActionsMenu
                                    teamId={team.id}
                                    teamName={team.name}
                                    currentUserRole={team.currentUserRole}
                                />
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity rotate-90 data-[state=open]:rotate-0">
                                        <Hash className="h-3 w-3" />
                                    </Button>
                                </CollapsibleTrigger>
                            </div>

                            <CollapsibleContent className="pl-4 pt-1 space-y-1">
                                {team.projects?.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/dashboard/chat/${team.id}/project/${project.id}`}
                                        onClick={onSelect}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                                            pathname.includes(project.id) ? "bg-accent/50 text-accent-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        <Folder className="h-3 w-3" />
                                        {project.name}
                                    </Link>
                                ))}
                                {['owner', 'admin', 'member'].includes(team.currentUserRole || '') && (
                                    <CreateProjectDialog teamId={team.id} />
                                )}
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
