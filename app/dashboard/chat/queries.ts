import { auth } from '@/auth'
import { db } from '@/lib/db'
import { habits, habitLogs, tasks, goals, transactions, resources, notes, collections, categories, learningPaths } from '@/lib/db/schema'
import { eq, and, or, isNull, lte, gte, count } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function getUserTeams() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const { teams, teamMembers, projects } = await import('@/lib/db/schema')
    const { db } = await import('@/lib/db')

    const userTeams = await db
        .select({ teamId: teamMembers.teamId, role: teamMembers.role })
        .from(teamMembers)
        .where(eq(teamMembers.userId, session.user.id!))

    if (!userTeams.length) return []

    const teamIds = userTeams.map(t => t.teamId)
    const roleMap = Object.fromEntries(userTeams.map(t => [t.teamId, t.role]))

    const teamsData = await db.select({ id: teams.id, name: teams.name }).from(teams)
        .where(or(...teamIds.map(id => eq(teams.id, id))))

    const projectsData = await db.select().from(projects)
        .where(or(...teamIds.map(id => eq(projects.teamId, id))))

    return teamsData.map(team => ({
        ...team,
        currentUserRole: roleMap[team.id] || 'member',
        team_members: userTeams.filter(m => m.teamId === team.id),
        projects: projectsData.filter(p => p.teamId === team.id).sort((a, b) => a.name.localeCompare(b.name)),
    }))
}
