
'use client'

import Lottie from 'lottie-react'
import { useState, useEffect } from 'react'

interface LottiePlayerProps {
    src: string | object // URL or JSON object
    loop?: boolean
    autoplay?: boolean
    className?: string
}

export function LottiePlayer({ src, loop = true, autoplay = true, className }: LottiePlayerProps) {
    const [animationData, setAnimationData] = useState<object | null>(null)

    useEffect(() => {
        if (typeof src === 'string') {
            fetch(src)
                .then(res => res.json())
                .then(data => setAnimationData(data))
                .catch(err => console.error("Failed to load Lottie JSON", err))
        } else {
            setAnimationData(src)
        }
    }, [src])

    if (!animationData) return <div className="h-full w-full bg-muted animate-pulse rounded-md" />

    return (
        <div className={className}>
            <Lottie animationData={animationData} loop={loop} autoplay={autoplay} />
        </div>
    )
}
