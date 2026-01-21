"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"
import ColorThief from "colorthief"

interface BackgroundWrapperProps {
    deviceType: 'mobile' | 'tablet' | 'desktop'
    customUrl?: string | null
    children?: React.ReactNode
}

export function BackgroundWrapper({ deviceType, customUrl }: BackgroundWrapperProps) {
    const imgRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        if (!customUrl) {
            // Reset to defaults if no custom background
            document.documentElement.style.removeProperty('--card')
            document.documentElement.style.removeProperty('--popover')
            document.documentElement.style.removeProperty('--sidebar')
            document.documentElement.style.removeProperty('--muted')

            // Reset text colors
            document.documentElement.style.removeProperty('--foreground')
            document.documentElement.style.removeProperty('--card-foreground')
            document.documentElement.style.removeProperty('--popover-foreground')
            document.documentElement.style.removeProperty('--sidebar-foreground')
            document.documentElement.style.removeProperty('--muted-foreground')
            return
        }

        const applyTheme = () => {
            if (!imgRef.current) return

            try {
                const colorThief = new ColorThief()
                // getColor returns [r, g, b]
                const color = colorThief.getColor(imgRef.current)
                if (color) {
                    const [r, g, b] = color

                    // Helper to adjust color for glass effect
                    // We literally inject the RGB values into global CSS variables if they were using rgb format, 
                    // but our globals use OKLCH. 
                    // However, standard CSS vars can be overridden on :root (or html element).
                    // We'll use RGBA for the glass effect as it's universally supported and easy to manipulate opacity.

                    // Card: 20% opacity of dominant color
                    document.documentElement.style.setProperty('--card', `${r} ${g} ${b} / 0.2`)

                    // Popover: 20% opacity
                    document.documentElement.style.setProperty('--popover', `${r} ${g} ${b} / 0.2`)

                    // Sidebar: 15% opacity
                    document.documentElement.style.setProperty('--sidebar', `${r} ${g} ${b} / 0.15`)

                    // Muted: 10% opacity
                    document.documentElement.style.setProperty('--muted', `${r} ${g} ${b} / 0.1`)

                    // Note: Our globals.css defines these as `oklch(...)`. 
                    // If we overwrite --card with `r g b / a`, tailwind classes like `bg-card` might break 
                    // if they expect a specific format for `bg-opacity`.
                    // BUT: Tailwind v4 (which seems to be used given the @theme usage? Or v3?)
                    // Checking globals.css, it uses `@theme inline`. This suggests generic CSS vars.
                    // The standard Tailwind `bg-card` utilizes `--card` variable.
                    // If the variable in globals is `oklch(1 0 0 / 0.2)` (which includes the alpha), 
                    // then `bg-card` likely just uses that var directly.
                    // Let's check how it's used. `bg-card` typically is `background-color: var(--card)`.
                    // So setting `--card: rgba(r,g,b, 0.2)` should work validly.

                    // Let's refine the value to match the format Tailwind expects if it's splitting opacity.
                    // Looking at globals.css: `--card: oklch(1 0 0 / 0.2);`
                    // It seems the opacity is IN the variable.
                    // So we can just set the full color string.
                    document.documentElement.style.setProperty('--card', `rgba(${r}, ${g}, ${b}, 0.2)`)
                    document.documentElement.style.setProperty('--popover', `rgba(${r}, ${g}, ${b}, 0.2)`)
                    document.documentElement.style.setProperty('--sidebar', `rgba(${r}, ${g}, ${b}, 0.15)`)
                    document.documentElement.style.setProperty('--muted', `rgba(${r}, ${g}, ${b}, 0.1)`)

                    // --- Text Contrast Adjustment ---
                    // Calculate brightness (YIQ formula)
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000

                    // Threshold: 128 (midpoint). 
                    // If brightness > 128 (Light background) -> Dark text
                    // If brightness <= 128 (Dark background) -> Light text

                    if (brightness > 128) {
                        // Light Background -> Dark Text
                        // Using OKLCH values from globals.css for consistency where possible, 
                        // or just standard colors. matching standard globals.
                        const darkText = 'oklch(0.145 0 0)' // near black
                        const darkMuted = 'oklch(0.40 0 0)' // dark grey

                        document.documentElement.style.setProperty('--foreground', darkText)
                        document.documentElement.style.setProperty('--card-foreground', darkText)
                        document.documentElement.style.setProperty('--popover-foreground', darkText)
                        document.documentElement.style.setProperty('--sidebar-foreground', darkText)
                        document.documentElement.style.setProperty('--muted-foreground', darkMuted)
                    } else {
                        // Dark Background -> Light Text
                        const lightText = 'oklch(0.985 0 0)' // near white
                        const lightMuted = 'oklch(0.708 0 0)' // light grey

                        document.documentElement.style.setProperty('--foreground', lightText)
                        document.documentElement.style.setProperty('--card-foreground', lightText)
                        document.documentElement.style.setProperty('--popover-foreground', lightText)
                        document.documentElement.style.setProperty('--sidebar-foreground', lightText)
                        document.documentElement.style.setProperty('--muted-foreground', lightMuted)
                    }
                }
            } catch (e) {
                console.error("Failed to extract color from background:", e)
            }
        }

        const img = imgRef.current
        if (img) {
            if (img.complete) {
                applyTheme()
            } else {
                img.addEventListener('load', applyTheme)
            }
        }

        return () => {
            if (img) img.removeEventListener('load', applyTheme)
        }
    }, [customUrl])

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Custom Background Override */}
            {customUrl && (
                <div className="absolute inset-0">
                    <img
                        ref={imgRef}
                        src={customUrl}
                        alt="Background"
                        className="w-full h-full object-cover transition-opacity duration-700"
                        crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-black/20" /> {/* Slight dim for text readability */}
                </div>
            )}

            {!customUrl && (
                <>
                    {/* Desktop Background - Luxury Aurora/Mesh Gradient */}
                    {deviceType === 'desktop' && (
                        <div className="absolute inset-0 bg-[#0a0a0a]">
                            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] animate-pulse" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] animate-pulse delay-1000" />
                            <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-slate-900/50 blur-[100px]" />
                            {/* Subtle grain or texture overlay could go here */}
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
                        </div>
                    )}

                    {/* Mobile/Tablet Background - Simplified, Vertical Luxury */}
                    {(deviceType === 'mobile' || deviceType === 'tablet') && (
                        <div className="absolute inset-0 bg-[#050505]">
                            <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-purple-900/20 to-transparent blur-[80px]" />
                            <div className="absolute bottom-0 right-0 w-full h-[40%] bg-gradient-to-t from-indigo-900/20 to-transparent blur-[80px]" />
                        </div>
                    )}

                    {/* Light Mode Override (if user forces light mode, keep it elegant but light) */}
                    <div className="dark:hidden absolute inset-0 bg-gradient-to-br from-slate-50 to-gray-200">
                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 blur-[100px]" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/30 blur-[100px]" />
                    </div>
                </>
            )}
        </div>
    )
}

