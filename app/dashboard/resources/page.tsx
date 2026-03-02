import { auth } from '@/auth'
import { db } from '@/lib/db'
import { resources, categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ResourcesManager } from '@/components/resources/resources-manager'
import { redirect } from 'next/navigation'

export default async function ResourcesPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q: searchQuery } = await searchParams
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const [resourcesData, categoriesData] = await Promise.all([
        db.select().from(resources).where(eq(resources.userId, session.user.id)),
        db.select().from(categories).where(eq(categories.userId, session.user.id)),
    ])

    return (
        <ResourcesManager
            initialResources={resourcesData as any}
            searchQuery={searchQuery}
            categories={categoriesData as any}
        />
    )
}
