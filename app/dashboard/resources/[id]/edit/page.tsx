import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditResourceForm } from './edit-resource-form'

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: resource, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single()

    // Fetch categories for dropdown
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

    if (error || !resource) {
        notFound()
    }

    return <EditResourceForm resource={resource} initialCategories={categories || []} />
}
