import { auth } from '@/auth'
import { db } from '@/lib/db'
import { collections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { CreateCollectionDialog } from './create-collection-dialog'
import { CollectionCard } from './collection-card'
import { HoverEffect } from '@/components/ui/hover-effect'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { DashboardSearch } from '@/components/dashboard-search'
import { redirect } from 'next/navigation'

export default async function CollectionsPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q: searchQuery } = await searchParams
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const collectionsData = await db.select().from(collections).where(eq(collections.userId, session.user.id))

    const filtered = collectionsData.filter((c: any) =>
        !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
                    <p className="text-muted-foreground">Browse your resources by collection.</p>
                </div>
                <CreateCollectionDialog />
            </div>
            <DashboardSearch placeholder="Search collections..." />
            <StaggerContainer key={searchQuery} className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((collection: any) => (
                    <StaggerItem key={collection.id} className="h-full">
                        <HoverEffect variant="lift">
                            <CollectionCard collection={collection} />
                        </HoverEffect>
                    </StaggerItem>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No collections found. Create one to group your resources.
                    </div>
                )}
            </StaggerContainer>
        </div>
    )
}
