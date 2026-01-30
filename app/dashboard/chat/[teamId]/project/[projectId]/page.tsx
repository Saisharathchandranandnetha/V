import { createClient } from '@/lib/supabase/server'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { Folder, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

    // Parallelize independent fetches
    const projectPromise = supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single()

    const membersPromise = getTeamMembers(teamId)

    // Fetch latest 50 messages (reverse order for limit)
    const messagesPromise = supabase
        .from('team_messages')
        .select(`
        *,
        sender:users(name, avatar, email),
        message_reads(user_id)
    `)
        .eq('team_id', teamId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50)

    const [
        { data: project },
        members,
        { data: rawMessages }
    ] = await Promise.all([
        projectPromise,
        membersPromise,
        messagesPromise
    ])

    if (!project) {
        return <div>Project not found</div>
    }

    // Sort messages back to chronological order
    const messages = rawMessages?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []

    const currentUserRole = members.find(m => m.id === user.id)?.role || 'member'

    const totalMembers = members.length

    const formattedMessages = messages?.map(msg => {
        const reads = msg.message_reads || []
        const uniqueReaders = new Set(reads.map((r: any) => r.user_id))

        let readStatus: 'sent' | 'delivered' | 'read' = 'sent'
        if (uniqueReaders.size >= totalMembers - 1) {
            readStatus = 'read'
        } else if (uniqueReaders.size > 0) {
            readStatus = 'delivered'
        }

        return {
            ...msg,
            is_sender: msg.sender_id === user.id,
            sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
            read_status: readStatus,
            message_reads: reads
        }
    }) || []

    return (
        <div className="flex-1 flex flex-col min-h-0 w-full">
            <div className="h-14 border-b border-border flex items-center px-4 md:px-6 bg-card/50 backdrop-blur-sm shrink-0 justify-between gap-3">
                <div className="flex items-center gap-3 font-semibold overflow-hidden">
                    <Link href="/dashboard/chat" className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center gap-2 truncate">
                        <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{project.name}</span>
                    </div>
                </div>
                <ProjectSettingsDialog
                    teamId={teamId}
                    projectId={projectId}
                    currentName={project.name}
                    currentUserRole={currentUserRole}
                />
            </div>

            <div className="flex-1 min-h-0 relative w-full flex flex-col">
                <ChatContainer
                    initialMessages={formattedMessages}
                    teamId={teamId}
                    projectId={projectId}
                    currentUser={{
                        id: user.id,
                        name: user.user_metadata.name || user.email?.split('@')[0] || 'User',
                        avatar: user.user_metadata.avatar_url || '',
                        email: user.email!
                    }}
                    members={members}
                />
            </div>
        </div>
    )
}
