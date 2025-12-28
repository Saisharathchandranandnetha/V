
'use client'

interface SketchfabViewerProps {
    url: string
}

export function SketchfabViewer({ url }: SketchfabViewerProps) {
    // Sketchfab embed usually ends with /embed
    // User might provide the full URL, we might need to extract ID or ensure /embed
    // Assuming user provides valid embed URL or we trust the stored 'sketchfab_url'

    return (
        <div className="relative w-full aspect-video bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden border">
            <iframe
                title="Sketchfab Model"
                width="100%"
                height="100%"
                src={url}
                allow="autoplay; fullscreen; vr"
                className="border-0"
            >
            </iframe>
        </div>
    )
}
