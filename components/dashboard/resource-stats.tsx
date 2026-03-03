import { db } from '@/lib/db'
import { resources, notes } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Library, StickyNote } from 'lucide-react'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { HoverEffect } from '@/components/ui/hover-effect'
import Link from 'next/link'

export async function ResourceStats({ userId }: { userId: string }) {
    // We execute these in parallel as they are independent but related in this widget
    const [resourcesRes, notesRes] = await Promise.all([
        db.select({ count: count() }).from(resources).where(eq(resources.userId, userId)),
        db.select({ count: count() }).from(notes).where(eq(notes.userId, userId))
    ])

    const resourcesCount = resourcesRes[0]?.count || 0
    const notesCount = notesRes[0]?.count || 0

    return (
        <div className="grid grid-cols-2 gap-4 h-full">
            <HoverEffect variant="lift" className="h-full">
                <Link href="/dashboard/resources" prefetch={false} className="block h-full">
                    <SpotlightCard className="h-full flex flex-col justify-center items-center text-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                            <Library className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold">{resourcesCount}</div>
                        <p className="text-xs text-muted-foreground">Resources</p>
                    </SpotlightCard>
                </Link>
            </HoverEffect>
            <HoverEffect variant="lift" className="h-full">
                <Link href="/dashboard/notes" prefetch={false} className="block h-full">
                    <SpotlightCard className="h-full flex flex-col justify-center items-center text-center p-4 bg-gradient-to-br from-orange-500/10 to-cyan-500/10 border-orange-500/20">
                        <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
                            <StickyNote className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="text-2xl font-bold">{notesCount}</div>
                        <p className="text-xs text-muted-foreground">Notes</p>
                    </SpotlightCard>
                </Link>
            </HoverEffect>
        </div>
    )
}
