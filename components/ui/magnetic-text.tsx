'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function MagneticText({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("relative inline-block group/text overflow-hidden", className)}>
            <span className="relative z-10">
                {children}
            </span>
            <motion.div
                initial={{ x: '-100%', skewX: -20 }}
                whileHover={{ x: '200%', transition: { duration: 1, ease: "easeInOut" } }}
                className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-primary/20 to-transparent z-20 pointer-events-none"
            />
        </span>
    )
}
