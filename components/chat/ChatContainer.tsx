'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from './MessageItem'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { sendMessage } from '@/app/dashboard/chat/actions'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { differenceInMinutes } from 'date-fns'
import { ConnectionStatus } from './ConnectionStatus'

interface ChatContainerProps {
    initialMessages: Message[]
    teamId: string
    projectId?: string
    currentUser: {
        id: string
        name: string
        avatar: string
        email: string
    }
    members: any[]
}

type RealtimeStatus = 'connected' | 'reconnecting' | 'disconnected'

export function ChatContainer({ initialMessages, teamId, projectId, currentUser, members }: ChatContainerProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [status, setStatus] = useState<RealtimeStatus>('connected') // Assume connected initially if hydration works
    const supabase = useState(() => createClient())[0]

    // Optimistic Update Handler
    const handleSendMessage = async (formData: FormData) => {
        const messageText = formData.get('message') as string
        const metadataRaw = formData.get('metadata') as string
        let metadata = null
        try {
            if (metadataRaw) metadata = JSON.parse(metadataRaw)
        } catch { }

        // 1. Create Optimistic Message
        const optimisticId = uuidv4()
        const optimisticMessage: Message = {
            id: optimisticId,
            team_id: teamId,
            project_id: projectId || null,
            sender_id: currentUser.id,
            message: messageText,
            created_at: new Date().toISOString(),
            sender: {
                name: currentUser.name,
                avatar: currentUser.avatar,
                email: currentUser.email
            },
            is_sender: true,
            read_status: 'sent',
            metadata: metadata
        }

        // 2. Add to State Immediately
        setMessages(prev => [...prev, optimisticMessage])

        try {
            // 3. Call Server Action
            await sendMessage(formData)
        } catch (error) {
            console.error('Failed to send message:', error)
            toast.error('Failed to send message')
            // 4. Rollback on failure
            setMessages(prev => prev.filter(m => m.id !== optimisticId))
        }
    }

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel(`chat:${teamId}:${projectId || 'team'}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'team_messages',
                    filter: `team_id=eq.${teamId}`
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newMessage = payload.new as Message

                        // Filtering
                        if (projectId) {
                            if (newMessage.project_id !== projectId) return
                        } else {
                            if (newMessage.project_id) return
                        }

                        // Ignore if we already have this message (deduplication from optimistic update)
                        // Note: The optimistic ID is random UUID, real ID is from DB. 
                        // If we use the returned ID to replace optimistic one, that's best.
                        // Ideally we match by content/timestamp or just let the real one arrive and replace?
                        // Simple dedupe: if sender is me and content matches last message? 
                        // Better: The server action revalidates path, which might trigger a refresh?
                        // Actually, Realtime will send the TRUE message.
                        // We need to replace the optimistic message with the real one to get the real ID.
                        // But we don't know the Real ID mapping easily without returning it from action.

                        // Current approach: Just append. 
                        // Issue: Optimistic message stays?
                        // Fix: We need to identify the optimistic message. 
                        // Typically we'd use a temp ID. 

                        // For now, let's just fetch the sender data and append if distinct.
                        // If it's my message, I might get a duplicate if I don't handle it.

                        if (newMessage.sender_id === currentUser.id) {
                            // It's me. Find the optimistic message that matches and replace/remove it.
                            // OR, since `sendMessage` doesn't return the ID...

                            // Let's rely on standard deduping if IDs match (won't match).
                            // We'll replace the *last* message if it looks like an optimistic one from me?

                            setMessages(prev => {
                                // Find optimistic message (we can tag them or search by content recent)
                                const optimisticMatch = prev.find(m =>
                                    m.is_sender &&
                                    m.message === newMessage.message &&
                                    // Created recently
                                    Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 10000
                                )

                                if (optimisticMatch) {
                                    // Replace optimistic with real
                                    return prev.map(m => m === optimisticMatch ? { ...newMessage, is_sender: true, sender: currentUser } : m)
                                }
                                return [...prev, { ...newMessage, is_sender: true, sender: currentUser }]
                            })
                        } else {
                            // Someone else
                            const { data: senderData } = await supabase
                                .from('users')
                                .select('name, avatar, email')
                                .eq('id', newMessage.sender_id)
                                .single()

                            setMessages(prev => [...prev, {
                                ...newMessage,
                                sender: senderData || undefined,
                                is_sender: false
                            }])
                        }
                    }
                    else if (payload.eventType === 'DELETE') {
                        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') setStatus('connected')
                if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setStatus('disconnected')
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [teamId, projectId, supabase, currentUser])

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            <ConnectionStatus status={status} />

            <MessageList
                messages={messages}
                teamId={teamId}
                projectId={projectId}
            />

            <ChatInput
                teamId={teamId}
                projectId={projectId}
                members={members}
                onSendMessage={handleSendMessage}
            />
        </div>
    )
}
