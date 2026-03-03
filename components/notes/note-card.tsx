import { formatDistanceToNow } from 'date-fns'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { HoverEffect } from '@/components/ui/hover-effect'

interface NoteCardProps {
    note: {
        id: string
        title: string
        createdAt: Date
        updatedAt?: Date
    }
    onClick: () => void
}

export function NoteCard({ note, onClick }: NoteCardProps) {
    return (
        <HoverEffect variant="lift">
            <Card
                className="cursor-pointer hover:bg-card/60 hover:border-primary/30 transition-colors h-full flex flex-col justify-between"
                onClick={onClick}
            >
                <CardHeader className="p-4 pb-4">
                    <CardTitle className="text-sm leading-tight line-clamp-2 mb-2 font-medium pr-2">
                        {note.title || 'Untitled Note'}
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-widest opacity-60 font-medium mt-auto">
                        {!isNaN(new Date(note.updatedAt || note.createdAt).getTime())
                            ? formatDistanceToNow(new Date(note.updatedAt || note.createdAt), { addSuffix: true })
                            : 'Unknown Date'}
                    </CardDescription>
                </CardHeader>
            </Card>
        </HoverEffect>
    )
}
