import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects, teamMessages, messageReads, users } from '@/lib/db/schema'
import { eq, inArray, desc, and } from 'drizzle-orm'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { Folder, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getTeamMembers } from '@/app/dashboard/teams/actions'
import { ProjectSettingsDialog } from '@/components/chat/ProjectSettingsDialog'
import { redirect } from 'next/navigation'

export default async function ProjectChatPage(props: { params: Promise<{ teamId: string, projectId: string }> }) {
    const params = await props.params;
    const { teamId, projectId } = params;

    const session = await auth()
    if (!session?.user?.id) return redirect('/login')

    const user = session.user

    // Fetch Project Details
    const projectPromise = db.select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)

    const membersPromise = getTeamMembers(teamId)

    // Fetch Initial Messages
    const messagesPromise = db.select({
        id: teamMessages.id,
        teamId: teamMessages.teamId,
        projectId: teamMessages.projectId,
        senderId: teamMessages.senderId,
        message: teamMessages.message,
        type: teamMessages.type,
        metadata: teamMessages.metadata,
        createdAt: teamMessages.createdAt,
        senderName: users.name,
        senderEmail: users.email,
        senderAvatar: users.image
    })
        .from(teamMessages)
        .leftJoin(users, eq(teamMessages.senderId, users.id))
        .where(and(eq(teamMessages.teamId, teamId), eq(teamMessages.projectId, projectId)))
        .orderBy(desc(teamMessages.createdAt))
        .limit(50)

    const [
        projectResults,
        members,
        rawMessages
    ] = await Promise.all([
        projectPromise,
        membersPromise,
        messagesPromise
    ])

    const project = projectResults[0]

    if (!project) {
        return <div>Project not found</div>
    }

    const totalMembers = members.length
    const currentUserRole = members.find(m => m.id === user.id)?.role || 'member'

    // Sort descending messages back ascending for view
    const sortedMessages = rawMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    // Fetch Read Receipts
    const messageIds = sortedMessages.map(m => m.id)
    const readsData = messageIds.length > 0
        ? await db.select().from(messageReads).where(inArray(messageReads.messageId, messageIds))
        : []

    // Map Reads
    const readsMap = new Map()
    readsData.forEach((r: any) => {
        if (!readsMap.has(r.messageId)) readsMap.set(r.messageId, [])
        readsMap.get(r.messageId).push({ user_id: r.userId })
    })

    // Transform messages
    const formattedMessages = sortedMessages.map(msg => {
        const reads = readsMap.get(msg.id) || []
        const uniqueReaders = new Set(reads.map((r: any) => r.user_id))

        let readStatus: 'sent' | 'delivered' | 'read' = 'sent'
        if (uniqueReaders.size >= totalMembers - 1) {
            readStatus = 'read'
        } else if (uniqueReaders.size > 0) {
            readStatus = 'delivered'
        }

        return {
            ...msg,
            team_id: msg.teamId,
            project_id: msg.projectId,
            sender_id: msg.senderId,
            created_at: msg.createdAt,
            is_sender: msg.senderId === user.id,
            sender: {
                name: msg.senderName,
                avatar: msg.senderAvatar,
                email: msg.senderEmail
            },
            read_status: readStatus,
            message_reads: reads
        }
    })

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
                    initialMessages={formattedMessages as any}
                    teamId={teamId}
                    projectId={projectId}
                    currentUser={{
                        id: user.id || '',
                        name: user.name || user.email?.split('@')[0] || 'User',
                        avatar: user.image || '',
                        email: user.email!
                    }}
                    members={members}
                />
            </div>
        </div>
    )
}
