'use client'

import '@google/model-viewer'
import { Button } from '@/components/ui/button'
import { Maximize2 } from 'lucide-react'
import React from 'react'



interface ModelViewerProps {
    src: string
    poster?: string
}

export function ModelViewer({ src, poster }: ModelViewerProps) {
    return (
        <div className="relative w-full h-[400px] bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden border group">
            {/* @ts-ignore */}
            <model-viewer
                src={src}
                poster={poster}
                auto-rotate
                camera-controls
                exposure="1"
                alt="A 3D model"
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
            >
                <div slot="progress-bar"></div>
            </model-viewer>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="secondary">
                    <Maximize2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
