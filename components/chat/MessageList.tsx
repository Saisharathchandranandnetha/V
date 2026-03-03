'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageItem, Message } from './MessageItem'

import { differenceInMinutes, isSameDay, isToday, isYesterday, format } from 'date-fns'

function formatDateLabel(date: Date) {
    if (isNaN(date.getTime())) return 'Unknown Date'
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMMM d, yyyy')
}

import { motion, AnimatePresence } from 'framer-motion'

// Simplified MessageList
export function MessageList({ messages, teamId, projectId, onDelete, members, onLoadOlder, isFetchingOlder, hasMore }: {
    messages: Message[],
    teamId: string,
    projectId?: string,
    onDelete?: (id: string) => void,
    members: any[],
    onLoadOlder?: () => void,
    isFetchingOlder?: boolean,
    hasMore?: boolean
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const loaderRef = useRef<HTMLDivElement>(null)
    const [isInitialLoad, setIsInitialLoad] = useState(true)

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        if (!loaderRef.current || !hasMore || isFetchingOlder) return
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && onLoadOlder) {
                onLoadOlder()
            }
        }, { threshold: 0.1, root: scrollRef.current })

        observer.observe(loaderRef.current)
        return () => observer.disconnect()
    }, [hasMore, isFetchingOlder, onLoadOlder])

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            requestAnimationFrame(() => {
                if (!scrollRef.current) return
                if (isInitialLoad) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
                    setIsInitialLoad(false)
                } else if (!isFetchingOlder) {
                    const isNearBottom = scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight < 250
                    if (isNearBottom) {
                        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
                    }
                }
            })
        }
    }, [messages.length, isInitialLoad, isFetchingOlder])

    // Group messages
    const groupedMessages = messages.map((msg, index) => {
        const prevMsg = messages[index - 1]

        const msgDate = new Date(msg.created_at)
        const prevDate = prevMsg ? new Date(prevMsg.created_at) : new Date(0)

        const isConsecutive = prevMsg
            && prevMsg.sender_id === msg.sender_id
            && !isNaN(msgDate.getTime())
            && !isNaN(prevDate.getTime())
            && differenceInMinutes(msgDate, prevDate) < 5

        return { ...msg, isConsecutive }
    })

    return (
        <div
            ref={scrollRef}
            className="flex-1 min-h-0 w-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent overscroll-y-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            <div className="flex flex-col gap-1 pb-4">
                {hasMore && (
                    <div ref={loaderRef} className="w-full flex justify-center py-4">
                        {isFetchingOlder ? <span className="text-xs text-muted-foreground animate-pulse">Loading older messages...</span> : <div className="h-4" />}
                    </div>
                )}
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

                        const msgDate = new Date(msg.created_at);
                        const prevDate = prevMsg ? new Date(prevMsg.created_at) : new Date(0);

                        const isNewDay = !prevMsg ||
                            (isNaN(msgDate.getTime()) || isNaN(prevDate.getTime())
                                ? false
                                : !isSameDay(msgDate, prevDate));

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
