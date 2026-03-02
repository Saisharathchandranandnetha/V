import { auth } from '@/auth'
import { db } from '@/lib/db'
import { teams, chatSharedItems, users, resources, notes, learningPaths, roadmaps } from '@/lib/db/schema'
import { eq, inArray, isNotNull, desc, and } from 'drizzle-orm'
import { SharedItemsList } from '@/components/chat/SharedItemsList'
import { Hash, Share2 } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function TeamSharedPage(props: { params: Promise<{ teamId: string }> }) {
    const params = await props.params;
    const { teamId } = params;

    const session = await auth()
    if (!session?.user?.id) return redirect('/login')

    const user = session.user

    // Get Team
    const [team] = await db.select({ name: teams.name })
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1)

    if (!team) return <div>Team not found</div>

    // Fetch Shared Items
    const sharedItemsRaw = await db.select({
        id: chatSharedItems.id,
        teamId: chatSharedItems.teamId,
        projectId: chatSharedItems.projectId,
        chatMessageId: chatSharedItems.chatMessageId,
        sharedType: chatSharedItems.sharedType,
        sharedItemId: chatSharedItems.sharedItemId,
        sharedBy: chatSharedItems.sharedBy,
        createdAt: chatSharedItems.createdAt,
        sharedByUserName: users.name,
        sharedByUserAvatar: users.image
    })
        .from(chatSharedItems)
        .leftJoin(users, eq(chatSharedItems.sharedBy, users.id))
        .where(eq(chatSharedItems.teamId, teamId))
        .orderBy(desc(chatSharedItems.createdAt))

    if (!sharedItemsRaw || sharedItemsRaw.length === 0) return <div>No shared items</div>

    // Map properties for UI compatibility
    const sharedItems = sharedItemsRaw.map(i => ({
        ...i,
        shared_type: i.sharedType,
        shared_item_id: i.sharedItemId,
        shared_by_user: {
            name: i.sharedByUserName,
            avatar: i.sharedByUserAvatar
        }
    }))

    const resourcesIds = sharedItems.filter(i => i.shared_type === 'resource').map(i => i.shared_item_id)
    const notesIds = sharedItems.filter(i => i.shared_type === 'note').map(i => i.shared_item_id)
    const pathIds = sharedItems.filter(i => i.shared_type === 'learning_path').map(i => i.shared_item_id)
    const roadmapIds = sharedItems.filter(i => i.shared_type === 'roadmap').map(i => i.shared_item_id)

    const [resourcesRes, notesRes, pathsRes, roadmapsRes] = await Promise.all([
        resourcesIds.length > 0 ? db.select().from(resources).where(inArray(resources.id, resourcesIds)) : Promise.resolve([]),
        notesIds.length > 0 ? db.select().from(notes).where(inArray(notes.id, notesIds)) : Promise.resolve([]),
        pathIds.length > 0 ? db.select().from(learningPaths).where(inArray(learningPaths.id, pathIds)) : Promise.resolve([]),
        roadmapIds.length > 0 ? db.select().from(roadmaps).where(inArray(roadmaps.id, roadmapIds)) : Promise.resolve([])
    ])

    const resourcesMap = new Map((resourcesRes || []).map((i: any) => [i.id, i]))
    const notesMap = new Map((notesRes || []).map((i: any) => [i.id, i]))
    const pathsMap = new Map((pathsRes || []).map((i: any) => [i.id, i]))
    const roadmapsMap = new Map((roadmapsRes || []).map((i: any) => [i.id, i]))

    // Check if user has already added these items
    const allOriginalIds = sharedItems.map(i => i.shared_item_id)

    const [userResources, userNotes, userPaths, userRoadmaps] = await Promise.all([
        allOriginalIds.length > 0 ? db.select({ originalItemId: resources.originalItemId }).from(resources).where(and(eq(resources.userId, user.id!), isNotNull(resources.originalItemId), inArray(resources.originalItemId, allOriginalIds))) : Promise.resolve([]),
        allOriginalIds.length > 0 ? db.select({ originalItemId: notes.originalItemId }).from(notes).where(and(eq(notes.userId, user.id!), isNotNull(notes.originalItemId), inArray(notes.originalItemId, allOriginalIds))) : Promise.resolve([]),
        allOriginalIds.length > 0 ? db.select({ originalItemId: learningPaths.originalItemId }).from(learningPaths).where(and(eq(learningPaths.userId, user.id!), isNotNull(learningPaths.originalItemId), inArray(learningPaths.originalItemId, allOriginalIds))) : Promise.resolve([]),
        allOriginalIds.length > 0 ? db.select({ originalRoadmapId: roadmaps.originalRoadmapId }).from(roadmaps).where(and(eq(roadmaps.ownerId, user.id!), isNotNull(roadmaps.originalRoadmapId), inArray(roadmaps.originalRoadmapId, allOriginalIds))) : Promise.resolve([])
    ])

    const addedSet = new Set([
        ...(userResources || []).map(i => i.originalItemId).filter(Boolean),
        ...(userNotes || []).map(i => i.originalItemId).filter(Boolean),
        ...(userPaths || []).map(i => i.originalItemId).filter(Boolean),
        ...(userRoadmaps || []).map(i => i.originalRoadmapId).filter(Boolean),
    ])

    const enrichedItems = sharedItems.map(item => {
        let details = {}
        if (item.shared_type === 'resource') details = resourcesMap.get(item.shared_item_id) || {}
        if (item.shared_type === 'note') details = notesMap.get(item.shared_item_id) || {}
        if (item.shared_type === 'learning_path') details = pathsMap.get(item.shared_item_id) || {}
        if (item.shared_type === 'roadmap') details = roadmapsMap.get(item.shared_item_id) || {}

        return {
            ...item,
            details,
            is_added: addedSet.has(item.shared_item_id)
        }
    }).filter(i => i.details && (i.details as any).title) // Filter out deleted originals

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="h-14 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-sm shrink-0 gap-4">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    {team.name}
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                    <Share2 className="h-4 w-4" />
                    Shared Content
                </div>
            </div>

            <SharedItemsList items={enrichedItems as any} teamId={teamId} />
        </div>
    )
}
