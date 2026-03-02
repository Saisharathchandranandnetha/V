import { auth } from '@/auth'
import { db } from '@/lib/db'
import { teamMembers, teams } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { Button } from '@/components/ui/button'
import { Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { CreateTeamDialog } from '@/components/chat/CreateTeamDialog'

export default async function TeamsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    // Fetch user's teams
    const membersData = await db
        .select({
            role: teamMembers.role,
            team: {
                id: teams.id,
                name: teams.name,
                createdAt: teams.createdAt,
            }
        })
        .from(teamMembers)
        .leftJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(eq(teamMembers.userId, session.user.id))

    const userTeams = membersData
        .filter(m => m.team !== null)
        .map(m => ({
            ...m.team,
            role: m.role
        }))

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
                {userTeams.map((team: any) => (
                    <SpotlightCard key={team.id} className="flex flex-col">
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
                                Joined on {new Date(team.createdAt).toLocaleDateString()}
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
                    </SpotlightCard>
                ))}

                {userTeams.length === 0 && (
                    <SpotlightCard className="col-span-full border-dashed p-8 text-center flex flex-col items-center justify-center gap-4 text-muted-foreground bg-muted/10">
                        <div className="p-4 rounded-full bg-muted">
                            <Users className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">No teams yet</h3>
                            <p>Create a team to start collaborating with others.</p>
                        </div>
                        <CreateTeamDialog />
                    </SpotlightCard>
                )}
            </div>
        </div>
    )
}
