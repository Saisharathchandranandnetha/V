import { db } from '@/lib/db'
import { resources, categories } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { EditResourceForm } from './edit-resource-form'

export default async function EditResourcePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const [resource] = await db.select()
        .from(resources)
        .where(eq(resources.id, params.id))
        .limit(1)

    // Fetch categories for dropdown
    const categoriesData = await db.select()
        .from(categories)
        .orderBy(asc(categories.name))

    if (!resource) {
        notFound()
    }

    return <EditResourceForm resource={resource as any} initialCategories={categoriesData || []} />
}
