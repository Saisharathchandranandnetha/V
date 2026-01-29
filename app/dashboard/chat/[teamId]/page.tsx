import { createClient } from '@/lib/supabase/server'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { Separator } from '@/components/ui/separator'
import { Hash, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
        sender:users(name, avatar, email),
        message_reads(user_id)
    `)
        .eq('team_id', teamId)
        .is('project_id', null) // Team only chat
        .order('created_at', { ascending: true })

    const totalMembers = members.length

    // Transform messages to add is_sender
    const formattedMessages = messages?.map(msg => {
        const reads = msg.message_reads || []
        // Read if read by (total - 1) others. 
        // Note: Assuming logic where I don't read my own messages in explicit table, or if I do, simpler threshold is just N-1.
        // Actually unique readers excluding sender is safer.
        const uniqueReaders = new Set(reads.map((r: any) => r.user_id))
        // If I am sender, I want to know if everyone else read it.
        // If I am NOT sender, I just see if I read it (usually).
        // But requested feature is double tick for SENDER.

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
        <div className="flex flex-col h-full">
            <div className="h-14 border-b border-border flex items-center px-4 md:px-6 bg-card/50 backdrop-blur-sm shrink-0 justify-between gap-3">
                <div className="flex items-center gap-3 font-semibold overflow-hidden">
                    <Link href="/dashboard/chat" className="md:hidden flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center gap-2 truncate">
                        <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{team.name}</span>
                        <span className="text-muted-foreground font-normal ml-2 text-xs border border-border px-2 py-0.5 rounded-full hidden sm:inline-block">General</span>
                    </div>
                </div>
            </div>

            <ChatContainer
                initialMessages={formattedMessages}
                teamId={teamId}
                currentUser={{
                    id: user.id,
                    name: user.user_metadata.name || user.email?.split('@')[0] || 'User',
                    avatar: user.user_metadata.avatar_url || '',
                    email: user.email!
                }}
                members={members}
            />
        </div>
    )
}
