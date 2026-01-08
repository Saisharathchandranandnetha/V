import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Folder } from 'lucide-react'
import { CreateCollectionDialog } from './create-collection-dialog'
import { CollectionCard } from './collection-card'

export default async function CollectionsPage() {
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

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {collections?.map((collection: any) => (
                    <CollectionCard key={collection.id} collection={collection} />
                ))}

                {collections?.length === 0 && (
                    <div className="col-span-full p-8 border rounded-lg border-dashed text-center text-muted-foreground">
                        No collections found. Create one in Categories.
                    </div>
                )}
            </div>
        </div>
    )
}
