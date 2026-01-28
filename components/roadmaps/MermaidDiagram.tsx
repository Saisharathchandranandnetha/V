'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

interface MermaidDiagramProps {
    chart: string
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [id] = useState(`mermaid-${Math.random().toString(36).substring(2, 9)}`)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'inherit'
        })
    }, [])

    useEffect(() => {
        if (!ref.current || !chart) return

        const renderDiagram = async () => {
            try {
                setError(null)
                const cleanChart = chart.trim()
                const { svg } = await mermaid.render(id, cleanChart)
                if (ref.current) {
                    ref.current.innerHTML = svg
                    // Force SVG to be responsive
                    const svgElement = ref.current.querySelector('svg')
                    if (svgElement) {
                        svgElement.style.maxWidth = '100%'
                        svgElement.style.height = 'auto'
                    }
                }
            } catch (err: any) {
                console.error('Mermaid render error:', err)
                setError(err.message || 'Syntax Error')
            }
        }

        renderDiagram()
    }, [chart, id])

    if (!chart) {
        return (
            <div className="w-full h-40 flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                No steps to visualize yet.
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full h-40 flex flex-col items-center justify-center text-destructive bg-destructive/5 rounded-xl border border-destructive/20 gap-2">
                <p className="font-semibold text-sm">Failed to render diagram</p>
                <p className="text-xs opacity-70 px-4 text-center">{error}</p>
                <code className="text-[10px] mt-2 bg-background/50 p-2 rounded max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {chart.split('\n')[0]}...
                </code>
            </div>
        )
    }

    return (
        <div className="w-full overflow-x-auto p-4 bg-card rounded-xl border border-border min-h-[300px] flex items-center justify-center">
            <div ref={ref} id={`container-${id}`} className="w-full h-full text-center" />
        </div>
    )
}
