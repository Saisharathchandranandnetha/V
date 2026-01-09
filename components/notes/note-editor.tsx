'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createNote, updateNote } from '@/app/dashboard/notes/actions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NoteEditorProps {
    note?: {
        id: string
        title: string
        content: string
    }
    onClose?: () => void
    onSave?: (note: { id: string, title: string, content: string }) => void
}

export function NoteEditor({ note, onClose, onSave }: NoteEditorProps) {
    const [title, setTitle] = useState(note?.title || '')
    const [content, setContent] = useState(note?.content || '')
    const [isPreview, setIsPreview] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        setIsSaving(true)
        const formData = new FormData()
        formData.append('title', title)
        formData.append('content', content)

        let result
        if (note?.id) {
            formData.append('id', note.id)
            result = await updateNote(formData)
        } else {
            result = await createNote(formData)
        }

        setIsSaving(false)

        if (result?.error) {
            alert(`Error saving note: ${result.error}`)
            return
        }

        if (onSave) {
            // Optimistic update / Notify parent
            onSave({
                id: note?.id || (result as any).id, // We might need the ID from create result if it returns it. 
                // Actually actions.createNote doesn't return ID currently.
                // For now, if it's a new note, we might rely on refresh. 
                // But let's pass what we have.
                title,
                content
            })
            router.refresh()
        } else {
            if (onClose) {
                onClose()
            } else {
                router.refresh()
            }
        }
    }

    return (
        <div className="flex flex-col h-full gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full md:flex-1">
                    <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Input
                        placeholder="Note Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="font-bold text-lg flex-1"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsPreview(!isPreview)}
                    >
                        {isPreview ? 'Edit' : 'Preview'}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 min-h-[500px] border rounded-md overflow-hidden relative">
                {isPreview ? (
                    <div className="h-full w-full p-4 overflow-auto prose prose-invert max-w-none bg-zinc-950">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !inline && match ? (
                                        <SyntaxHighlighter
                                            {...props}
                                            style={atomDark}
                                            language={match[1]}
                                            PreTag="div"
                                        >
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                    ) : (
                                        <code {...props} className={className}>
                                            {children}
                                        </code>
                                    )
                                }
                            }}
                        >
                            {content || '*No content*'}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <Textarea
                        placeholder="Write your note here... (Markdown supported)"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-full p-4 resize-none border-0 focus-visible:ring-0 font-mono"
                    />
                )}
            </div>
        </div>
    )
}
