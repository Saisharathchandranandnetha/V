import { db } from '@/lib/db'
import { notes } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

export default async function ProjectNotesPage(props: { params: Promise<{ projectId: string }> }) {
    const params = await props.params;

    const projectNotes = await db.select()
        .from(notes)
        .where(eq(notes.projectId, params.projectId))
        .orderBy(desc(notes.updatedAt))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Project Notes</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projectNotes?.map((note: any) => (
                    <Link key={note.id} href={`/dashboard/notes/${note.id}`}>
                        <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardHeader>
                                <CardTitle className="line-clamp-1">{note.title}</CardTitle>
                                <CardDescription>
                                    Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
                {(!projectNotes || projectNotes.length === 0) && (
                    <p className="text-muted-foreground col-span-full">No notes found for this project.</p>
                )}
            </div>
        </div>
    )
}
