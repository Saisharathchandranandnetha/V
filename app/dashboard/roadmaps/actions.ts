'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createRoadmap(data: {
    title: string
    description?: string
    teamId?: string
    projectId?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: roadmap, error } = await supabase
        .from('roadmaps')
        .insert({
            title: data.title,
            description: data.description,
            owner_id: user.id,
            team_id: data.teamId || null,
            project_id: data.projectId || null,
            status: 'draft'
        })
        .select()
        .single()

    if (error) {
        console.error('Create Roadmap Error:', error)
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/roadmaps')
    redirect(`/dashboard/roadmaps/${roadmap.id}`)
}

export async function updateRoadmap(id: string, data: {
    title?: string
    description?: string
    status?: 'draft' | 'active' | 'completed'
    progress?: number
}) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('roadmaps')
        .update(data)
        .eq('id', id)

    if (error) {
        console.error('Update Roadmap Error:', error)
        throw new Error(error.message)
    }
    revalidatePath(`/dashboard/roadmaps/${id}`)
    revalidatePath('/dashboard/roadmaps')
}

export async function deleteRoadmap(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('roadmaps')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Delete Roadmap Error:', error)
        throw new Error(error.message)
    }
    revalidatePath('/dashboard/roadmaps')
    redirect('/dashboard/roadmaps')
}

export async function createRoadmapStep(roadmapId: string, data: {
    title: string
    order: number
    parentStepId?: string | null
}) {
    const supabase = await createClient()

    const { data: step, error } = await supabase
        .from('roadmap_steps')
        .insert({
            roadmap_id: roadmapId,
            title: data.title,
            order: data.order,
            parent_step_id: data.parentStepId || null
        })
        .select()
        .single()

    if (error) {
        console.error('Create Step Error:', error)
        throw new Error(error.message)
    }
    revalidatePath(`/dashboard/roadmaps/${roadmapId}`)
    return step
}

export async function updateRoadmapStep(id: string, data: {
    title?: string
    description?: string
    completed?: boolean
    linked_resource_id?: string | null
    linked_task_id?: string | null
    parent_step_id?: string | null
    linked_note_id?: string | null
    linked_path_id?: string | null
    linked_goal_id?: string | null
}) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('roadmap_steps')
        .update(data)
        .eq('id', id)

    if (error) {
        console.error('Update Step Error:', error)
        throw new Error(error.message)
    }

    // Auto-calculate progress if completed status changed
    if (data.completed !== undefined) {
        // This should ideally be a stored procedure or separate function, 
        // but for now we'll just trigger a re-calc on the client or handle it here.
        // Let's handle it here for correctness.
        await calculateRoadmapProgress(supabase, id)
    }

    // Get roadmap_id for revalidation of specific page
    const { data: step } = await supabase.from('roadmap_steps').select('roadmap_id').eq('id', id).single()
    if (step) {
        revalidatePath(`/dashboard/roadmaps/${step.roadmap_id}`)
    }
    revalidatePath(`/dashboard/roadmaps`) // to refresh progress
}

export async function calculateRoadmapProgress(supabase: any, stepId: string) {
    // Get roadmap_id from step
    const { data: step } = await supabase.from('roadmap_steps').select('roadmap_id').eq('id', stepId).single()
    if (!step) return

    const { count: total } = await supabase.from('roadmap_steps').select('*', { count: 'exact', head: true }).eq('roadmap_id', step.roadmap_id)
    const { count: completed } = await supabase.from('roadmap_steps').select('*', { count: 'exact', head: true }).eq('roadmap_id', step.roadmap_id).eq('completed', true)

    if (total && total > 0) {
        const progress = Math.round((completed || 0) / total * 100)
        await supabase.from('roadmaps').update({ progress }).eq('id', step.roadmap_id)
    }
}

export async function deleteRoadmapStep(id: string) {
    const supabase = await createClient()
    const { data: step } = await supabase.from('roadmap_steps').select('roadmap_id').eq('id', id).single()

    const { error } = await supabase.from('roadmap_steps').delete().eq('id', id)
    if (error) throw new Error(error.message)

    if (step) {
        revalidatePath(`/dashboard/roadmaps/${step.roadmap_id}`)
    }
}

