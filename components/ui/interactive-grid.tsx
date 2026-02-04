'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

export function InteractiveGrid() {
    const containerRef = useRef<HTMLDivElement>(null)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const springConfig = { damping: 25, stiffness: 150 }
    const x = useSpring(mouseX, springConfig)
    const y = useSpring(mouseY, springConfig)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return
            const { left, top } = containerRef.current.getBoundingClientRect()
            mouseX.set(e.clientX - left)
            mouseY.set(e.clientY - top)
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-[0.2] dark:opacity-[0.4]"
            style={{
                backgroundImage: `linear-gradient(to right, oklch(var(--primary) / 0.1) 1px, transparent 1px), 
                                  linear-gradient(to bottom, oklch(var(--primary) / 0.1) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
            }}
        >
            <motion.div
                className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full w-[400px] h-[400px]"
                style={{
                    x,
                    y,
                    translateX: '-50%',
                    translateY: '-50%',
                    left: 0,
                    top: 0
                }}
            />
        </div>
    )
}
