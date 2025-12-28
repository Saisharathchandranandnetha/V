import { createClient } from '@/lib/supabase/server'
import ResourceForm from './resource-form'

export default async function NewResourcePage() {
    const supabase = await createClient()

    // Fetch collections for dropdown
    const { data: collections } = await supabase
        .from('collections')
        .select('*')
        .order('name', { ascending: true })

    return <ResourceForm initialCollections={collections || []} />
}
