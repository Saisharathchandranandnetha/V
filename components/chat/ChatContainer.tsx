'use client'

import { TypingIndicator } from './TypingIndicator'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from './MessageItem'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { sendMessage, markProjectMessagesAsRead } from '@/app/dashboard/chat/actions'
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
    // Enrich messages with read tracking
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [status, setStatus] = useState<RealtimeStatus>('connected')
    const [typingUsers, setTypingUsers] = useState<Map<string, { name: string, until: number }>>(new Map())
    const supabase = useState(() => createClient())[0]

    const totalMembers = members.length

    // Mark messages as read when entering the chat
    useEffect(() => {
        markProjectMessagesAsRead(teamId, projectId || null)
    }, [teamId, projectId])

    // Clear expired typing users
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            setTypingUsers(prev => {
                const next = new Map(prev)
                let changed = false
                for (const [id, data] of next.entries()) {
                    if (data.until < now) {
                        next.delete(id)
                        changed = true
                    }
                }
                return changed ? next : prev
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const handleBroadcastTyping = useCallback(async () => {
        const channel = supabase.channel(`chat:${teamId}:${projectId || 'team'}`)
        await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
                userId: currentUser.id,
                name: currentUser.name
            }
        })
    }, [teamId, projectId, currentUser, supabase])

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
            metadata: metadata,
            message_reads: [] // Initialize empty reads
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
    const currentUserRef = useRef(currentUser)
    const membersRef = useRef(members)
    const totalMembersRef = useRef(totalMembers)

    useEffect(() => {
        currentUserRef.current = currentUser
        membersRef.current = members
        totalMembersRef.current = totalMembers
    }, [currentUser, members, totalMembers])

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

                        // Remove user from typing list if they sent a message
                        setTypingUsers(prev => {
                            const next = new Map(prev)
                            next.delete(newMessage.sender_id)
                            return next
                        })

                        if (newMessage.sender_id === currentUserRef.current.id) {
                            setMessages(prev => {
                                // Find optimistic message
                                const optimisticMatch = prev.find(m =>
                                    m.is_sender &&
                                    m.message === newMessage.message &&
                                    Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 10000
                                )

                                if (optimisticMatch) {
                                    return prev.map(m => m === optimisticMatch ? { ...newMessage, is_sender: true, sender: currentUserRef.current, message_reads: [] } : m)
                                }
                                return [...prev, { ...newMessage, is_sender: true, sender: currentUserRef.current, message_reads: [] }]
                            })
                        } else {
                            // Someone else
                            const { data: senderData } = await supabase
                                .from('users')
                                .select('name, avatar, email')
                                .eq('id', newMessage.sender_id)
                                .single()

                            // Mark as read immediately if visible
                            // In a real app we might check visibility/focus
                            markProjectMessagesAsRead(teamId, projectId || null)

                            setMessages(prev => [...prev, {
                                ...newMessage,
                                sender: senderData || undefined,
                                is_sender: false,
                                message_reads: []
                            }])
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'message_reads'
                },
                (payload) => {
                    const newRead = payload.new
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === newRead.message_id) {
                            // Add to reads
                            const existingReads = (msg.message_reads || []) as any[]
                            if (existingReads.some(r => r.user_id === newRead.user_id)) return msg

                            const updatedReads = [...existingReads, { user_id: newRead.user_id }]

                            // Check for double tick condition
                            // Read by everyone excluding sender
                            // If I am sender, I need (totalMembers - 1) reads.
                            const isReadByAll = updatedReads.length >= (totalMembersRef.current - 1)

                            return {
                                ...msg,
                                message_reads: updatedReads,
                                read_status: isReadByAll ? 'read' : 'delivered' // Upgrade to delivered at least if someone read it
                            }
                        }
                        return msg
                    }))
                }
            )
            .on(
                'broadcast',
                { event: 'typing' },
                (payload) => {
                    const { userId, name } = payload.payload
                    if (userId === currentUserRef.current.id) return

                    setTypingUsers(prev => {
                        const next = new Map(prev)
                        next.set(userId, { name, until: Date.now() + 3000 })
                        return next
                    })
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') setStatus('connected')
                if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setStatus('disconnected')
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [teamId, projectId, supabase])

    // Optimistic Delete Handler
    const handleDeleteMessage = useCallback((messageId: string) => {
        setMessages(prev => prev.filter(m => m.id !== messageId))
    }, [])

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            <ConnectionStatus status={status} />

            <MessageList
                messages={messages}
                teamId={teamId}
                projectId={projectId}
                onDelete={handleDeleteMessage}
                members={members}
            />

            <div className="absolute bottom-20 left-0 right-0 z-10 pointer-events-none">
                <TypingIndicator users={Array.from(typingUsers.entries()).map(([id, data]) => ({ id, name: data.name }))} />
            </div>

            <ChatInput
                teamId={teamId}
                projectId={projectId}
                members={members}
                onSendMessage={handleSendMessage}
                onTyping={handleBroadcastTyping}
            />
        </div>
    )
}
