'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTeam(formData: FormData) {
    // We need normal client for auth check
    const supabase = await createClient()
    const name = formData.get('name') as string

    if (!name) {
        throw new Error('Team name is required')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('Unauthorized')
    }

    // Use Admin Client to bypass RLS for team creation if RPC is missing
    const adminClient = await createAdminClient()

    // 1. Create Team
    const { data: team, error: teamError } = await adminClient
        .from('teams')
        .insert({
            name,
            created_by: user.id
        })
        .select()
        .single()

    if (teamError) {
        console.error('Error creating team (Admin):', teamError)
        throw new Error('Failed to create team')
    }

    // 2. Add Member as Owner
    const { error: memberError } = await adminClient
        .from('team_members')
        .insert({
            team_id: team.id,
            user_id: user.id,
            role: 'owner'
        })

    if (memberError) {
        console.error('Error adding team member (Admin):', memberError)
        // Cleanup? If member add fails, we have an orphan team. 
        // Ideally we delete the team.
        await adminClient.from('teams').delete().eq('id', team.id)
        throw new Error('Failed to join team')
    }

    revalidatePath('/dashboard/chat')
    return team.id
}

export async function createProject(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const teamId = formData.get('teamId') as string
    const membersJson = formData.get('members') as string

    let members: string[] = []
    try {
        members = membersJson ? JSON.parse(membersJson) : []
    } catch (e) {
        console.error("Failed to parse members", e)
    }

    if (!name || !teamId) {
        throw new Error('Project name and Team ID are required')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Start a transaction-like flow (Standard fetch doesn't support explicit transactions easily, we chain)
    const { data: project, error } = await supabase
        .from('projects')
        .insert({
            name,
            team_id: teamId,
            created_by: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating project:', error)
        throw new Error('Failed to create project')
    }

    // Add creator to members automatically
    const membersToAdd = new Set([...members, user.id])

    const projectMembers = Array.from(membersToAdd).map(userId => ({
        project_id: project.id,
        user_id: userId,
        role: userId === user.id ? 'owner' : 'member'
    }))

    if (projectMembers.length > 0) {
        const { error: membersError } = await supabase
            .from('project_members')
            .insert(projectMembers)

        if (membersError) {
            console.error('Error adding project members:', membersError)
            // Non-fatal? Or fatal? Project exists but members missing.
            // We'll log it.
        }
    }

    revalidatePath('/dashboard/chat')
    revalidatePath(`/dashboard/chat/${teamId}`)
}

export async function addTeamMember(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const teamId = formData.get('teamId') as string

    if (!email || !teamId) {
        return { success: false, error: 'Email and Team ID are required' }
    }

    // 1. Get User ID from email
    const { data: userToAdd, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

    if (userError || !userToAdd) {
        console.error('User not found:', email)
        return { success: false, error: 'User not found with this email' }
    }

    // 2. Add to team
    const { error } = await supabase
        .from('team_members')
        .insert({
            team_id: teamId,
            user_id: userToAdd.id,
            role: 'member'
        })

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { success: true, message: 'User is already a member of this team.' }
        }
        console.error('Error adding member:', error)
        return { success: false, error: 'Failed to add member' }
    }

    revalidatePath('/dashboard/chat')
    return { success: true, message: 'Member added successfully.' }
}

export async function deleteTeam(teamId: string) {
    const supabase = await createClient()

    // RLS will handle permission checks (Owner only).
    const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

    if (error) {
        console.error('Error deleting team:', error)
        throw new Error('Failed to delete team')
    }

    revalidatePath('/dashboard/chat')
}

export async function updateTeam(formData: FormData) {
    const supabase = await createClient()
    const teamId = formData.get('teamId') as string
    const name = formData.get('name') as string

    if (!teamId || !name) {
        throw new Error('Team ID and Name are required')
    }

    const { error } = await supabase
        .from('teams')
        .update({ name })
        .eq('id', teamId)

    if (error) {
        console.error('Error updating team:', error)
        throw new Error('Failed to update team')
    }

    revalidatePath('/dashboard/chat')
    revalidatePath(`/dashboard/chat/${teamId}`)
    revalidatePath(`/dashboard/chat/${teamId}`)
}

export async function updateMemberRole(teamId: string, userId: string, role: string) {
    const supabase = await createClient()

    if (!['owner', 'admin', 'member'].includes(role)) {
        throw new Error('Invalid role')
    }

    // Check if target user is the team creator
    const { data: team } = await supabase
        .from('teams')
        .select('created_by')
        .eq('id', teamId)
        .single()

    if (team?.created_by === userId) {
        throw new Error('Cannot change role of team creator')
    }

    const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('team_id', teamId)
        .eq('user_id', userId)

    if (error) {
        console.error('Error updating member role:', error)
        throw new Error('Failed to update member role')
    }

    revalidatePath(`/dashboard/chat`)
}

export async function removeTeamMember(teamId: string, userId: string) {
    const supabase = await createClient()

    // Check if target user is the team creator
    const { data: team } = await supabase
        .from('teams')
        .select('created_by')
        .eq('id', teamId)
        .single()

    if (team?.created_by === userId) {
        throw new Error('Cannot remove team creator')
    }

    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId)

    if (error) {
        console.error('Error removing team member:', error)
        throw new Error('Failed to remove team member')
    }

    revalidatePath(`/dashboard/chat`)
}

export async function getTeamMembers(teamId: string) {
    const supabase = await createClient()

    // Get team creator
    const { data: team } = await supabase
        .from('teams')
        .select('created_by')
        .eq('id', teamId)
        .single()

    const { data, error } = await supabase
        .from('team_members')
        .select(`
            user_id,
            role,
            user:users(id, name, email, avatar)
        `)
        .eq('team_id', teamId)

    if (error) {
        console.error('Error fetching team members:', JSON.stringify(error, null, 2))
        throw new Error(`Failed to fetch team members: ${error.message}`)
    }

    return data.map(item => ({
        id: item.user_id,
        role: item.role,
        isCreator: team?.created_by === item.user_id,
        ...item.user
    }))
}
