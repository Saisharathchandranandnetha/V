import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getUserTeams() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch teams the user belongs to
    const { data: teams, error } = await supabase
        .from('teams')
        .select(`
            id,
            name,
            team_members (
                role,
                user_id
            ),
            projects (
                id,
                name,
                team_id,
                project_members (
                    user_id
                )
            )
        `)
        .order('name')

    if (error) {
        console.error("Error fetching teams:", JSON.stringify(error, null, 2))
        return []
    }

    // Transform data
    const formattedTeams = teams?.map(team => {
        // Find current user's role
        const userMember = team.team_members?.find(m => m.user_id === user.id)
        const role = userMember?.role || 'member'

        // Filter projects: 
        // 1. If project has members defined, only show to those members.
        // 2. If project has NO members (legacy/old), show to all team members.
        const visibleProjects = Array.isArray(team.projects)
            ? team.projects.filter(p => {
                const members = p.project_members || []
                if (members.length === 0) return true // Legacy/Public fallback
                return members.some((pm: any) => pm.user_id === user.id)
            })
            : []

        return {
            ...team,
            currentUserRole: role,
            projects: visibleProjects.sort((a, b) => a.name.localeCompare(b.name))
        }
    }) || []

    return formattedTeams
}
