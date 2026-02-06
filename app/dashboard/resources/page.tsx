
import { ResourcesManager } from '@/components/resources/resources-manager'
import { createClient } from '@/lib/supabase/server'

export default async function ResourcesPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q: searchQuery } = await searchParams
    const supabase = await createClient()
    const { data: resources } = await supabase.from('resources')
        .select('id, title, type, summary, tags, url, created_at')
        .order('created_at', { ascending: false })

    // Fetch categories for dropdown (ResourcesManager -> AddResourceDialog needs them)
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

    return (
        <ResourcesManager
            initialResources={resources || []}
            searchQuery={searchQuery}
            categories={categories || []}
        />
    )
}
