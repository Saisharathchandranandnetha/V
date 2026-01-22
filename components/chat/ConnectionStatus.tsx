'use client'

import { Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ConnectionStatusProps {
    status: 'connected' | 'reconnecting' | 'disconnected'
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
    if (status === 'connected') return null // Do not show when happy path

    return (
        <div className="absolute top-2 right-2 z-50">
            {status === 'disconnected' && (
                <Badge variant="destructive" className="flex items-center gap-1 opacity-90">
                    <WifiOff className="h-3 w-3" />
                    Offline
                </Badge>
            )}
            {status === 'reconnecting' && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 opacity-90 animate-pulse">
                    <Wifi className="h-3 w-3" />
                    Reconnecting...
                </Badge>
            )}
        </div>
    )
}
