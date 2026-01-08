
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LearningPathCard } from '@/components/learning-path-card'

export default async function LearningPathsPage() {
    const supabase = await createClient()
    const { data: paths } = await supabase.from('learning_paths').select('*').order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Learning Paths</h1>
                    <p className="text-muted-foreground">Follow structured paths to master new skills.</p>
                </div>
                <Link href="/dashboard/paths/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Path
                    </Button>
                </Link>
            </div>

            {(!paths || paths.length === 0) ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-muted-foreground min-h-[200px]">
                    No learning paths found. Create one to get started!
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {paths.map(path => (
                        <LearningPathCard key={path.id} path={path} />
                    ))}
                </div>
            )}
        </div>
    )
}
