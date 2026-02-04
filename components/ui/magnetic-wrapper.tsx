'use client'

import React, { useRef, useState, useMemo } from 'react'
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion'

interface MagneticWrapperProps {
    children: React.ReactNode
    strength?: number
    className?: string
}

export function MagneticWrapper({ children, strength = 0.5, className }: MagneticWrapperProps) {
    const ref = useRef<HTMLDivElement>(null)

    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const springConfig = { damping: 15, stiffness: 150 }
    const springX = useSpring(x, springConfig)
    const springY = useSpring(y, springConfig)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return

        const { clientX, clientY } = e
        const { left, top, width, height } = ref.current.getBoundingClientRect()

        const centerX = left + width / 2
        const centerY = top + height / 2

        const distanceX = clientX - centerX
        const distanceY = clientY - centerY

        x.set(distanceX * strength)
        y.set(distanceY * strength)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: springX, y: springY }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
