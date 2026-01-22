import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

export default async function ProjectNotesPage({ params }: { params: { projectId: string } }) {
    const supabase = await createClient()

    const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', params.projectId)
        .order('updated_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Project Notes</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notes?.map((note: any) => (
                    <Link key={note.id} href={`/dashboard/notes/${note.id}`}>
                        <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardHeader>
                                <CardTitle className="line-clamp-1">{note.title}</CardTitle>
                                <CardDescription>
                                    Updated {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
                {(!notes || notes.length === 0) && (
                    <p className="text-muted-foreground col-span-full">No notes found for this project.</p>
                )}
            </div>
        </div>
    )
}
