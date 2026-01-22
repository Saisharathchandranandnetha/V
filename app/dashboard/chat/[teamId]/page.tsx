import { createClient } from '@/lib/supabase/server'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { Separator } from '@/components/ui/separator'
import { Hash } from 'lucide-react'

interface TeamChatPageProps {
    params: Promise<{
        teamId: string
    }>
}

import { getTeamMembers } from '@/app/dashboard/teams/actions'

export default async function TeamChatPage(props: TeamChatPageProps) {
    const params = await props.params;
    const { teamId } = params;
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch Team Details
    const { data: team } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single()

    if (!team) {
        return <div>Team not found</div>
    }

    // Fetch Members for Quick Task
    const members = await getTeamMembers(teamId)

    // Fetch Initial Messages
    const { data: messages } = await supabase
        .from('team_messages')
        .select(`
        *,
        sender:users(name, avatar, email)
    `)
        .eq('team_id', teamId)
        .is('project_id', null) // Team only chat
        .order('created_at', { ascending: true })

    // Transform messages to add is_sender
    const formattedMessages = messages?.map(msg => ({
        ...msg,
        is_sender: msg.sender_id === user.id,
        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
    })) || []

    return (
        <div className="flex flex-col h-full">
            <div className="h-14 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-sm shrink-0 justify-between">
                <div className="flex items-center gap-2 font-semibold">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    {team.name}
                    <span className="text-muted-foreground font-normal ml-2 text-xs border border-border px-2 py-0.5 rounded-full">General</span>
                </div>
            </div>

            <MessageList
                initialMessages={formattedMessages}
                teamId={teamId}
                currentUserId={user.id}
            />

            <ChatInput teamId={teamId} members={members} />
        </div>
    )
}
