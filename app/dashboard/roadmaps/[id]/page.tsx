import { copyRoadmapFromShare, syncRoadmap } from '@/app/dashboard/roadmaps/actions'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { roadmaps, roadmapSteps, roadmapStepLinks, notes, learningPaths, resources, goals } from '@/lib/db/schema'
import { eq, and, inArray, asc } from 'drizzle-orm'
import { RoadmapEditor } from '@/components/roadmaps/RoadmapEditor'
import { RoadmapView } from '@/components/roadmaps/RoadmapView'

export default async function RoadmapPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { id } = await params
    const session = await auth()
    const user = session?.user

    const roadmapResults = await db.select().from(roadmaps).where(eq(roadmaps.id, id)).limit(1)
    const roadmap = roadmapResults[0]

    if (!roadmap) notFound()

    // Auto-copy logic for shared roadmaps
    if (user && roadmap.ownerId !== user.id) {
        // Check if user already has a copy of this roadmap
        const existingCopies = await db.select({
            id: roadmaps.id,
            updatedAt: roadmaps.updatedAt,
            createdAt: roadmaps.createdAt
        })
            .from(roadmaps)
            .where(and(
                eq(roadmaps.ownerId, user.id as string),
                eq(roadmaps.originalRoadmapId, roadmap.id),
                eq(roadmaps.copiedFromChat, true)
            ))
            .limit(1)

        const existingCopy = existingCopies[0]

        let redirectToId = null

        if (existingCopy) {
            const originalTime = new Date(roadmap.updatedAt || roadmap.createdAt).getTime()
            const copyTime = new Date(existingCopy.updatedAt || existingCopy.createdAt).getTime()

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
                if (newRoadmap && typeof newRoadmap !== 'string' && 'id' in newRoadmap) {
                    redirectToId = newRoadmap.id
                } else if (typeof newRoadmap === 'string') {
                    redirectToId = newRoadmap
                }
            } catch (e) {
                console.error('Failed to auto-copy roadmap:', e)
            }
        }

        if (redirectToId) {
            redirect(`/dashboard/roadmaps/${redirectToId}`)
        }
    }

    const stepsData = await db.select().from(roadmapSteps)
        .where(eq(roadmapSteps.roadmapId, id))
        .orderBy(asc(roadmapSteps.order))

    const steps = stepsData.map((step) => ({
        ...step,
        // RoadmapEditor uses snake_case; Drizzle returns camelCase — map explicitly
        parent_step_id: step.parentStepId ?? null,
        links: [] as any[]
    }))

    if (steps.length > 0) {
        const stepIds = steps.map((s) => s.id)

        // Fetch all links for these steps
        const linksData = await db.select().from(roadmapStepLinks)
            .where(inArray(roadmapStepLinks.stepId, stepIds))

        if (linksData && linksData.length > 0) {
            console.log('Found links:', linksData.length)
            // Collect IDs for details
            const noteIds = linksData.filter(l => l.noteId).map(l => l.noteId!)
            const pathIds = linksData.filter(l => l.learningPathId).map(l => l.learningPathId!)
            const resourceIds = linksData.filter(l => l.resourceId).map(l => l.resourceId!)
            const goalIds = linksData.filter(l => l.goalId).map(l => l.goalId!)

            console.log('IDs to fetch:', { noteIds, pathIds, resourceIds, goalIds })

            // Fetch details in parallel
            const [notesRes, pathsRes, resourcesRes, goalsRes] = await Promise.all([
                noteIds.length > 0 ? db.select({ id: notes.id, title: notes.title }).from(notes).where(inArray(notes.id, noteIds)) : Promise.resolve([]),
                pathIds.length > 0 ? db.select({ id: learningPaths.id, title: learningPaths.title }).from(learningPaths).where(inArray(learningPaths.id, pathIds)) : Promise.resolve([]),
                resourceIds.length > 0 ? db.select({ id: resources.id, title: resources.title, type: resources.type }).from(resources).where(inArray(resources.id, resourceIds)) : Promise.resolve([]),
                goalIds.length > 0 ? db.select({ id: goals.id, title: goals.title }).from(goals).where(inArray(goals.id, goalIds)) : Promise.resolve([])
            ])

            const notesMap = new Map((notesRes as any[]).map((n) => [n.id, n]))
            const pathsMap = new Map((pathsRes as any[]).map((p) => [p.id, p]))
            const resourcesMap = new Map((resourcesRes as any[]).map((r) => [r.id, r]))
            const goalsMap = new Map((goalsRes as any[]).map((g) => [g.id, g]))

            // Map back to steps
            const linksByStepId = new Map()

            linksData.forEach((link) => {
                if (!linksByStepId.has(link.stepId)) linksByStepId.set(link.stepId, [])

                let detail = null
                let type = ''

                if (link.noteId) { detail = notesMap.get(link.noteId); type = 'note' }
                else if (link.learningPathId) { detail = pathsMap.get(link.learningPathId); type = 'path' }
                else if (link.resourceId) { detail = resourcesMap.get(link.resourceId); type = 'resource' }
                else if (link.goalId) { detail = goalsMap.get(link.goalId); type = 'goal' }

                if (detail) {
                    linksByStepId.get(link.stepId).push({
                        link_id: link.id, // Explicitly name it link_id
                        type,
                        ...detail,
                        id: detail.id // Ensure id is resource ID
                    })
                }
            })

            steps.forEach((step) => {
                if (linksByStepId.has(step.id)) {
                    step.links = linksByStepId.get(step.id)
                }
            })
            console.log('Steps with links:', steps.filter((s) => s.links && s.links.length > 0).length)
        } else {
            console.log('No links found in roadmap_step_links query')
        }
    }

    // If user is owner, show Editor. Else show View.
    if (roadmap.ownerId === user?.id) {
        return <RoadmapEditor roadmap={roadmap as any} initialSteps={steps || []} />
    }

    // If user has access but is not owner, show Read Only view
    return <RoadmapView roadmap={roadmap as any} steps={steps || []} currentUserId={user!.id as string} />
}
