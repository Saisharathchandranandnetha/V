import { getUsers } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UsersTable } from '@/components/admin/users-table'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { UserDTO } from './actions'

export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== process.env.ADMIN_EMAIL) {
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
