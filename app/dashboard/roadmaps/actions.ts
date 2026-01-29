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
        // We perform a two-pass insert to handle parent-child relationships securely.
        // First, we generate valid UUIDs for all new steps so we can map OldID -> NewID immediately.
        // But supabase insert doesn't let us provide custom IDs effectively without risk or just relying on return.

        // Strategy:
        // 1. Map Old Step Order -> Old Step ID (assuming order is unique per roadmap? Usually yes)
        // 2. Insert keys first? No.
        // Better Strategy:
        // 1. Insert all steps with parent_step_id = NULL first.
        // 2. Build Map of OldID -> NewID (using Order as proxy if needed, or by fetching inserted rows)
        // 3. Update new steps with correct parent_step_id.

        const newStepsPayload = steps.map(step => ({
            roadmap_id: newRoadmap.id,
            title: step.title,
            description: step.description,
            order: step.order,
            completed: false,
            parent_step_id: null, // Set to NULL initially to avoid FK constraint errors
            linked_resource_id: step.linked_resource_id,
            linked_note_id: step.linked_note_id,
            linked_path_id: step.linked_path_id,
            linked_task_id: null
        }))

        const { data: insertedSteps, error: stepsError } = await supabase
            .from('roadmap_steps')
            .insert(newStepsPayload)
            .select()

        if (stepsError) throw new Error(stepsError.message)

        // Create Map: Old Step ID -> New Step ID
        // We match them by 'order'. This assumes 'order' is unique and preserved.
        const stepMap = new Map<string, string>() // OldID -> NewID

        insertedSteps.forEach(newStep => {
            const oldStep = steps.find(s => s.order === newStep.order)
            if (oldStep) {
                stepMap.set(oldStep.id, newStep.id)
            }
        })

        // Update parent_step_id for new steps
        const updatePromises = steps
            .filter(oldStep => oldStep.parent_step_id) // Only those with parents
            .map(async (oldStep) => {
                const newStepId = stepMap.get(oldStep.id)
                const newParentId = stepMap.get(oldStep.parent_step_id!)

                if (newStepId && newParentId) {
                    await supabase
                        .from('roadmap_steps')
                        .update({ parent_step_id: newParentId })
                        .eq('id', newStepId)
                }
            })

        await Promise.all(updatePromises)

        // 5. Copy Step Links (New Relation Table)
        const oldStepIds = steps.map(s => s.id)
        const { data: oldLinks } = await supabase
            .from('roadmap_step_links')
            .select('*')
            .in('step_id', oldStepIds)

        if (oldLinks && oldLinks.length > 0 && insertedSteps) {
            const newLinks = []
            for (const link of oldLinks) {
                // Find matching new step
                const newStepId = stepMap.get(link.step_id)
                if (newStepId) {
                    newLinks.push({
                        step_id: newStepId,
                        note_id: link.note_id,
                        learning_path_id: link.learning_path_id,
                        resource_id: link.resource_id,
                        goal_id: link.goal_id
                    })
                }
            }

            if (newLinks.length > 0) {
                await supabase.from('roadmap_step_links').insert(newLinks)
            }
        }
    }

    return newRoadmap
}

export async function syncRoadmap(copyId: string, originalId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 1. Fetch original steps
    const { data: originalSteps } = await supabase
        .from('roadmap_steps')
        .select('*')
        .eq('roadmap_id', originalId)

    if (!originalSteps || originalSteps.length === 0) return

    // 2. Fetch original Links
    const originalStepIds = originalSteps.map(s => s.id)
    const { data: originalLinks } = await supabase
        .from('roadmap_step_links')
        .select('*')
        .in('step_id', originalStepIds)

    // 3. Delete existing steps of the copy (Cascade deletes links)
    const { error: deleteError } = await supabase
        .from('roadmap_steps')
        .delete()
        .eq('roadmap_id', copyId)

    if (deleteError) throw new Error(deleteError.message)

    // 4. Insert new steps
    const newStepsPayload = originalSteps.map(step => ({
        roadmap_id: copyId,
        title: step.title,
        description: step.description,
        order: step.order,
        completed: false, // Reset completed on sync? Or try to preserve? For now reset or copy.
        // Logic: If sync, we want latest structure. Progress might be lost if we delete?
        // Ideally we should map old copy steps to new copy steps to preserve 'completed' if title matches?
        // User asked for "update", usually implies structure update. Progress preservation is tricky if steps changed.
        // For simplicity: Reset progress or assume user wants fresh copy if structure changed heavily.
        // Let's keep it simple: Reset. 
        parent_step_id: null,
        linked_resource_id: step.linked_resource_id,
        linked_note_id: step.linked_note_id,
        linked_path_id: step.linked_path_id,
        linked_task_id: null
    }))

    const { data: insertedSteps, error: stepsError } = await supabase
        .from('roadmap_steps')
        .insert(newStepsPayload)
        .select()

    if (stepsError) throw new Error(stepsError.message)

    // Remap Parent IDs
    const stepMap = new Map<string, string>() // OldID -> NewID
    insertedSteps.forEach(newStep => {
        const oldStep = originalSteps.find(s => s.order === newStep.order)
        if (oldStep) {
            stepMap.set(oldStep.id, newStep.id)
        }
    })

    const updatePromises = originalSteps
        .filter(oldStep => oldStep.parent_step_id)
        .map(async (oldStep) => {
            const newStepId = stepMap.get(oldStep.id)
            const newParentId = stepMap.get(oldStep.parent_step_id!)

            if (newStepId && newParentId) {
                await supabase
                    .from('roadmap_steps')
                    .update({ parent_step_id: newParentId })
                    .eq('id', newStepId)
            }
        })

    await Promise.all(updatePromises)

    // 5. Insert new links
    if (originalLinks && originalLinks.length > 0 && insertedSteps) {
        const newLinks = []
        for (const link of originalLinks) {
            const newStepId = stepMap.get(link.step_id)
            if (newStepId) {
                newLinks.push({
                    step_id: newStepId,
                    note_id: link.note_id,
                    learning_path_id: link.learning_path_id,
                    resource_id: link.resource_id,
                    goal_id: link.goal_id
                })
            }
        }

        if (newLinks.length > 0) {
            await supabase.from('roadmap_step_links').insert(newLinks)
        }
    }

    // 6. Update roadmap updated_at to match (or just touch it)
    await supabase.from('roadmaps').update({ updated_at: new Date().toISOString() }).eq('id', copyId)
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
