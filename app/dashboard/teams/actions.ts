'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { teams, teamMembers, projects, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createTeam(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const name = formData.get('name') as string
    if (!name) throw new Error('Team name is required')

    const [team] = await db.insert(teams).values({ name, createdBy: session.user.id }).returning()
    await db.insert(teamMembers).values({ teamId: team.id, userId: session.user.id, role: 'owner' })

    revalidatePath('/dashboard/chat')
    return team.id
}

export async function createProject(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const name = formData.get('name') as string
    const teamId = formData.get('teamId') as string
    if (!name || !teamId) throw new Error('Project name and Team ID are required')

    await db.insert(projects).values({ name, teamId })

    revalidatePath('/dashboard/chat')
    revalidatePath(`/dashboard/chat/${teamId}`)
}

export async function addTeamMember(formData: FormData) {
    const email = formData.get('email') as string
    const teamId = formData.get('teamId') as string
    if (!email || !teamId) return { success: false, error: 'Email and Team ID are required' }

    const [userToAdd] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (!userToAdd) return { success: false, error: 'User not found with this email' }

    try {
        await db.insert(teamMembers).values({ teamId, userId: userToAdd.id, role: 'member' })
    } catch (e: any) {
        if (e?.code === '23505') return { success: true, message: 'User is already a member of this team.' }
        return { success: false, error: 'Failed to add member' }
    }

    revalidatePath('/dashboard/chat')
    return { success: true, message: 'Member added successfully.' }
}

export async function deleteTeam(teamId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    await db.delete(teams).where(eq(teams.id, teamId))
    revalidatePath('/dashboard/chat')
}

export async function updateTeam(formData: FormData) {
    const teamId = formData.get('teamId') as string
    const name = formData.get('name') as string
    if (!teamId || !name) throw new Error('Team ID and Name are required')

    await db.update(teams).set({ name }).where(eq(teams.id, teamId))
    revalidatePath('/dashboard/chat')
    revalidatePath(`/dashboard/chat/${teamId}`)
}

export async function updateMemberRole(teamId: string, userId: string, role: string) {
    if (!['owner', 'admin', 'member'].includes(role)) throw new Error('Invalid role')

    const [team] = await db.select({ createdBy: teams.createdBy }).from(teams).where(eq(teams.id, teamId)).limit(1)
    if (team?.createdBy === userId) throw new Error('Cannot change role of team creator')

    await db.update(teamMembers).set({ role })
        .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))

    revalidatePath('/dashboard/chat')
}

export async function removeTeamMember(teamId: string, userId: string) {
    const [team] = await db.select({ createdBy: teams.createdBy }).from(teams).where(eq(teams.id, teamId)).limit(1)
    if (team?.createdBy === userId) throw new Error('Cannot remove team creator')

    await db.delete(teamMembers)
        .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))

    revalidatePath('/dashboard/chat')
}

export async function getTeamMembers(teamId: string) {
    const [team] = await db.select({ createdBy: teams.createdBy }).from(teams).where(eq(teams.id, teamId)).limit(1)

    const members = await db.select({
        userId: teamMembers.userId,
        role: teamMembers.role,
        name: users.name,
        email: users.email,
        image: users.image,
    }).from(teamMembers)
        .innerJoin(users, eq(teamMembers.userId, users.id))
        .where(eq(teamMembers.teamId, teamId))

    return members.map(m => ({
        id: m.userId,
        role: m.role,
        isCreator: team?.createdBy === m.userId,
        name: m.name,
        email: m.email,
        avatar: m.image,
    }))
}
