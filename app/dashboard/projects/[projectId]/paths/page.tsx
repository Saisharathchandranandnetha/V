import { createClient } from '@/lib/supabase/server'
import { LearningPathCard } from '@/components/learning-path-card'

export default async function ProjectPathsPage({ params }: { params: { projectId: string } }) {
    const supabase = await createClient()

    const { data: paths } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('project_id', params.projectId)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Project Learning Paths</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paths?.map((path: any) => (
                    <LearningPathCard key={path.id} path={path} />
                ))}
                {(!paths || paths.length === 0) && (
                    <p className="text-muted-foreground col-span-full">No learning paths found for this project.</p>
                )}
            </div>
        </div>
    )
}
