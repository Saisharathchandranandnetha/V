import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Book, FileText, GraduationCap } from 'lucide-react'
import { use } from 'react'

export default async function ProjectLayout(props: {
    children: React.ReactNode
    params: Promise<{ projectId: string }>
}) {
    const params = await props.params;

    const {
        children
    } = props;

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', params.projectId)
        .single()

    if (!project) return <div>Project not found</div>

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center gap-4 border-b pb-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/teams">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground text-sm">Project Workspace</p>
                </div>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/projects/${params.projectId}/resources`}>
                        <Book className="mr-2 h-4 w-4" />
                        Resources
                    </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/projects/${params.projectId}/notes`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Notes
                    </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/projects/${params.projectId}/paths`}>
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Learning Paths
                    </Link>
                </Button>
            </div>

            <div className="flex-1">
                {children}
            </div>
        </div>
    )
}
