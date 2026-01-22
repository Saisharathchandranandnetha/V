import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { CreateTeamDialog } from '@/components/chat/CreateTeamDialog'

export default async function TeamsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user's teams
    const { data: teamMembers } = await supabase
        .from('team_members')
        .select(`
            team_id,
            role,
            teams (
                id,
                name,
                created_at,
                created_by
            )
        `)
        .eq('user_id', user.id)

    const teams = teamMembers?.map(tm => ({
        ...tm.teams,
        role: tm.role
    })) || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
                    <p className="text-muted-foreground">Manage your teams and collaborations.</p>
                </div>
                <CreateTeamDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team: any) => (
                    <Card key={team.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                {team.name}
                            </CardTitle>
                            <CardDescription>
                                Role: <span className="capitalize">{team.role}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {/* Add member counts or other stats if available in future */}
                            <p className="text-sm text-muted-foreground">
                                Joined on {new Date(team.created_at).toLocaleDateString()}
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full" variant="outline">
                                <Link href={`/dashboard/chat/${team.id}`}>
                                    Open Chat
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {teams.length === 0 && (
                    <Card className="col-span-full border-dashed p-8 text-center flex flex-col items-center justify-center gap-4 text-muted-foreground bg-muted/10">
                        <div className="p-4 rounded-full bg-muted">
                            <Users className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">No teams yet</h3>
                            <p>Create a team to start collaborating with others.</p>
                        </div>
                        <CreateTeamDialog />
                    </Card>
                )}
            </div>
        </div>
    )
}
