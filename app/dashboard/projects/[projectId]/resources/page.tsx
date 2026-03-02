import { db } from '@/lib/db'
import { resources } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { ResourceCard } from '@/components/resource-card'

export default async function ProjectResourcesPage(props: { params: Promise<{ projectId: string }> }) {
    const params = await props.params;

    const projectResources = await db.select()
        .from(resources)
        .where(eq(resources.projectId, params.projectId))
        .orderBy(desc(resources.createdAt))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Project Resources</h3>
                {/* Future: Add button to create resource linked to this project */}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projectResources?.map((resource: any) => (
                    <ResourceCard key={resource.id} resource={resource} />
                ))}
                {(!projectResources || projectResources.length === 0) && (
                    <p className="text-muted-foreground col-span-full">No resources found for this project.</p>
                )}
            </div>
        </div>
    )
}
