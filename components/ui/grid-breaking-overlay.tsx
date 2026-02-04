'use client'

import React, { useMemo } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export function GridBreakingOverlay() {
    const { scrollY } = useScroll()

    // Create random shards for spatial depth
    const shards = useMemo(() => [
        { id: 1, top: '15%', left: '5%', size: 'w-32 h-64', rotate: 15, delay: 0, speed: 0.1 },
        { id: 2, top: '60%', left: '85%', size: 'w-48 h-48', rotate: -10, delay: 2, speed: 0.15 },
        { id: 3, top: '40%', left: '10%', size: 'w-24 h-48', rotate: 45, delay: 4, speed: 0.05 },
        { id: 4, top: '10%', left: '75%', size: 'w-64 h-32', rotate: -20, delay: 1, speed: 0.12 },
    ], [])

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
            {shards.map((shard) => (
                <Shard key={shard.id} shard={shard} scrollY={scrollY} />
            ))}
        </div>
    )
}

function Shard({ shard, scrollY }: { shard: any, scrollY: any }) {
    // Parallax movement based on scroll
    const y = useTransform(scrollY, [0, 2000], [0, -200 * shard.speed])

    return (
        <motion.div
            style={{
                top: shard.top,
                left: shard.left,
                y,
                rotate: shard.rotate
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: 0.07,
                scale: 1,
                transition: { duration: 2, delay: shard.delay }
            }}
            className={`absolute ${shard.size} glass-dark border-white/5 blur-[2px]`}
        />
    )
}
