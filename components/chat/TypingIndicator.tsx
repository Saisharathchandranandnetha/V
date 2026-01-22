'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface TypingIndicatorProps {
    teamId: string
    projectId?: string
    currentUserId: string
}

export function TypingIndicator({ teamId, projectId, currentUserId }: TypingIndicatorProps) {
    const [typers, setTypers] = useState<string[]>([])
    const supabase = createClient()

    useEffect(() => {
        // Unique channel for presence to avoid conflicts with messages if complex
        // But typically we reuse the same channel. However, `MessageList` already has a channel.
        // Ideally we lift state or use a separate component. Let's use a separate channel for simplicity here.

        // Note: Supabase presence requires 'sync' state.

        const channel = supabase.channel(`presence:${teamId}`)

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState()
                const activeTypers: string[] = []

                // Loop through state
                for (const key in newState) {
                    const users = newState[key] as any[]
                    users.forEach(user => {
                        // user object usually contains the payload we track
                        if (user.user_id !== currentUserId && user.isTyping) {
                            activeTypers.push(user.name || 'Someone')
                        }
                    })
                }
                setTypers([...new Set(activeTypers)]) // Dedupe
            })
            .subscribe()

        // Expose a global or context function to "setTyping" would be ideal.
        // For now, this component just *displays*. 
        // The "ChatInput" needs to *trigger* the typing coverage.
        // This requires shared state or event bus. simpler: LocalStorage event or just pass a callback if parent matches.

        // Actually, `ChatInput` is sibling.

        return () => {
            supabase.removeChannel(channel)
        }
    }, [teamId, projectId, currentUserId, supabase])

    if (typers.length === 0) return null

    return (
        <div className="text-xs text-muted-foreground italic h-4 flex items-center px-1">
            {typers.length === 1
                ? `${typers[0]} is typing...`
                : `${typers.length} people are typing...`}
        </div>
    )
}
