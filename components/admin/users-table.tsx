'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Smartphone, Laptop, LogOut, Loader2 } from 'lucide-react'
import { UserDTO, getUserSessionsAdmin, revokeUserSessionAdmin, deleteUser } from '@/app/dashboard/admin/actions'
import { SessionInfo } from '@/app/dashboard/settings/device-actions'

interface UsersTableProps {
    users: UserDTO[]
}

export function UsersTable({ users }: UsersTableProps) {
    const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null)
    const [sessions, setSessions] = useState<SessionInfo[]>([])
    const [loadingSessions, setLoadingSessions] = useState(false)

    const handleViewSessions = async (user: UserDTO) => {
        setSelectedUser(user)
        setLoadingSessions(true)
        try {
            const data = await getUserSessionsAdmin(user.id)
            setSessions(data)
        } catch (error) {
            console.error(error)
            alert('Failed to load sessions')
        } finally {
            setLoadingSessions(false)
        }
    }

    const handleRevokeSession = async (sessionId: string) => {
        if (!confirm('Revoke this session?')) return
        try {
            await revokeUserSessionAdmin(sessionId)
            // Refresh local list
            setSessions(sessions.filter(s => s.id !== sessionId))
        } catch (error) {
            alert('Failed to revoke session')
        }
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
                            </TableCell>
                            <TableCell className="text-right flex justify-end gap-2">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" onClick={() => handleViewSessions(user)}>
                                            View Sessions
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Sessions for {selectedUser?.name}</DialogTitle>
                                            <DialogDescription>Active devices for this user.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                            {loadingSessions ? (
                                                <div className="flex justify-center p-4">
                                                    <Loader2 className="animate-spin" />
                                                </div>
                                            ) : sessions.length === 0 ? (
                                                <p className="text-muted-foreground text-center">No active sessions.</p>
                                            ) : (
                                                sessions.map(session => (
                                                    <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                                                        <div className="flex items-center gap-3">
                                                            {session.device.toLowerCase().includes('mobile') ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                                                            <div>
                                                                <div className="font-medium">{session.browser} on {session.os}</div>
                                                                <div className="text-xs text-muted-foreground">Last active: {session.lastActive}</div>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(session.id)} className="text-destructive">
                                                            <LogOut className="h-4 w-4 mr-2" />
                                                            Revoke
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                            try {
                                                await deleteUser(user.id)
                                            } catch (e) {
                                                alert('Failed to delete user')
                                            }
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    )
}
