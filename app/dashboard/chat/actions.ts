'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { teamMessages, chatSharedItems, tasks, messageReads, users, projects } from '@/lib/db/schema'
import { eq, and, ne, gte, isNull, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import Ably from 'ably'

export async function sendMessage(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const message = formData.get('message') as string
    const teamId = formData.get('teamId') as string
    let projectId: string | null = formData.get('projectId') as string
    const metadataRaw = formData.get('metadata') as string

    if (projectId === 'undefined' || projectId === 'null' || !projectId) projectId = null
    if ((!message && !metadataRaw) || !teamId) throw new Error('Message or Attachment and Team ID are required')

    let metadata = null
    try { if (metadataRaw) metadata = JSON.parse(metadataRaw) } catch { }

    const [insertedMessage] = await db.insert(teamMessages).values({
        teamId,
        projectId,
        message,
        senderId: session.user.id,
        metadata,
    }).returning()

    // Handle shared item attachments
    const attachments = metadata?.attachments || (metadata?.attachment ? [metadata.attachment] : [])
    if (attachments.length > 0) {
        const validTypes = ['resource', 'note', 'learning_path', 'roadmap']
        const records = attachments
            .filter((a: any) => validTypes.includes(a.type) && a.item?.id)
            .map((a: any) => ({
                teamId, projectId: projectId || null,
                chatMessageId: insertedMessage.id,
                sharedType: a.type, sharedItemId: a.item.id, sharedBy: session.user!.id!,
            }))
        if (records.length > 0) await db.insert(chatSharedItems).values(records)
    }

    // Publish to Ably for realtime
    if (process.env.ABLY_API_KEY) {
        try {
            const ably = new Ably.Rest(process.env.ABLY_API_KEY)
            const channelName = `chat:${teamId}:${projectId || 'team'}`
            const channel = ably.channels.get(channelName)
            await channel.publish('new-message', {
                id: insertedMessage.id,
                team_id: insertedMessage.teamId,
                project_id: insertedMessage.projectId,
                sender_id: insertedMessage.senderId,
                message: insertedMessage.message,
                created_at: insertedMessage.createdAt,
                metadata: insertedMessage.metadata,
                sender: {
                    name: session.user.name,
                    avatar: session.user.image,
                    email: session.user.email
                }
            })
        } catch (e) { console.error('Ably publish error:', e) }
    }
}

export async function markMessageAsRead(messageId: string) {
    const session = await auth()
    if (!session?.user?.id) return

    try {
        await db.insert(messageReads).values({ messageId, userId: session.user.id })
    } catch { } // Ignore duplicate
}

export async function createTaskFromMessage(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const title = formData.get('title') as string
    const teamId = formData.get('teamId') as string
    const projectId = formData.get('projectId') as string || null
    const assignedTo = formData.get('assignedTo') as string || null
    const dueDate = formData.get('dueDate') as string
    const priority = formData.get('priority') as string

    await db.insert(tasks).values({
        title, teamId,
        projectId: projectId || null,
        assignedTo: assignedTo || null,
        userId: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'Medium',
        status: 'Todo',
    })

    revalidatePath(`/dashboard/chat/${teamId}`)
}

export async function createTaskDirectly(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const title = formData.get('title') as string
    const teamId = formData.get('teamId') as string
    const projectId = formData.get('projectId') as string || null
    const assignedTo = formData.get('assignedTo') as string || null
    const dueDate = formData.get('dueDate') as string
    const priority = formData.get('priority') as string

    if (!title || !teamId) throw new Error('Title and Team ID required')

    const [userData] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, session.user.id)).limit(1)
    const assignerName = userData?.name || userData?.email || 'Unknown User'

    let description = `Task assigned by ${assignerName}`
    if (projectId) {
        const [project] = await db.select({ name: projects.name }).from(projects).where(eq(projects.id, projectId)).limit(1)
        if (project) description = `Task assigned from project: ${project.name} by ${assignerName}`
    }

    await db.insert(tasks).values({
        title, teamId,
        projectId: projectId || null,
        assignedTo: assignedTo || null,
        userId: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'Todo',
        priority: priority || 'Medium',
        description,
    })

    if (assignedTo) {
        try {
            const [assigneeData] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, assignedTo)).limit(1)
            const assigneeName = assigneeData?.name || assigneeData?.email || 'Unknown'
            await db.insert(teamMessages).values({
                teamId, projectId: projectId || null,
                message: `Assigned task '${title}' to ${assigneeName}`,
                senderId: session.user.id, type: 'system',
            })
        } catch { }
    }

    revalidatePath(`/dashboard/chat/${teamId}`)
    revalidatePath('/dashboard/tasks')
}

