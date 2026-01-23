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
                team_id
            )
        `)
        .order('name')

    if (error) {
        console.error("Error fetching teams:", error)
        return []
    }

    // Transform data
    const formattedTeams = teams?.map(team => {
        // Find current user's role
        const userMember = team.team_members?.find(m => m.user_id === user.id)
        const role = userMember?.role || 'member'

        return {
            ...team,
            currentUserRole: role,
            projects: Array.isArray(team.projects) ? team.projects.sort((a, b) => a.name.localeCompare(b.name)) : []
        }
    }) || []

    return formattedTeams
}
