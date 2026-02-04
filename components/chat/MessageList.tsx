'use client'

import { useEffect, useRef } from 'react'
import { MessageItem, Message } from './MessageItem'

import { differenceInMinutes, isSameDay, isToday, isYesterday, format } from 'date-fns'

function formatDateLabel(date: Date) {
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMMM d, yyyy')
}

import { motion, AnimatePresence } from 'framer-motion'

// Simplified MessageList
export function MessageList({ messages, teamId, projectId, onDelete, members }: {
    messages: Message[],
    teamId: string,
    projectId?: string,
    onDelete?: (id: string) => void,
    members: any[]
}) {
    const scrollRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
                }
            })
        }
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
        <div
            ref={scrollRef}
            className="flex-1 min-h-0 w-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent overscroll-y-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            <div className="flex flex-col gap-1 pb-4">
                <AnimatePresence initial={false}>
                    {groupedMessages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 0.5, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 text-muted-foreground"
                        >
                            <p>No messages yet.</p>
                            <p className="text-sm">Start the conversation!</p>
                        </motion.div>
                    )}

                    {groupedMessages.map((msg, index) => {
                        const prevMsg = groupedMessages[index - 1];
                        const isNewDay = !prevMsg || !isSameDay(new Date(msg.created_at), new Date(prevMsg.created_at));

                        return (
                            <motion.div
                                key={msg.id + '-container'}
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 20,
                                    delay: Math.min(index * 0.05, 0.5) // Stagger for initial load
                                }}
                                className="flex flex-col"
                            >
                                {isNewDay && (
                                    <div className="flex items-center justify-center my-4">
                                        <div className="bg-muted/30 backdrop-blur-md text-[10px] uppercase tracking-widest text-muted-foreground px-4 py-1 rounded-full border border-border/50">
                                            {formatDateLabel(new Date(msg.created_at))}
                                        </div>
                                    </div>
                                )}
                                <MessageItem
                                    message={msg}
                                    isConsecutive={msg.isConsecutive}
                                    teamId={teamId}
                                    projectId={projectId}
                                    onDelete={onDelete}
                                    members={members}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}
