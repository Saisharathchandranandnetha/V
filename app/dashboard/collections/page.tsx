import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Folder } from 'lucide-react'
import { CreateCollectionDialog } from './create-collection-dialog'
import { CollectionCard } from './collection-card'
import { HoverEffect } from '@/components/ui/hover-effect'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { DashboardSearch } from '@/components/dashboard-search'

export default async function CollectionsPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q: searchQuery } = await searchParams
    const supabase = await createClient()
    const { data: collections } = await supabase
        .from('collections')
        .select('*, resources(count)')
        .order('name', { ascending: true })

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
                {collections?.filter((c: any) =>
                    !searchQuery ||
                    (c.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                ).map((collection: any) => (
                    <StaggerItem key={collection.id} className="h-full">
                        <HoverEffect variant="lift">
                            <CollectionCard collection={collection} />
                        </HoverEffect>
                    </StaggerItem>
                ))}

                {collections?.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No collections found. Create one to group your resources.
                    </div>
                )}
            </StaggerContainer>
        </div>
    )
}
