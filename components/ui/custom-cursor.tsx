'use client'

import React, { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion'

export function CustomCursor() {
    const cursorX = useMotionValue(-100)
    const cursorY = useMotionValue(-100)

    // Different springs for multi-layer lag effect
    const springConfig = { damping: 30, stiffness: 200 }
    const auraConfig = { damping: 20, stiffness: 100 }

    const x = useSpring(cursorX, springConfig)
    const y = useSpring(cursorY, springConfig)

    const auraX = useSpring(cursorX, auraConfig)
    const auraY = useSpring(cursorY, auraConfig)

    const [isHovering, setIsHovering] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX)
            cursorY.set(e.clientY)
            if (!isVisible) setIsVisible(true)
        }

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const isClickable = window.getComputedStyle(target).cursor.includes('url') ||
                window.getComputedStyle(target).cursor === 'pointer' ||
                target.tagName === 'A' ||
                target.tagName === 'BUTTON'
            setIsHovering(isClickable)
        }

        const handleMouseLeave = () => setIsVisible(false)
        const handleMouseEnter = () => setIsVisible(true)

        window.addEventListener('mousemove', moveCursor)
        window.addEventListener('mouseover', handleMouseOver)
        document.addEventListener('mouseleave', handleMouseLeave)
        document.addEventListener('mouseenter', handleMouseEnter)

        return () => {
            window.removeEventListener('mousemove', moveCursor)
            window.removeEventListener('mouseover', handleMouseOver)
            document.removeEventListener('mouseleave', handleMouseLeave)
            document.removeEventListener('mouseenter', handleMouseEnter)
        }
    }, [isVisible])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none fixed inset-0 z-[9999] hidden md:block"
                >
                    {/* Precision Core Dot removed as per user request */}
                    {/* The component now only manages transparent events if any, or should be removed if unused. 
                        Keeping structure in case user wants to add trails back later. 
                        Currently this renders nothing visible. */ }
                </motion.div>
            )}
        </AnimatePresence>
    )
}
