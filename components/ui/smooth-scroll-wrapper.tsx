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
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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
