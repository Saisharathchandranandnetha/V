import { createClient } from '@/lib/supabase/server'
import { ResourceCard } from '@/components/resource-card'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function ProjectResourcesPage({ params }: { params: { projectId: string } }) {
    const supabase = await createClient()

    const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('project_id', params.projectId)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Project Resources</h3>
                {/* Future: Add button to create resource linked to this project */}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {resources?.map((resource: any) => (
                    <ResourceCard key={resource.id} resource={resource} />
                ))}
                {(!resources || resources.length === 0) && (
                    <p className="text-muted-foreground col-span-full">No resources found for this project.</p>
                )}
            </div>
        </div>
    )
}
