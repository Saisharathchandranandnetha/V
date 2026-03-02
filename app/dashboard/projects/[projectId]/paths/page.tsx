import { db } from '@/lib/db'
import { learningPaths } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { LearningPathCard } from '@/components/learning-path-card'

export default async function ProjectPathsPage(props: { params: Promise<{ projectId: string }> }) {
    const params = await props.params;

    const projectPaths = await db.select()
        .from(learningPaths)
        .where(eq(learningPaths.projectId, params.projectId))
        .orderBy(desc(learningPaths.createdAt))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Project Learning Paths</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projectPaths?.map((path: any) => (
                    <LearningPathCard key={path.id} path={path} />
                ))}
                {(!projectPaths || projectPaths.length === 0) && (
                    <p className="text-muted-foreground col-span-full">No learning paths found for this project.</p>
                )}
            </div>
        </div>
    )
}
