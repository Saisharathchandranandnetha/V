'use client'

import { useState, useEffect, useOptimistic, useTransition } from 'react'
import { Plus, MoreVertical, Trash2, FolderInput, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { toast } from 'sonner'

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

type OptimisticAction =
    | { type: 'ADD'; payload: Note }
    | { type: 'UPDATE'; payload: Note }
    | { type: 'DELETE'; payload: string }

export function NotesLayout({ initialNotes }: NotesLayoutProps) {
    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Action States
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
    const [noteToMove, setNoteToMove] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()

    const [optimisticNotes, dispatchOptimistic] = useOptimistic(
        initialNotes,
        (state: Note[], action: OptimisticAction) => {
            switch (action.type) {
                case 'ADD':
                    return [action.payload, ...state]
                case 'UPDATE':
                    return state.map(n => n.id === action.payload.id ? action.payload : n).sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
                case 'DELETE':
                    return state.filter(n => n.id !== action.payload)
                default:
                    return state
            }
        }
    )

    const notes = optimisticNotes.filter(note =>
        (note.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (note.content?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )

    useEffect(() => {
        const noteId = searchParams.get('id')
        if (noteId) {
            const note = initialNotes.find(n => n.id === noteId)
            if (note) {
                setSelectedNote(note)
            }
        }
    }, [initialNotes, searchParams])

    // Auto-open new note editor if ?add=true is in URL
    useEffect(() => {
        if (searchParams.get('add') === 'true') {
            handleCreateNew()
            const params = new URLSearchParams(searchParams.toString())
            params.delete('add')
            router.replace(`?${params.toString()}`, { scroll: false })
        }
    }, [searchParams, router])

    const handleCreateNew = () => {
        setSelectedNote(null)
        setIsCreating(true)
    }

    const handleSelectNote = (note: Note) => {
        // If we select a note, we probably want to see the latest version from optimistic state
        const freshNote = optimisticNotes.find(n => n.id === note.id) || note
        setSelectedNote(freshNote)
        setIsCreating(false)
    }

    const confirmDelete = async () => {
        if (!noteToDelete) return
        setIsDeleting(true)

        // Optimistic Delete
        dispatchOptimistic({ type: 'DELETE', payload: noteToDelete })

        if (selectedNote?.id === noteToDelete) {
            setSelectedNote(null)
            setIsCreating(false)
        }

        const idToDelete = noteToDelete
        setNoteToDelete(null) // Close dialog immediately

        try {
            await deleteNote(idToDelete)
            toast.success("Note deleted")
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete note")
            // Revert would be nice here, but useOptimistic automatically reverts on next render if we don't refresh.
            // But we can't easily trigger a revert manually without server revalidation.
            router.refresh()
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCloseEditor = () => {
        setIsCreating(false)
        setSelectedNote(null)
        router.refresh()
    }

    const handleNoteSaved = (updatedNote: Partial<Note>) => {
        if (selectedNote && optimisticNotes.some(n => n.id === updatedNote.id)) {
            // Update
            const existing = optimisticNotes.find(n => n.id === updatedNote.id)
            const merged = existing ? { ...existing, ...updatedNote } as Note : { ...updatedNote } as Note

            dispatchOptimistic({ type: 'UPDATE', payload: merged })
            setSelectedNote(merged)
        } else {
            // Create
            const newNote = updatedNote as Note
            if (newNote.id && newNote.title) {
                dispatchOptimistic({ type: 'ADD', payload: newNote })
                setSelectedNote(newNote)
            }
        }
        router.refresh()
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

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background/50 backdrop-blur-sm focus-visible:ring-primary/50 transition-all text-foreground"
                    />
                </div>

                <StaggerContainer key={searchQuery} className="flex-1 overflow-y-auto space-y-3 pr-2" animate="show">
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
                            {searchQuery ? (
                                <>
                                    <p>No notes found matching "{searchQuery}"</p>
                                    <Button
                                        variant="link"
                                        onClick={() => setSearchQuery('')}
                                        className="mt-2"
                                    >
                                        Clear search
                                    </Button>
                                </>
                            ) : (
                                "No notes yet. Create one to get started!"
                            )}
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
