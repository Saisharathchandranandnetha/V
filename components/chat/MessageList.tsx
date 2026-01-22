'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageItem, Message } from './MessageItem'
import { ConnectionStatus } from './ConnectionStatus'
import { ScrollArea } from '@/components/ui/scroll-area'
import { differenceInMinutes } from 'date-fns'

interface MessageListProps {
    initialMessages: Message[]
    teamId: string
    projectId?: string
    currentUserId: string
}

type RealtimeStatus = 'connected' | 'reconnecting' | 'disconnected'

export function MessageList({ initialMessages, teamId, projectId, currentUserId }: MessageListProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [status, setStatus] = useState<RealtimeStatus>('disconnected')
    const bottomRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const isMounted = useRef(false)

    // Initial Load & Subscribe
    useEffect(() => {
        isMounted.current = true
        let channel: any

        const setupRealtime = async () => {
            setStatus('reconnecting')

            // 1. Initial Fetch
            const query = supabase
                .from('team_messages')
                .select('*, sender:users(name, avatar, email)')
                .eq('team_id', teamId)
                .order('created_at', { ascending: true })

            if (projectId) {
                query.eq('project_id', projectId)
            } else {
                query.is('project_id', null)
            }

            const { data, error } = await query

            if (error) {
                console.error('Error fetching messages:', JSON.stringify(error, null, 2))
            } else {
                setMessages(data as Message[])
                setStatus('connected')
                // Scroll to bottom after initial load
                setTimeout(() => bottomRef.current?.scrollIntoView(), 100)
            }

            // 2. Realtime Subscription
            channel = supabase
                .channel(`chat:${teamId}:${projectId || 'team'}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'team_messages',
                        filter: `team_id=eq.${teamId}`
                    },
                    async (payload) => {
                        console.log('Realtime Event Received:', payload)
                        const newMessage = payload.new as Message

                        // Precise filtering
                        if (projectId) {
                            if (newMessage.project_id !== projectId) return
                        } else {
                            if (newMessage.project_id) return
                        }

                        // Fetch Sender Info
                        const { data: senderData } = await supabase
                            .from('users')
                            .select('name, avatar, email')
                            .eq('id', newMessage.sender_id)
                            .single()

                        const messageWithSender = {
                            ...newMessage,
                            sender: senderData || undefined,
                            is_sender: newMessage.sender_id === currentUserId
                        }

                        setMessages((prev) => {
                            // Deduplication check
                            if (prev.some(m => m.id === newMessage.id)) return prev
                            return [...prev, messageWithSender]
                        })

                        // Scroll on new message
                        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') setStatus('connected')
                    if (status === 'CLOSED') setStatus('disconnected')
                    if (status === 'CHANNEL_ERROR') setStatus('disconnected')
                    console.log(`Realtime Status: ${status}`)
                })
        }

        setupRealtime()

        return () => {
            isMounted.current = false
            if (channel) supabase.removeChannel(channel)
        }
    }, [teamId, projectId, supabase, currentUserId])

    // Group messages
    const groupedMessages = messages.map((msg, index) => {
        const prevMsg = messages[index - 1]
        const isConsecutive = prevMsg
            && prevMsg.sender_id === msg.sender_id
            && differenceInMinutes(new Date(msg.created_at), new Date(prevMsg.created_at)) < 5

        return { ...msg, isConsecutive }
    })

    return (
        <div className="relative flex-1 flex flex-col h-full overflow-hidden">
            <ConnectionStatus status={status} />
            <ScrollArea className="flex-1 p-4">
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
                        />
                    ))}
                    <div ref={bottomRef} className="h-1" />
                </div>
            </ScrollArea>
        </div>
    )
}
