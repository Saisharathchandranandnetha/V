import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import ResourceForm from './resource-form'

export default async function NewResourcePage() {
    // Fetch categories for dropdown
    const categoriesData = await db.select()
        .from(categories)
        .orderBy(asc(categories.name))

    return <ResourceForm initialCategories={categoriesData || []} />
}
