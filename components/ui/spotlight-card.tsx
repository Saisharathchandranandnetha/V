'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SpotlightCardProps extends React.ComponentProps<typeof Card> {
    spotlightColor?: string
}

export function SpotlightCard({
    children,
    className,
    spotlightColor = "rgba(120, 119, 198, 0.3)",
    ...props
}: SpotlightCardProps) {
    const divRef = useRef<HTMLDivElement>(null)
    const isFocused = useRef(false)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top } = e.currentTarget.getBoundingClientRect()
        mouseX.set(e.clientX - left)
        mouseY.set(e.clientY - top)
    }

    const handleFocus = () => {
        isFocused.current = true
    }

    const handleBlur = () => {
        isFocused.current = false
    }

    // Effect to hide spotlight when mouse leaves without resetting state triggers
    const [opacity, setOpacity] = useState(0)
    const handleMouseEnter = () => setOpacity(1)
    const handleMouseLeave = () => setOpacity(0)

    return (
        <div
            className={cn(
                "group relative border border-transparent rounded-xl overflow-hidden bg-background",
                className
            )}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={divRef}
            {...props}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 md:group-hover:opacity-100"
                style={{
                    opacity,
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 80%
            )
          `,
                }}
            />

            {/* Content wrapper with background to block inner spotlight, allowing only border glow if desired, 
          OR keep transparent to let glow show through. 
          For "revealing border" effect, we often leave this transparent or semi-transparent.
      */}
            <div className="relative h-full bg-card/50 backdrop-blur-sm rounded-xl p-6 border-white/5">
                {children}
            </div>
        </div>
    )
}
