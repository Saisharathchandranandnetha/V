'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MotionValue, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CanvasScrollSequenceProps {
    className?: string
    // Optional external scroll progress (0→1). If provided, animation is scoped to that container.
    scrollProgress?: MotionValue<number>
}

export function CanvasScrollSequence({ className, scrollProgress }: CanvasScrollSequenceProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Fallback to full-page scroll if no external progress is provided
    const { scrollYProgress: pageProgress } = useScroll()
    const activeProgress = scrollProgress ?? pageProgress

    // Map progress (0 → 1) to frame index (1 → 120)
    const frameIndex = useTransform(activeProgress, [0, 1], [1, 120])

    const imagesRef = useRef<(HTMLImageElement | null)[]>([])
    const [loaded, setLoaded] = useState(false)

    const drawFrame = (index: number) => {
        const clampedIndex = Math.min(120, Math.max(1, Math.floor(index)))
        if (!canvasRef.current || !imagesRef.current[clampedIndex]) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const img = imagesRef.current[clampedIndex]!

        const canvasRatio = canvas.width / canvas.height
        const imgRatio = img.width / img.height

        let drawWidth = canvas.width
        let drawHeight = canvas.height
        let offsetX = 0
        let offsetY = 0

        if (canvasRatio > imgRatio) {
            drawHeight = canvas.width / imgRatio
            offsetY = (canvas.height - drawHeight) / 2
        } else {
            drawWidth = canvas.height * imgRatio
            offsetX = (canvas.width - drawWidth) / 2
        }

        requestAnimationFrame(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
        })
    }

    // Preload all 120 images on mount
    useEffect(() => {
        let isMounted = true
        const preloadImages = async () => {
            const promises = []
            for (let i = 1; i <= 120; i++) {
                const img = new Image()
                img.src = `/images/spiral/frame-${String(i).padStart(3, '0')}.jpg`
                promises.push(
                    new Promise<void>((resolve) => {
                        img.onload = () => { imagesRef.current[i] = img; resolve() }
                        img.onerror = () => { imagesRef.current[i] = null; resolve() }
                    })
                )
            }
            await Promise.all(promises)
            if (isMounted) {
                setLoaded(true)
                drawFrame(1) // always start at frame 1
            }
        }
        preloadImages()
        return () => { isMounted = false }
    }, [])

    // Drive animation directly from motion value — no React state, no re-renders
    useMotionValueEvent(frameIndex, "change", (latestVal) => {
        if (loaded) drawFrame(latestVal)
    })

    return (
        <div className={cn("absolute inset-0 w-full h-full pointer-events-none", className)}>
            <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
                className="w-full h-full object-cover"
                style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease' }}
            />
            {/* Edge fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none" />
        </div>
    )
}