export async function updateProject(formData: FormData) {
    const projectId = formData.get('projectId') as string
    const name = formData.get('name') as string
    const teamId = formData.get('teamId') as string
    if (!projectId || !name) throw new Error('Project ID and Name required')

    await db.update(projects).set({ name }).where(eq(projects.id, projectId))
    revalidatePath(`/dashboard/chat/${teamId}`)
}

export async function deleteProject(projectId: string, teamId: string) {
    await db.delete(projects).where(eq(projects.id, projectId))
    revalidatePath(`/dashboard/chat/${teamId}`)
}

export async function deleteMessage(messageId: string, teamId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const [message] = await db.select({ senderId: teamMessages.senderId }).from(teamMessages).where(eq(teamMessages.id, messageId)).limit(1)
    if (!message) return
    if (message.senderId !== session.user.id) throw new Error('You can only delete your own messages')

    await db.delete(teamMessages).where(eq(teamMessages.id, messageId))
    revalidatePath(`/dashboard/chat/${teamId}`)
}

export async function getUnreadCounts() {
    const session = await auth()
    if (!session?.user?.id) return {}

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const unreadMessages = await db.select({
        teamId: teamMessages.teamId,
        projectId: teamMessages.projectId,
    }).from(teamMessages)
        .leftJoin(messageReads, and(
            eq(teamMessages.id, messageReads.messageId),
            eq(messageReads.userId, session.user.id)
        ))
        .where(and(
            ne(teamMessages.senderId, session.user.id),
            gte(teamMessages.createdAt, thirtyDaysAgo),
            isNull(messageReads.id)
        ))

    const unreadCounts: Record<string, number> = {}
    for (const msg of unreadMessages) {
        if (msg.teamId) unreadCounts[msg.teamId] = (unreadCounts[msg.teamId] || 0) + 1
        if (msg.projectId) unreadCounts[msg.projectId] = (unreadCounts[msg.projectId] || 0) + 1
    }

    return unreadCounts
}

export async function markProjectMessagesAsRead(teamId: string, projectId: string | null) {
    const session = await auth()
    if (!session?.user?.id) return
    const userId = session.user.id

    const messages = await db.select({ id: teamMessages.id })
        .from(teamMessages)
        .where(and(
            eq(teamMessages.teamId, teamId),
            ne(teamMessages.senderId, session.user.id),
            projectId ? eq(teamMessages.projectId, projectId) : isNull(teamMessages.projectId)
        ))
        .orderBy(desc(teamMessages.createdAt))
        .limit(50)

    if (messages.length > 0) {
        const insertData = messages.map(msg => ({ messageId: msg.id, userId }))
        await db.insert(messageReads).values(insertData).onConflictDoNothing()
    }

    revalidatePath('/dashboard/chat')
}

export async function getAttachmentItems(type: 'resource' | 'note' | 'learning_path' | 'finance' | 'roadmap') {
    const session = await auth()
    if (!session?.user?.id) return []

    const { resources, notes, learningPaths, roadmaps } = await import('@/lib/db/schema')

    if (type === 'resource') {
        const items = await db.select({ id: resources.id, title: resources.title }).from(resources).where(eq(resources.userId, session.user.id)).limit(20)
        return items
    }
    if (type === 'note') {
        const items = await db.select({ id: notes.id, title: notes.title }).from(notes).where(eq(notes.userId, session.user.id)).limit(20)
        return items
    }
    if (type === 'learning_path') {
        const items = await db.select({ id: learningPaths.id, title: learningPaths.title }).from(learningPaths).where(eq(learningPaths.userId, session.user.id)).limit(20)
        return items
    }
    if (type === 'roadmap') {
        const items = await db.select({ id: roadmaps.id, title: roadmaps.title }).from(roadmaps).where(eq(roadmaps.ownerId, session.user.id)).limit(20)
        return items
    }
    if (type === 'finance') {
        const items = await db.select({ id: projects.id, title: projects.name }).from(projects).limit(20)
        return items.map(p => ({ id: p.id, title: p.title }))
    }
    return []
}
