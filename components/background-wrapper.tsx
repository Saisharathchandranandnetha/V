"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"

interface BackgroundWrapperProps {
    deviceType: 'mobile' | 'tablet' | 'desktop'
    customUrl?: string | null
    children?: React.ReactNode
}

export function BackgroundWrapper({ deviceType, customUrl, children }: BackgroundWrapperProps) {
    const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null)

    useEffect(() => {
        if (!customUrl || !imgElement) {
            // Reset to defaults if no custom background
            if (!customUrl) {
                const vars = ['--card', '--popover', '--sidebar', '--muted', '--foreground', '--card-foreground', '--popover-foreground', '--sidebar-foreground', '--muted-foreground']
                vars.forEach(v => document.documentElement.style.removeProperty(v))
            }
            return
        }

        const applyTheme = async () => {
            try {
                // Lazy load ColorThief to reduce initial bundle size
                const ColorThief = (await import('colorthief')).default
                const colorThief = new ColorThief()

                // Execute heavy work in idle time to avoid blocking UI
                requestIdleCallback(() => {
                    if (imgElement.complete) {
                        try {
                            const color = colorThief.getColor(imgElement)
                            if (color) {
                                const [r, g, b] = color

                                // Set Variables
                                document.documentElement.style.setProperty('--card', `rgba(${r}, ${g}, ${b}, 0.2)`)
                                document.documentElement.style.setProperty('--popover', `rgba(${r}, ${g}, ${b}, 0.2)`)
                                document.documentElement.style.setProperty('--sidebar', `rgba(${r}, ${g}, ${b}, 0.15)`)
                                document.documentElement.style.setProperty('--muted', `rgba(${r}, ${g}, ${b}, 0.1)`)

                                // Contrast Logic
                                const brightness = (r * 299 + g * 587 + b * 114) / 1000
                                if (brightness > 128) {
                                    // Light Background -> Dark Text
                                    const darkText = 'oklch(0.145 0 0)'
                                    const darkMuted = 'oklch(0.40 0 0)'
                                    document.documentElement.style.setProperty('--foreground', darkText)
                                    document.documentElement.style.setProperty('--card-foreground', darkText)
                                    document.documentElement.style.setProperty('--popover-foreground', darkText)
                                    document.documentElement.style.setProperty('--sidebar-foreground', darkText)
                                    document.documentElement.style.setProperty('--muted-foreground', darkMuted)
                                } else {
                                    // Dark Background -> Light Text
                                    const lightText = 'oklch(0.985 0 0)'
                                    const lightMuted = 'oklch(0.708 0 0)'
                                    document.documentElement.style.setProperty('--foreground', lightText)
                                    document.documentElement.style.setProperty('--card-foreground', lightText)
                                    document.documentElement.style.setProperty('--popover-foreground', lightText)
                                    document.documentElement.style.setProperty('--sidebar-foreground', lightText)
                                    document.documentElement.style.setProperty('--muted-foreground', lightMuted)
                                }
                            }
                        } catch (e) {
                            console.error("Color extraction failed:", e)
                        }
                    }
                })
            } catch (e) {
                console.error("Failed to load ColorThief:", e)
            }
        }

        if (imgElement.complete) {
            applyTheme()
        } else {
            imgElement.addEventListener('load', applyTheme)
        }

        return () => {
            imgElement.removeEventListener('load', applyTheme)
        }
    }, [customUrl, imgElement])

    return (
        <>
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                {/* Custom Background Override */}
                {customUrl && (
                    <div className="absolute inset-0">
                        <Image
                            src={customUrl}
                            alt="Background"
                            fill
                            className="object-cover transition-opacity duration-700"
                            priority={true}
                            quality={deviceType === 'mobile' ? 60 : 80}
                            onLoad={(e) => setImgElement(e.currentTarget)}
                            unoptimized={true}
                            crossOrigin="anonymous"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                    </div>
                )}

                {!customUrl && (
                    <>
                        {/* Desktop Background - Luxury Aurora/Mesh Gradient */}
                        {deviceType === 'desktop' && (
                            <div className="absolute inset-0 bg-[#050505]">
                                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[120px] animate-blob" />
                                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] animate-blob animation-delay-2000" />
                                <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px] animate-blob animation-delay-4000" />

                                {/* Texture & Overlay */}
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-soft-light pointer-events-none" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-black/40" />
                            </div>
                        )}

                        {/* Mobile/Tablet Background - Simplified, Vertical Luxury */}
                        {(deviceType === 'mobile' || deviceType === 'tablet') && (
                            <div className="absolute inset-0 bg-[#050505]">
                                <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-indigo-900/20 to-transparent blur-[60px] animate-pulse" />
                                <div className="absolute bottom-0 right-0 w-full h-[50%] bg-gradient-to-t from-purple-900/20 to-transparent blur-[60px] animate-pulse delay-1000" />
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] mix-blend-soft-light" />
                            </div>
                        )}

                        {/* Light Mode Override - Modernized */}
                        <div className="dark:hidden absolute inset-0 bg-slate-50">
                            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-100/50 blur-[100px] animate-blob" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-100/50 blur-[100px] animate-blob animation-delay-2000" />
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-multiply" />
                        </div>
                    </>
                )}
            </div>
            {children}
        </>
    )
}