export async function reorderSteps(items: { id: string, order: number }[]) {
    const supabase = await createClient()

    // This could be optimized, but doing parallel updates is fine for small lists
    await Promise.all(items.map(item =>
        supabase.from('roadmap_steps').update({ order: item.order }).eq('id', item.id)
    ))

    if (items.length > 0) {
        const { data: step } = await supabase.from('roadmap_steps').select('roadmap_id').eq('id', items[0].id).single()
        if (step) {
            revalidatePath(`/dashboard/roadmaps/${step.roadmap_id}`)
        }
    }
}

export async function copyRoadmapFromShare(originalRoadmapId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 1. Fetch original roadmap
    const { data: original, error: fetchError } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('id', originalRoadmapId)
        .single()

    if (fetchError || !original) throw new Error('Roadmap not found')

    // 2. Create COPY
    const { data: newRoadmap, error: createError } = await supabase
        .from('roadmaps')
        .insert({
            owner_id: user.id,
            title: original.title,
            description: original.description,
            status: 'active', // Copied ones start as active usually? Or draft? Prompt said "Independent progress".
            progress: 0,
            original_roadmap_id: original.id,
            copied_from_chat: true,
            // Clear team/project context as it's now personal
            team_id: null,
            project_id: null
        })
        .select()
        .single()

    if (createError) throw new Error(createError.message)

    // 3. Fetch steps
    const { data: steps } = await supabase
        .from('roadmap_steps')
        .select('*')
        .eq('roadmap_id', original.id)

    if (steps && steps.length > 0) {
        // 4. Insert steps for new roadmap
        // Clear linked items as they might not be accessible or need to be deep copied too?
        // Prompt says "Deep-copy ALL roadmap steps". It doesn't explicitly say to copy linked resources.
        // Usually linked resources are pointers. If I point to a resource I don't satisfy policies for, I can't see it.
        // But resources in Shared page are usually shared too. 
        // For now, I will keep the links. If the user can see the resource in the shared context, they might be able to see it here if they are in the team.
        // If it's a personal copy, ideally we should copy resources too, but that's recursive and complex.
        // I will just copy the step metadata.

        const newSteps = steps.map(step => ({
            roadmap_id: newRoadmap.id,
            title: step.title,
            description: step.description,
            order: step.order,
            completed: false, // Reset completion
            linked_resource_id: step.linked_resource_id, // Keep link? Maybe.
            linked_note_id: step.linked_note_id,
            linked_path_id: step.linked_path_id,
            linked_task_id: null // Reset task links as tasks are definitely personal states
        }))

        const { error: stepsError } = await supabase.from('roadmap_steps').insert(newSteps)
        if (stepsError) throw new Error(stepsError.message)
    }

    return newRoadmap
}

export async function addStepLink(stepId: string, type: 'note' | 'path' | 'resource' | 'goal', resourceId: string) {
    const supabase = await createClient()

    const data: any = {
        step_id: stepId,
    }

    if (type === 'note') data.note_id = resourceId
    if (type === 'path') data.learning_path_id = resourceId
    if (type === 'resource') data.resource_id = resourceId
    if (type === 'goal') data.goal_id = resourceId

    const { error } = await supabase.from('roadmap_step_links').insert(data)

    if (error) {
        console.error('Add Link Error:', error)
        throw new Error(error.message)
    }

    const { data: step } = await supabase.from('roadmap_steps').select('roadmap_id').eq('id', stepId).single()
    if (step) {
        revalidatePath(`/dashboard/roadmaps/${step.roadmap_id}`)
    }
}

export async function removeStepLink(linkId: string) {
    const supabase = await createClient()

    // Get step_id first for revalidation
    const { data: link } = await supabase.from('roadmap_step_links').select('step_id').eq('id', linkId).single()

    if (link) {
        const { data: step } = await supabase.from('roadmap_steps').select('roadmap_id').eq('id', link.step_id).single()

        const { error } = await supabase.from('roadmap_step_links').delete().eq('id', linkId)
        if (error) throw new Error(error.message)

        if (step) {
            revalidatePath(`/dashboard/roadmaps/${step.roadmap_id}`)
        }
    }
}
