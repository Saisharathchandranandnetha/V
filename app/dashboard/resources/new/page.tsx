import { createClient } from '@/lib/supabase/server'
import ResourceForm from './resource-form'

export default async function NewResourcePage() {
    const supabase = await createClient()

    // Fetch categories for dropdown
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

    return <ResourceForm initialCategories={categories || []} />
}
