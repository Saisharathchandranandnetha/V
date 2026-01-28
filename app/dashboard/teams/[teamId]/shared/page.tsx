import { createClient } from '@/lib/supabase/server'
import { SharedItemsList } from '@/components/chat/SharedItemsList'
import { Hash, Share2 } from 'lucide-react'

interface SharedPageProps {
    params: Promise<{
        teamId: string
    }>
}

export default async function TeamSharedPage(props: SharedPageProps) {
    const params = await props.params;
    const { teamId } = params;
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get Team
    const { data: team } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single()

    if (!team) return <div>Team not found</div>

    // Fetch Shared Items with Details
    // This requires complex joining or multiple fetches.
    // Since Supabase join syntax on multiple foreign types is tricky inside distinct tables:
    // We'll fetch shared_items then fetch details.

    const { data: sharedItems } = await supabase
        .from('chat_shared_items')
        .select(`
            *,
            shared_by_user:users(name, avatar)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

    // Fetch details for each item
    // Optimization: Group by type and fetch in batch

    if (!sharedItems) return <div>No shared items</div>

    const resourcesIds = sharedItems.filter(i => i.shared_type === 'resource').map(i => i.shared_item_id)
    const notesIds = sharedItems.filter(i => i.shared_type === 'note').map(i => i.shared_item_id)
    const pathIds = sharedItems.filter(i => i.shared_type === 'learning_path').map(i => i.shared_item_id)
    const roadmapIds = sharedItems.filter(i => i.shared_type === 'roadmap').map(i => i.shared_item_id)

    const [resourcesRes, notesRes, pathsRes, roadmapsRes] = await Promise.all([
        resourcesIds.length > 0 ? supabase.from('resources').select('*').in('id', resourcesIds) : { data: [] },
        notesIds.length > 0 ? supabase.from('notes').select('*').in('id', notesIds) : { data: [] },
        pathIds.length > 0 ? supabase.from('learning_paths').select('*').in('id', pathIds) : { data: [] },
        roadmapIds.length > 0 ? supabase.from('roadmaps').select('*').in('id', roadmapIds) : { data: [] }
    ])

    const resourcesMap = new Map((resourcesRes.data || []).map(i => [i.id, i]))
    const notesMap = new Map((notesRes.data || []).map(i => [i.id, i]))
    const pathsMap = new Map((pathsRes.data || []).map(i => [i.id, i]))
    const roadmapsMap = new Map((roadmapsRes.data || []).map(i => [i.id, i]))

    // Check if user has already added these items
    // We need to fetch user's items which have original_item_id in these sets.

    const allOriginalIds = sharedItems.map(i => i.shared_item_id)

    const [userResources, userNotes, userPaths, userRoadmaps] = await Promise.all([
        allOriginalIds.length > 0 ? supabase.from('resources').select('original_item_id').eq('user_id', user.id).not('original_item_id', 'is', null).in('original_item_id', allOriginalIds) : { data: [] },
        allOriginalIds.length > 0 ? supabase.from('notes').select('original_item_id').eq('user_id', user.id).not('original_item_id', 'is', null).in('original_item_id', allOriginalIds) : { data: [] },
        allOriginalIds.length > 0 ? supabase.from('learning_paths').select('original_item_id').eq('user_id', user.id).not('original_item_id', 'is', null).in('original_item_id', allOriginalIds) : { data: [] },
        allOriginalIds.length > 0 ? supabase.from('roadmaps').select('original_roadmap_id').eq('owner_id', user.id).not('original_roadmap_id', 'is', null).in('original_roadmap_id', allOriginalIds) : { data: [] }
    ])

    const addedSet = new Set([
        ...(userResources.data || []).map(i => i.original_item_id),
        ...(userNotes.data || []).map(i => i.original_item_id),
        ...(userPaths.data || []).map(i => i.original_item_id),
        ...(userRoadmaps.data || []).map(i => i.original_roadmap_id),
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
