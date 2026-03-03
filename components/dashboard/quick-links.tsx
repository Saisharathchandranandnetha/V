import { db } from '@/lib/db'
import { learningPaths } from '@/lib/db/schema'
import { eq, count, ne, and } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Library, StickyNote, Route, BookOpen, Layers, Users, MessageSquare, BarChart3, Settings } from 'lucide-react'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { HoverEffect } from '@/components/ui/hover-effect'
import Link from 'next/link'

export async function QuickLinks({ userId }: { userId: string }) {
    const [pathsResult] = await db.select({ count: count() })
        .from(learningPaths)
        .where(eq(learningPaths.userId, userId))
    const pathsCount = pathsResult.count

    return (
        <div className="space-y-2 mt-8">
            <h3 className="text-xl font-bold tracking-tight">Quick Access</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <HoverEffect variant="glow" className="col-span-2 md:col-span-2 lg:col-span-2 relative group overflow-hidden rounded-xl">
                    <Link href="/dashboard/paths" prefetch={false} className="block h-full w-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-cyan-700 opacity-90 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                            <Route className="h-8 w-8 text-white/80" />
                            <div>
                                <h4 className="font-bold text-lg">Learning Paths</h4>
                                <p className="text-sm text-white/70">{pathsCount || 0} active courses</p>
                            </div>
                        </div>
                    </Link>
                </HoverEffect>

                <HoverEffect variant="glow" className="col-span-1">
                    <Link href="/dashboard/collections" prefetch={false} className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                        <BookOpen className="h-6 w-6 mb-2 text-primary" />
                        <span className="text-sm font-medium">Collections</span>
                    </Link>
                </HoverEffect>

                <HoverEffect variant="glow" className="col-span-1">
                    <Link href="/dashboard/categories" prefetch={false} className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                        <Layers className="h-6 w-6 mb-2 text-primary" />
                        <span className="text-sm font-medium">Categories</span>
                    </Link>
                </HoverEffect>

                <HoverEffect variant="glow" className="col-span-1">
                    <Link href="/dashboard/roadmaps" prefetch={false} className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                        <MapIcon className="h-6 w-6 mb-2 text-primary" />
                        <span className="text-sm font-medium">Roadmaps</span>
                    </Link>
                </HoverEffect>

                <HoverEffect variant="glow" className="col-span-1">
                    <Link href="/dashboard/teams" prefetch={false} className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                        <Users className="h-6 w-6 mb-2 text-primary" />
                        <span className="text-sm font-medium">Teams</span>
                    </Link>
                </HoverEffect>

                <HoverEffect variant="glow" className="col-span-1">
                    <Link href="/dashboard/chat" prefetch={false} className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                        <MessageSquare className="h-6 w-6 mb-2 text-primary" />
                        <span className="text-sm font-medium">Chat</span>
                    </Link>
                </HoverEffect>

                <HoverEffect variant="glow" className="col-span-1">
                    <Link href="/dashboard/analytics" prefetch={false} className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                        <BarChart3 className="h-6 w-6 mb-2 text-primary" />
                        <span className="text-sm font-medium">Analytics</span>
                    </Link>
                </HoverEffect>

                <HoverEffect variant="glow" className="col-span-1">
                    <Link href="/dashboard/settings" prefetch={false} className="flex flex-col items-center justify-center h-32 bg-card/50 backdrop-blur-sm border rounded-xl hover:bg-card/80 transition-colors p-4 text-center">
                        <Settings className="h-6 w-6 mb-2 text-primary" />
                        <span className="text-sm font-medium">Settings</span>
                    </Link>
                </HoverEffect>
            </div>
        </div>
    )
}

function MapIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" x2="9" y1="3" y2="18" />
            <line x1="15" x2="15" y1="6" y2="21" />
        </svg>
    )
}
