import { getNotes } from './actions'
import { NotesLayout } from '@/components/notes/notes-layout'

export default async function NotesPage() {
    const notes = await getNotes()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
                <p className="text-muted-foreground">
                    Capture your thoughts, code snippets, and ideas.
                </p>
            </div>

            <NotesLayout initialNotes={notes} />
        </div>
    )
}
