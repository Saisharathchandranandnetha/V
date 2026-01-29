import { copyRoadmapFromShare, syncRoadmap } from '@/app/dashboard/roadmaps/actions'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoadmapEditor } from '@/components/roadmaps/RoadmapEditor'
import { RoadmapView } from '@/components/roadmaps/RoadmapView'

export default async function RoadmapPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: roadmap, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !roadmap) notFound()

    // Auto-copy logic for shared roadmaps
    if (user && roadmap.owner_id !== user.id) {
        // Check if user already has a copy of this roadmap
        const { data: existingCopy } = await supabase
            .from('roadmaps')
            .select('id, updated_at, created_at')
            .eq('owner_id', user.id)
            .eq('original_roadmap_id', roadmap.id)
            .eq('copied_from_chat', true)
            .single()

        let redirectToId = null

        if (existingCopy) {
            const originalTime = new Date(roadmap.updated_at).getTime()
            const copyTime = new Date(existingCopy.updated_at || existingCopy.created_at).getTime()

            if (originalTime > copyTime) {
                try {
                    console.log('Syncing shared roadmap...')
                    await syncRoadmap(existingCopy.id, roadmap.id)
                    redirectToId = existingCopy.id
                } catch (e) {
                    console.error('Failed to sync roadmap:', e)
                    redirectToId = existingCopy.id
                }
            } else {
                redirectToId = existingCopy.id
            }
        } else {
            // Not copied yet.
            try {
                console.log('Auto-copying shared roadmap...')
                const newRoadmap = await copyRoadmapFromShare(roadmap.id)
                redirectToId = newRoadmap.id
            } catch (e) {
                console.error('Failed to auto-copy roadmap:', e)
            }
        }

        if (redirectToId) {
            redirect(`/dashboard/roadmaps/${redirectToId}`)
        }
    }

    const { data: stepsData } = await supabase
        .from('roadmap_steps')
        .select('*')
        .eq('roadmap_id', id)
        .order('order', { ascending: true })

    const steps = (stepsData || []).map((step: any) => ({
        ...step,
        links: []
    }))

    if (steps.length > 0) {
        const stepIds = steps.map((s: any) => s.id)

        // Fetch all links for these steps
        const { data: links } = await supabase
            .from('roadmap_step_links')
            .select('*')
            .in('step_id', stepIds)

        if (links && links.length > 0) {
            console.log('Found links:', links.length)
            // Collect IDs for details
            const noteIds = links.filter((l: any) => l.note_id).map((l: any) => l.note_id)
            const pathIds = links.filter((l: any) => l.learning_path_id).map((l: any) => l.learning_path_id)
            const resourceIds = links.filter((l: any) => l.resource_id).map((l: any) => l.resource_id)
            const goalIds = links.filter((l: any) => l.goal_id).map((l: any) => l.goal_id)

            console.log('IDs to fetch:', { noteIds, pathIds, resourceIds, goalIds })

            // Fetch details in parallel
            const [notesRes, pathsRes, resourcesRes, goalsRes] = await Promise.all([
                noteIds.length > 0 ? supabase.from('notes').select('id, title').in('id', noteIds) : Promise.resolve({ data: [] }),
                pathIds.length > 0 ? supabase.from('learning_paths').select('id, title').in('id', pathIds) : Promise.resolve({ data: [] }),
                resourceIds.length > 0 ? supabase.from('resources').select('id, title, type').in('id', resourceIds) : Promise.resolve({ data: [] }),
                goalIds.length > 0 ? supabase.from('goals').select('id, title').in('id', goalIds) : Promise.resolve({ data: [] })
            ])

            const notesMap = new Map(notesRes.data?.map((n: any) => [n.id, n]) || [])
            const pathsMap = new Map(pathsRes.data?.map((p: any) => [p.id, p]) || [])
            const resourcesMap = new Map(resourcesRes.data?.map((r: any) => [r.id, r]) || [])
            const goalsMap = new Map(goalsRes.data?.map((g: any) => [g.id, g]) || [])

            // Map back to steps
            const linksByStepId = new Map()

            links.forEach((link: any) => {
                if (!linksByStepId.has(link.step_id)) linksByStepId.set(link.step_id, [])

                let detail = null
                let type = ''

                if (link.note_id) { detail = notesMap.get(link.note_id); type = 'note' }
                else if (link.learning_path_id) { detail = pathsMap.get(link.learning_path_id); type = 'path' }
                else if (link.resource_id) { detail = resourcesMap.get(link.resource_id); type = 'resource' }
                else if (link.goal_id) { detail = goalsMap.get(link.goal_id); type = 'goal' }

                if (detail) {
                    linksByStepId.get(link.step_id).push({
                        link_id: link.id, // Explicitly name it link_id
                        type,
                        ...detail,
                        id: detail.id // Ensure id is resource ID
                    })
                }
            })

            steps.forEach((step: any) => {
                if (linksByStepId.has(step.id)) {
                    step.links = linksByStepId.get(step.id)
                }
            })
            console.log('Steps with links:', steps.filter((s: any) => s.links && s.links.length > 0).length)
        } else {
            console.log('No links found in roadmap_step_links query')
        }
    }

    // If user is owner, show Editor. Else show View.
    if (roadmap.owner_id === user?.id) {
        return <RoadmapEditor roadmap={roadmap} initialSteps={steps || []} />
    }

    // If user has access (via RLS) but is not owner, show Read Only view
    return <RoadmapView roadmap={roadmap} steps={steps || []} currentUserId={user!.id} />
}
