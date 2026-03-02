import { getUsers, UserDTO } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UsersTable } from '@/components/admin/users-table'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
    const session = await auth()

    if (!session?.user || session.user.email !== process.env.ADMIN_EMAIL) {
        redirect('/dashboard')
    }

    let users: UserDTO[] = []
    try {
        users = await getUsers()
    } catch (e) {
        console.error(e)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage users and system settings.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                        Total Users: {users.length}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UsersTable users={users} />
                </CardContent>
            </Card>
        </div>
    )
}
