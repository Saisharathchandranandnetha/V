import { createClient } from '@/lib/supabase/server'
import { ChatLayout } from '@/components/chat/ChatLayout'
import { redirect } from 'next/navigation'

export default async function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch teams the user belongs to
    // Note: This relies on the RLS policies we set up.
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
    }

    // Transform data if needed for the UI, though the query structure matches mostly
    // We probably want to sort projects too? Supabase order within join needs explicit sort usually but simple array sort here works.
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

    return (
        <ChatLayout teams={formattedTeams}>
            {children}
        </ChatLayout>
    )
}
