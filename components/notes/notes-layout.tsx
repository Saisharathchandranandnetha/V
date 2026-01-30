'use client'

import { useState, useEffect } from 'react'
import { Plus, MoreVertical, Trash2, FolderInput } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NoteCard } from './note-card'
import { NoteEditor } from './note-editor'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { deleteNote } from '@/app/dashboard/notes/actions'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { MoveToCollectionDialog } from '@/components/move-to-collection-dialog'

interface Note {
    id: string
    title: string
    content: string
    created_at: string
    updated_at?: string
}

interface NotesLayoutProps {
    initialNotes: Note[]
}

export function NotesLayout({ initialNotes }: NotesLayoutProps) {
    const [serverNotes, setServerNotes] = useState<Note[]>(initialNotes)
    const [localNotes, setLocalNotes] = useState<Note[]>([])

    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    // Action States
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
    const [noteToMove, setNoteToMove] = useState<string | null>(null)

    const router = useRouter()

    const searchParams = useSearchParams()

    // Merge notes
    const notes = [...localNotes, ...serverNotes.filter(sn => !localNotes.find(ln => ln.id === sn.id))]

    useEffect(() => {
        setServerNotes(initialNotes)
        if (initialNotes.length > 0) {
            setLocalNotes(prev => prev.filter(local => !initialNotes.find(server => server.id === local.id)))
        }

        const noteId = searchParams.get('id')
        if (noteId) {
            const note = initialNotes.find(n => n.id === noteId)
            if (note) {
                setSelectedNote(note)
            }
        }
    }, [initialNotes, searchParams])

    const handleCreateNew = () => {
        setSelectedNote(null)
        setIsCreating(true)
    }

    const handleSelectNote = (note: Note) => {
        setSelectedNote(note)
        setIsCreating(false)
    }

    const confirmDelete = async () => {
        if (!noteToDelete) return
        try {
            await deleteNote(noteToDelete)
            if (selectedNote?.id === noteToDelete) {
                setSelectedNote(null)
                setIsCreating(false)
            }
            setNoteToDelete(null)
        } catch (error) {
            console.error(error)
        }
    }

    const handleCloseEditor = () => {
        setIsCreating(false)
        setSelectedNote(null)
        router.refresh()
    }

    const handleNoteSaved = (updatedNote: Partial<Note>) => {
        // Update local state immediately for responsiveness
        if (selectedNote && notes.some(n => n.id === updatedNote.id)) {
            setLocalNotes(prev => {
                const filtered = prev.filter(n => n.id !== updatedNote.id)
                const existing = notes.find(n => n.id === updatedNote.id)
                const merged = existing ? { ...existing, ...updatedNote } as Note : { ...updatedNote } as Note
                return [merged, ...filtered]
            })
            // Also update the selected note so the editor reflects current state
            setSelectedNote(prev => prev ? { ...prev, ...updatedNote } as Note : null)
        } else {
            // New note - prepend to the list
            const newNote = updatedNote as Note
            if (newNote.id && newNote.title) {
                setLocalNotes(prev => [newNote, ...prev])
                setSelectedNote(newNote)
            }
            // Router refresh to ensure server sync
            router.refresh()
        }
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Notes List Sidebar */}
            <div className={cn(
                "w-full md:w-1/3 flex flex-col gap-4 border-r pr-6",
                (selectedNote || isCreating) ? "hidden md:flex" : "flex"
            )}>
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">My Notes</h2>
                    <Button onClick={handleCreateNew} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Note
                    </Button>
                </div>

                <StaggerContainer className="flex-1 overflow-y-auto space-y-3 pr-2" animate="show">
                    {notes.map((note) => (
                        <StaggerItem key={note.id} className="relative group w-full">
                            <NoteCard
                                note={note}
                                onClick={() => handleSelectNote(note)}
                            />
                            <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setNoteToMove(note.id)
                                            }}
                                        >
                                            <FolderInput className="mr-2 h-4 w-4" />
                                            Move to Collection
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setNoteToDelete(note.id)
                                            }}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </StaggerItem>
                    ))}
                    {notes.length === 0 && (
                        <div className="text-center text-muted-foreground py-10">
                            No notes yet. Create one to get started!
                        </div>
                    )}
                </StaggerContainer>
            </div>

            {/* Editor Area */}
            <div className={cn(
                "flex-1",
                (!selectedNote && !isCreating) ? "hidden md:block" : "block w-full"
            )}>
                {selectedNote || isCreating ? (
                    <NoteEditor
                        note={selectedNote || undefined}
                        onClose={handleCloseEditor}
                        onSave={handleNoteSaved}
                        key={selectedNote?.id || 'new'}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground bg-accent/10 rounded-lg border border-dashed">
                        <div className="text-center">
                            <p className="mb-2">Select a note to view or edit</p>
                            <Button variant="outline" onClick={handleCreateNew}>
                                Create New Note
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDeleteDialog
                open={!!noteToDelete}
                onOpenChange={(open) => !open && setNoteToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Note?"
                description="This will permanently delete this note."
            />

            <MoveToCollectionDialog
                itemId={noteToMove || ''}
                itemType="note"
                open={!!noteToMove}
                onOpenChange={(open) => !open && setNoteToMove(null)}
            />
        </div>
    )
}
