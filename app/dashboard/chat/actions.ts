'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(formData: FormData) {
    const supabase = await createClient()

    const message = formData.get('message') as string
    const teamId = formData.get('teamId') as string
    let projectId: string | null = formData.get('projectId') as string
    const metadataRaw = formData.get('metadata') as string

    // Sanitize projectId
    if (projectId === 'undefined' || projectId === 'null' || !projectId) {
        projectId = null
    }

    if ((!message && !metadataRaw) || !teamId) {
        throw new Error('Message or Attachment and Team ID are required')
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    let metadata = null
    try {
        if (metadataRaw) {
            metadata = JSON.parse(metadataRaw)
        }
    } catch (e) {
        console.error('Failed to parse metadata', e)
    }

    const { data: insertedMessage, error } = await supabase
        .from('team_messages')
        .insert({
            team_id: teamId,
            project_id: projectId, // already sanitized to null or string
            message,
            sender_id: user.id,
            metadata: metadata
        })
        .select()
        .single()

    if (error) {
        console.error('Error sending message:', JSON.stringify(error, null, 2))
        console.error('Debug Info:', { teamId, projectId, userId: user.id })
        throw new Error(`Failed to send message: ${error.message}`)
    }

    // Handle Shared Items
    // Handle Shared Items
    // Support new 'attachments' array or legacy 'attachment' object
    const attachments = metadata?.attachments || (metadata?.attachment ? [metadata.attachment] : [])

    if (attachments.length > 0) {
        const validTypes = ['resource', 'note', 'learning_path']
        const recordsToInsert = []

        for (const attachment of attachments) {
            const sharedType = attachment.type
            if (validTypes.includes(sharedType) && attachment.item?.id) {
                recordsToInsert.push({
                    team_id: teamId,
                    project_id: projectId || null,
                    chat_message_id: insertedMessage.id,
                    shared_type: sharedType as any,
                    shared_item_id: attachment.item.id,
                    shared_by: user.id
                })
            }
        }

        if (recordsToInsert.length > 0) {
            await supabase.from('chat_shared_items').insert(recordsToInsert)
        }
    }

    // We don't necessarily need to revalidate path if we are using Realtime, 
    // but it's good practice for initial load consistency.
    // revalidatePath(`/dashboard/chat/${teamId}`) 
}

export async function markMessageAsRead(messageId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
        .from('message_reads')
        .insert({
            message_id: messageId,
            user_id: user.id
        })
        // Ignore unique constraint violation if already read
        .select()

    if (error && error.code !== '23505') { // 23505 is unique_violation
        console.error('Error marking message as read:', error)
    }
}

export async function createTaskFromMessage(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const title = formData.get('title') as string
    const teamId = formData.get('teamId') as string
    const projectId = formData.get('projectId') as string
    const messageId = formData.get('messageId') as string
    const assignedTo = formData.get('assignedTo') as string
    const dueDate = formData.get('dueDate') as string
    const priority = formData.get('priority') as string

    const { error } = await supabase
        .from('tasks')
        .insert({
            title,
            team_id: teamId,
            project_id: projectId || null,
            created_from_message_id: messageId,
            assigned_to: assignedTo || null,
            user_id: user.id, // Creator
            due_date: dueDate || null,
            priority: priority || 'Medium',
            status: 'Todo'
        })

    if (error) {
        console.error('Error creating task from message:', error)
        throw new Error('Failed to create task')
    }

    revalidatePath(`/dashboard/chat/${teamId}`)
}

export async function createTaskDirectly(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const title = formData.get('title') as string
    const teamId = formData.get('teamId') as string
    const projectId = formData.get('projectId') as string
    const assignedTo = formData.get('assignedTo') as string
    const dueDate = formData.get('dueDate') as string

    if (!title || !teamId) throw new Error('Title and Team ID required')

    let description = ''

    // Fetch user name
    const { data: userData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single()

    const assignerName = userData?.name || userData?.email || 'Unknown User'

    // If created from a project, fetch project name and add note
    if (projectId) {
        const { data: project } = await supabase
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single()

        if (project) {
            description = `Task assigned from project: ${project.name} by ${assignerName}`
        }
    } else {
        description = `Task assigned by ${assignerName}`
    }

    const { error } = await supabase
        .from('tasks')
        .insert({
            title,
            team_id: teamId,
            project_id: projectId || null,
            assigned_to: assignedTo || null,
            user_id: user.id,
            due_date: dueDate || null,
            status: 'Todo',
            priority: 'Medium',
            description: description || null
        })

    if (error) {
        console.error('Error creating task:', error)
        throw new Error('Failed to create task')
    }

    revalidatePath(`/dashboard/chat/${teamId}`)
    revalidatePath('/dashboard/tasks')
}

export async function updateProject(formData: FormData) {
    const supabase = await createClient()
    const projectId = formData.get('projectId') as string
    const name = formData.get('name') as string
    const teamId = formData.get('teamId') as string

    if (!projectId || !name) throw new Error('Project ID and Name required')

    const { error } = await supabase
        .from('projects')
        .update({ name })
        .eq('id', projectId)

    if (error) {
        console.error('Error updating project:', error)
        throw new Error('Failed to update project')
    }

    revalidatePath(`/dashboard/chat/${teamId}/project/${projectId}`)
    revalidatePath(`/dashboard/chat/${teamId}`)
}

export async function deleteProject(projectId: string, teamId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

    if (error) {
        console.error('Error deleting project:', error)
        throw new Error('Failed to delete project')
    }

    revalidatePath(`/dashboard/chat/${teamId}`)
}

export async function deleteMessage(messageId: string, teamId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check ownership before delete
    // OR isAdmin/Owner (not strictly enforced here for speed, but good practice to constrain)
    const { data: message } = await supabase
        .from('team_messages')
        .select('sender_id')
        .eq('id', messageId)
        .single()

    if (!message) return // Already deleted?

    if (message.sender_id !== user.id) {
        throw new Error('You can only delete your own messages')
    }

    const { error } = await supabase
        .from('team_messages')
        .delete()
        .eq('id', messageId)

    if (error) {
        console.error('Error deleting message:', error)
        throw new Error('Failed to delete message')
    }

    revalidatePath(`/dashboard/chat/${teamId}`)
}
