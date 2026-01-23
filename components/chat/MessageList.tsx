'use client'

import { useEffect, useRef } from 'react'
import { MessageItem, Message } from './MessageItem'
import { ScrollArea } from '@/components/ui/scroll-area'
import { differenceInMinutes } from 'date-fns'

// Simplified MessageList
export function MessageList({ messages, teamId, projectId, onDelete }: {
    messages: Message[],
    teamId: string,
    projectId?: string,
    onDelete?: (id: string) => void
}) {
    const bottomRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    // Group messages
    const groupedMessages = messages.map((msg, index) => {
        const prevMsg = messages[index - 1]
        const isConsecutive = prevMsg
            && prevMsg.sender_id === msg.sender_id
            && differenceInMinutes(new Date(msg.created_at), new Date(prevMsg.created_at)) < 5

        return { ...msg, isConsecutive }
    })

    return (
        <ScrollArea className="flex-1 min-h-0 p-4">
            <div className="flex flex-col gap-1 pb-4">
                {groupedMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                        <p>No messages yet.</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                )}

                {groupedMessages.map((msg) => (
                    <MessageItem
                        key={msg.id}
                        message={msg}
                        isConsecutive={msg.isConsecutive}
                        teamId={teamId}
                        projectId={projectId}
                        onDelete={onDelete}
                    />
                ))}
                <div ref={bottomRef} className="h-1" />
            </div>
        </ScrollArea>
    )
}
