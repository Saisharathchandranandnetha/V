import { createClient } from '@/lib/supabase/server'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { Folder } from 'lucide-react'

interface ProjectChatPageProps {
    params: Promise<{
        teamId: string
        projectId: string
    }>
}

import { getTeamMembers } from '@/app/dashboard/teams/actions'
import { ProjectSettingsDialog } from '@/components/chat/ProjectSettingsDialog'

export default async function ProjectChatPage(props: ProjectChatPageProps) {
    const params = await props.params;
    const { teamId, projectId } = params;
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch Project Details
    const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single()

    if (!project) {
        return <div>Project not found</div>
    }

    // Fetch Members
    const members = await getTeamMembers(teamId)
    const currentUserRole = members.find(m => m.id === user.id)?.role || 'member'

    // Fetch Initial Messages
    const { data: messages } = await supabase
        .from('team_messages')
        .select(`
        *,
        sender:users(name, avatar, email)
    `)
        .eq('team_id', teamId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

    const formattedMessages = messages?.map(msg => ({
        ...msg,
        is_sender: msg.sender_id === user.id,
        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
    })) || []

    return (
        <div className="flex flex-col h-full">
            <div className="h-14 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-sm shrink-0 justify-between">
                <div className="flex items-center gap-2 font-semibold">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    {project.name}
                </div>
                <ProjectSettingsDialog 
                    teamId={teamId} 
                    projectId={projectId} 
                    currentName={project.name}
                    currentUserRole={currentUserRole}
                />
            </div>

            <MessageList
                initialMessages={formattedMessages}
                teamId={teamId}
                projectId={projectId}
                currentUserId={user.id}
            />

            <ChatInput teamId={teamId} projectId={projectId} members={members} />
        </div>
    )
}
