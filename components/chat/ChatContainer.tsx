'use client'

import { TypingIndicator } from './TypingIndicator'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Message } from './MessageItem'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { sendMessage, markProjectMessagesAsRead } from '@/app/dashboard/chat/actions'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { ConnectionStatus } from './ConnectionStatus'
import Ably from 'ably'

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
    const [status, setStatus] = useState<RealtimeStatus>('connected')
    const [typingUsers, setTypingUsers] = useState<Map<string, { name: string, until: number }>>(new Map())
    const ablyRef = useRef<Ably.Realtime | null>(null)

    const totalMembers = members.length

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
                    if (data.until < now) { next.delete(id); changed = true }
                }
                return changed ? next : prev
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const handleBroadcastTyping = useCallback(async () => {
        if (!ablyRef.current) return
        const channel = ablyRef.current.channels.get(`chat:${teamId}:${projectId || 'team'}`)
        channel.publish('typing', { userId: currentUser.id, name: currentUser.name })
    }, [teamId, projectId, currentUser])

    const handleSendMessage = async (formData: FormData) => {
        const messageText = formData.get('message') as string
        const metadataRaw = formData.get('metadata') as string
        let metadata = null
        try { if (metadataRaw) metadata = JSON.parse(metadataRaw) } catch { }

        const optimisticId = uuidv4()
        const optimisticMessage: Message = {
            id: optimisticId,
            team_id: teamId,
            project_id: projectId || null,
            sender_id: currentUser.id,
            message: messageText,
            created_at: new Date().toISOString(),
            sender: { name: currentUser.name, avatar: currentUser.avatar, email: currentUser.email },
            is_sender: true,
            read_status: 'sent',
            metadata,
            message_reads: []
        }
        setMessages(prev => [...prev, optimisticMessage])

        try {
            await sendMessage(formData)
        } catch (error) {
            console.error('Failed to send message:', error)
            toast.error('Failed to send message')
            setMessages(prev => prev.filter(m => m.id !== optimisticId))
        }
    }

    const currentUserRef = useRef(currentUser)
    const membersRef = useRef(members)
    const totalMembersRef = useRef(totalMembers)
    useEffect(() => {
        currentUserRef.current = currentUser
        membersRef.current = members
        totalMembersRef.current = totalMembers
    }, [currentUser, members, totalMembers])

    // Ably Realtime subscription
    useEffect(() => {
        let ably: Ably.Realtime
        let channel: Ably.RealtimeChannel

        const connect = async () => {
            try {
                ably = new Ably.Realtime({ authUrl: '/api/ably/token' })
                ablyRef.current = ably

                ably.connection.on('connected', () => setStatus('connected'))
                ably.connection.on('disconnected', () => setStatus('reconnecting'))
                ably.connection.on('failed', () => setStatus('disconnected'))

                channel = ably.channels.get(`chat:${teamId}:${projectId || 'team'}`)

                // New messages
                channel.subscribe('new-message', (msg) => {
                    const newMessage = msg.data as Message
                    if (newMessage.sender_id === currentUserRef.current.id) {
                        setMessages(prev => {
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
                        markProjectMessagesAsRead(teamId, projectId || null)
                        setMessages(prev => [...prev, { ...newMessage, is_sender: false, message_reads: [] }])
                    }
                })

                // Typing indicators
                channel.subscribe('typing', (msg) => {
                    const { userId, name } = msg.data
                    if (userId === currentUserRef.current.id) return
                    setTypingUsers(prev => {
                        const next = new Map(prev)
                        next.set(userId, { name, until: Date.now() + 3000 })
                        return next
                    })
                })

                // Message deleted
                channel.subscribe('delete-message', (msg) => {
                    setMessages(prev => prev.filter(m => m.id !== msg.data.id))
                })

            } catch (err) {
                console.error('Ably connection failed:', err)
                setStatus('disconnected')
            }
        }

        connect()
        return () => {
            if (channel) {
                // Remove all listeners safely without detaching the channel state
                channel.unsubscribe()
            }
        }
    }, [teamId, projectId])

    const handleDeleteMessage = useCallback((messageId: string) => {
        setMessages(prev => prev.filter(m => m.id !== messageId))
    }, [])

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-2xl relative overflow-hidden ring-1 ring-border/50">
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
