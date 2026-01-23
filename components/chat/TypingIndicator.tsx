'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TypingIndicatorProps {
    users: {
        id: string
        name: string
        avatar?: string
    }[]
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
    if (users.length === 0) return null

    const text = users.length === 1
        ? `${users[0].name} is typing...`
        : users.length === 2
            ? `${users[0].name} and ${users[1].name} are typing...`
            : `${users.length} people are typing...`

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground w-fit rounded-full bg-muted/50 backdrop-blur-sm mb-2 ml-4"
            >
                <div className="flex gap-1 mt-1">
                    <motion.span
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-1 h-1 bg-muted-foreground rounded-full"
                    />
                    <motion.span
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-1 h-1 bg-muted-foreground rounded-full"
                    />
                    <motion.span
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-1 h-1 bg-muted-foreground rounded-full"
                    />
                </div>
                <span>{text}</span>
            </motion.div>
        </AnimatePresence>
    )
}
