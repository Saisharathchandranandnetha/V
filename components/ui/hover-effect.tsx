'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface HoverEffectProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    variant?: 'lift' | 'scale' | 'glow' | 'glass-accent'
    duration?: number
}

export function HoverEffect({
    children,
    className,
    variant = 'lift',
    duration = 0.2,
    ...props
}: HoverEffectProps) {

    const variants = {
        lift: {
            whileHover: { y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" },
        },
        scale: {
            whileHover: { scale: 1.02 },
        },
        glow: {
            whileHover: {
                boxShadow: "0 0 20px 2px rgba(var(--primary-foreground), 0.1)", // Adjust color based on theme
                borderColor: "rgba(var(--primary), 0.5)"
            }
        },
        'glass-accent': {
            whileHover: {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(12px)",
                borderColor: "rgba(255,255,255,0.2)"
            }
        }
    }

    const selectedVariant = variants[variant] || variants.lift

    return (
        <motion.div
            className={cn("transition-colors", className)}
            initial={{ y: 0, scale: 1 }}
            whileHover={selectedVariant.whileHover}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: duration, ease: "easeOut" }}
            {...props as any}
        >
            {children}
        </motion.div>
    )
}
