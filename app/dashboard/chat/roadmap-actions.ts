'use server'

import { createClient } from '@/lib/supabase/server'

export async function shareRoadmapAndSend(teamId: string, projectId: string | undefined, roadmapId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 0. Fetch Roadmap details for metadata
    const { data: roadmap, error: rError } = await supabase
        .from('roadmaps')
        .select('title')
        .eq('id', roadmapId)
        .single()

    if (rError || !roadmap) throw new Error('Roadmap not found')

    // 1. Create message
    const { data: message, error: msgError } = await supabase
        .from('team_messages')
        .insert({
            team_id: teamId,
            project_id: projectId || null,
            sender_id: user.id,
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
        .select()
        .single() // Return single row

    if (msgError) throw new Error(msgError.message)

    // 2. Create shared item
    const { error: shareError } = await supabase
        .from('chat_shared_items')
        .insert({
            chat_message_id: message.id,
            team_id: teamId,
            project_id: projectId || null,
            shared_item_id: roadmapId,
            shared_type: 'roadmap',
            shared_by: user.id
        })

    if (shareError) {
        // Cleanup message if sharing fails (optional but good practice)
        await supabase.from('team_messages').delete().eq('id', message.id)
        throw new Error(shareError.message)
    }

    return message
}
