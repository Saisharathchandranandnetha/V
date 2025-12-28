import { formatDistanceToNow } from 'date-fns'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface NoteCardProps {
    note: {
        id: string
        title: string
        created_at: string
    }
    onClick: () => void
}

export function NoteCard({ note, onClick }: NoteCardProps) {
    return (
        <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={onClick}
        >
            <CardHeader>
                <CardTitle className="text-lg truncate">{note.title}</CardTitle>
                <CardDescription>
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                </CardDescription>
            </CardHeader>
        </Card>
    )
}
