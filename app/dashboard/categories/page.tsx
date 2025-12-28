import { createClient } from '@/lib/supabase/server'
import CollectionsManager from '../settings/collections-manager'

export default async function CategoriesPage() {
    const supabase = await createClient()
    const { data: collections } = await supabase
        .from('collections')
        .select('*')
        .order('name', { ascending: true })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                <p className="text-muted-foreground">Manage your resource categories.</p>
            </div>

            <CollectionsManager collections={collections} />
        </div>
    )
}
