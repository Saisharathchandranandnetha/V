import { auth } from '@/auth'
import { db } from '@/lib/db'
import { teamMessages, messageReads, users } from '@/lib/db/schema'
import { eq, inArray, asc, desc, and, isNull, lt } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getTeamMembers } from '@/app/dashboard/teams/actions'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = session.user

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')
    const projectId = searchParams.get('projectId')
    const cursorStr = searchParams.get('cursor')
    const limit = 50

    if (!teamId) return NextResponse.json({ error: 'teamId is required' }, { status: 400 })

    const dateCursor = cursorStr ? new Date(cursorStr) : new Date()

    const conditions = [
        eq(teamMessages.teamId, teamId),
        projectId ? eq(teamMessages.projectId, projectId) : isNull(teamMessages.projectId),
        lt(teamMessages.createdAt, dateCursor)
    ]

    const rawMessages = await db.select({
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
        .where(and(...conditions))
        .orderBy(desc(teamMessages.createdAt))
        .limit(limit)

    // Reverse to maintain chronological order
    rawMessages.reverse()

    if (rawMessages.length === 0) {
        return NextResponse.json({ messages: [] })
    }

    const members = await getTeamMembers(teamId)
    const totalMembers = members.length

    const messageIds = rawMessages.map(m => m.id)
    const readsData = await db.select().from(messageReads).where(inArray(messageReads.messageId, messageIds))

    const readsMap = new Map()
    readsData.forEach((r: any) => {
        if (!readsMap.has(r.messageId)) readsMap.set(r.messageId, [])
        readsMap.get(r.messageId).push({ user_id: r.userId })
    })

    const formattedMessages = rawMessages.map(msg => {
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

    return NextResponse.json({ messages: formattedMessages })
}
