'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { roadmaps, teamMessages, chatSharedItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function shareRoadmapAndSend(teamId: string, projectId: string | undefined, roadmapId: string, content: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Not authenticated')
    const userId = session.user.id

    // 0. Fetch Roadmap details for metadata
    const [roadmap] = await db.select({ title: roadmaps.title })
        .from(roadmaps)
        .where(eq(roadmaps.id, roadmapId))
        .limit(1)

    if (!roadmap) throw new Error('Roadmap not found')

    // 1. Create message
    const [message] = await db.insert(teamMessages)
        .values({
            teamId,
            projectId: projectId || null,
            senderId: userId,
            message: content,
            metadata: {
                attachments: [
                    {
                        type: 'roadmap',
                        item: {
                            id: roadmapId,
                            title: roadmap.title
                        }
                    }
                ]
            }
        })
        .returning()

    if (!message) throw new Error('Failed to create message')

    // 2. Create shared item
    try {
        await db.insert(chatSharedItems).values({
            chatMessageId: message.id,
            teamId,
            projectId: projectId || null,
            sharedItemId: roadmapId,
            sharedType: 'roadmap',
            sharedBy: userId
        })
    } catch (shareError: any) {
        // Cleanup message if sharing fails
        await db.delete(teamMessages).where(eq(teamMessages.id, message.id))
        throw new Error(shareError.message)
    }

    return message
}
