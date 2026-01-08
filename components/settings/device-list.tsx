'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Laptop, Smartphone, AlertCircle, Loader2, LogOut } from 'lucide-react'
import { getActiveSessions, revokeSession, type SessionInfo } from '@/app/dashboard/settings/device-actions'

export default function DeviceList() {
    const [sessions, setSessions] = useState<SessionInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [revokingId, setRevokingId] = useState<string | null>(null)

    useEffect(() => {
        loadSessions()
    }, [])

    const loadSessions = async () => {
        try {
            setLoading(true)
            const data = await getActiveSessions()
            setSessions(data)
        } catch (err: any) {
            setError(err.message || 'Failed to load sessions')
        } finally {
            setLoading(false)
        }
    }

    const handleRevoke = async (sessionId: string) => {
        if (!confirm('Are you sure you want to log out this device?')) return

        try {
            setRevokingId(sessionId)
            await revokeSession(sessionId)
            // Reload list to confirm removal
            await loadSessions()
        } catch (err: any) {
            alert(`Failed to log out device: ${err.message}`)
        } finally {
            setRevokingId(null)
        }
    }

    const getIcon = (deviceType: string) => {
        if (deviceType.toLowerCase().includes('mobile') || deviceType.toLowerCase().includes('phone')) {
            return <Smartphone className="h-5 w-5" />
        }
        return <Laptop className="h-5 w-5" />
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Logged in Devices</CardTitle>
                    <CardDescription>Manage your active sessions.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Logged in Devices</CardTitle>
                <CardDescription>
                    You are currently logged in on these devices.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <div>
                            <p className="font-semibold">Error</p>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-muted rounded-full">
                                    {getIcon(session.device)}
                                </div>
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {session.browser} on {session.os}
                                        {session.isCurrent && (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium dark:bg-green-900/30 dark:text-green-400">
                                                This Device
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {session.device} • Active: {session.lastActive}
                                    </div>
                                </div>
                            </div>

                            {!session.isCurrent ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRevoke(session.id)}
                                    disabled={revokingId === session.id}
                                    className="w-full sm:w-auto text-destructive hover:bg-destructive/10 border-destructive/20"
                                >
                                    {revokingId === session.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <LogOut className="h-4 w-4 mr-2" />
                                    )}
                                    Log Out
                                </Button>
                            ) : (
                                <div className="text-xs text-muted-foreground italic hidden sm:block">
                                    Current Session
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
