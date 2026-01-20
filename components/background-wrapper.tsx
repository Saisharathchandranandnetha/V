"use client"

import { cn } from "@/lib/utils"

interface BackgroundWrapperProps {
    deviceType: 'mobile' | 'tablet' | 'desktop'
    customUrl?: string | null
    children?: React.ReactNode
}

export function BackgroundWrapper({ deviceType, customUrl }: BackgroundWrapperProps) {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Custom Background Override */}
            {customUrl && (
                <div className="absolute inset-0">
                    <img src={customUrl} alt="Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40" /> {/* Dimming overlay for readability */}
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

                            {/* Explicit Desktop Text for troubleshooting/verification */}
                            {/* <div className="absolute top-4 right-4 text-xs text-white/10 font-mono">Desktop Mode</div> */}
                        </div>
                    )}

                    {/* Mobile/Tablet Background - Simplified, Vertical Luxury */}
                    {(deviceType === 'mobile' || deviceType === 'tablet') && (
                        <div className="absolute inset-0 bg-[#050505]">
                            <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-purple-900/20 to-transparent blur-[80px]" />
                            <div className="absolute bottom-0 right-0 w-full h-[40%] bg-gradient-to-t from-indigo-900/20 to-transparent blur-[80px]" />

                            {/* Explicit Mobile Text for troubleshooting/verification */}
                            {/* <div className="absolute top-4 right-4 text-xs text-white/10 font-mono">Mobile Mode</div> */}
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
