
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Box } from 'lucide-react'

interface SplineViewerProps {
    url: string
}

export function SplineViewer({ url }: SplineViewerProps) {
    const [loaded, setLoaded] = useState(false)

    if (!url) return null

    return (
        <div className="relative w-full aspect-video bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden border">
            {!loaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <Box className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">Interactive 3D Scene</p>
                    <Button onClick={() => setLoaded(true)} variant="secondary">
                        Load 3D View
                    </Button>
                </div>
            )}
            {loaded && (
                <iframe
                    src={url}
                    className="w-full h-full border-0"
                    title="Spline 3D Scene"
                />
            )}
        </div>
    )
}
