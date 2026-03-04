'use client'

import React, { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { usePathname } from 'next/navigation'

export function SmoothScrollWrapper({ children }: { children: React.ReactNode }) {
    const lenisRef = useRef<Lenis | null>(null)

    const pathname = usePathname()
    // Disable smooth scroll on chat routes to avoid conflicts with native scrolling
    const isChat = pathname?.startsWith('/dashboard/chat')

    useEffect(() => {
        if (isChat) return

        const lenis = new Lenis({
            lerp: 0.06, // Creates that buttery infinite scroll feeling instead of fixed duration
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
        })

        lenisRef.current = lenis

        function raf(time: number) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)

        return () => {
            lenis.destroy()
        }
    }, [isChat])

    return <>{children}</>
}
