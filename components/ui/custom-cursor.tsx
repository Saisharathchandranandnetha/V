'use client'

import React, { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

export function CustomCursor() {
    const cursorX = useMotionValue(-100)
    const cursorY = useMotionValue(-100)

    const springConfig = { damping: 25, stiffness: 250 }
    const x = useSpring(cursorX, springConfig)
    const y = useSpring(cursorY, springConfig)

    const [isHovering, setIsHovering] = useState(false)

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX)
            cursorY.set(e.clientY)
        }

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const isClickable = window.getComputedStyle(target).cursor === 'pointer' ||
                target.tagName === 'A' ||
                target.tagName === 'BUTTON'
            setIsHovering(isClickable)
        }

        window.addEventListener('mousemove', moveCursor)
        window.addEventListener('mouseover', handleMouseOver)

        return () => {
            window.removeEventListener('mousemove', moveCursor)
            window.removeEventListener('mouseover', handleMouseOver)
        }
    }, [])

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-[9999] hidden md:block"
            style={{
                x,
                y,
                translateX: '-50%',
                translateY: '-50%',
            }}
        >
            {/* Main Aura */}
            <motion.div
                animate={{
                    scale: isHovering ? 1.5 : 1,
                    opacity: isHovering ? 0.4 : 0.2,
                }}
                className="h-24 w-24 rounded-full bg-primary/30 blur-3xl"
            />
            {/* Precision Dot */}
            <motion.div
                animate={{
                    scale: isHovering ? 0 : 1,
                }}
                className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/50"
            />
        </motion.div>
    )
}
