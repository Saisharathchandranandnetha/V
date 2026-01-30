'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface EntranceProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    delay?: number
    direction?: 'up' | 'down' | 'left' | 'right' | 'none'
    duration?: number
    className?: string
}

export function Entrance({
    children,
    delay = 0,
    direction = 'up',
    duration = 0.5,
    className,
    ...props
}: EntranceProps) {

    const getInitial = () => {
        switch (direction) {
            case 'up': return { opacity: 0, y: 20 }
            case 'down': return { opacity: 0, y: -20 }
            case 'left': return { opacity: 0, x: 20 }
            case 'right': return { opacity: 0, x: -20 }
            case 'none': return { opacity: 0 }
            default: return { opacity: 0, y: 20 }
        }
    }

    const animate = {
        opacity: 1,
        y: 0,
        x: 0
    }

    return (
        <motion.div
            initial={getInitial()}
            whileInView={animate} // Use whileInView instead of animate to trigger on scroll
            viewport={{ once: true, margin: "-50px" }} // Trigger once, slightly before in view
            transition={{
                duration: duration,
                delay: delay,
                ease: [0.21, 0.47, 0.32, 0.98] // Smooth app-like easing
            }}
            className={cn(className)}
            {...props as any}
        >
            {children}
        </motion.div>
    )
}

import { HTMLMotionProps } from 'framer-motion'

export function StaggerContainer({
    children,
    className,
    delay = 0,
    staggerDelay = 0.05,
    ...props
}: HTMLMotionProps<'div'> & {
    children: React.ReactNode
    className?: string
    delay?: number
    staggerDelay?: number
}) {
    return (
        <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                hidden: {},
                show: {
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren: delay
                    }
                }
            }}
            className={className}
            {...props as any}
        >
            {children}
        </motion.div>
    )
}

export function StaggerItem({ children, className, ...props }: { children: React.ReactNode, className?: string }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 10 }, // Reduced distance
                show: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        type: "tween", // Switched from spring to tween for performance
                        ease: "easeOut",
                        duration: 0.3
                    }
                }
            }}
            className={className}
            {...props as any}
        >
            {children}
        </motion.div>
    )
}
