'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Smile, Paperclip, CheckSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { sendMessage, createTaskDirectly } from '@/app/dashboard/chat/actions'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ChatInputProps {
    teamId: string
    projectId?: string
    members?: any[]
}

export function ChatInput({ teamId, projectId, members = [] }: ChatInputProps) {
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Task Mode State
    const [isTaskMode, setIsTaskMode] = useState(false)
    const [assignedTo, setAssignedTo] = useState<string>('')

    const handleSend = async () => {
        if (!message.trim() || isSending) return

        setIsSending(true)
        try {
            if (isTaskMode) {
                // Create Task
                const formData = new FormData()
                formData.append('title', message)
                formData.append('teamId', teamId)
                if (projectId) formData.append('projectId', projectId)
                if (assignedTo) formData.append('assignedTo', assignedTo)

                await createTaskDirectly(formData)
                toast.success('Task created successfully')
                setIsTaskMode(false)
                setAssignedTo('')
            } else {
                // Send Message
                const formData = new FormData()
                formData.append('message', message)
                formData.append('teamId', teamId)
                if (projectId) formData.append('projectId', projectId)

                await sendMessage(formData)
            }

            setMessage('')

            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        } catch (error) {
            console.error('Failed to send:', error)
            toast.error(isTaskMode ? 'Failed to create task' : 'Failed to send message')
        } finally {
            setIsSending(false)
            // Focus back
            textareaRef.current?.focus()
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`
    }

    return (
        <div className="p-4 border-t border-border bg-card/10 backdrop-blur-sm">
            {isTaskMode && (
                <div className="flex items-center gap-2 mb-2 animate-in slide-in-from-bottom-2 fade-in">
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        New Task
                    </div>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                        <SelectTrigger className="h-7 w-[180px] text-xs">
                            <SelectValue placeholder="Assign to (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            {members.map(member => (
                                <SelectItem key={member.id} value={member.id}>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        {member.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setIsTaskMode(false)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            <div className={`relative flex items-end gap-2 bg-card border rounded-xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all ${isTaskMode ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'}`}>
                <Button
                    variant={isTaskMode ? "default" : "ghost"}
                    size="icon"
                    className={`h-9 w-9 shrink-0 rounded-full ${isTaskMode ? '' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setIsTaskMode(!isTaskMode)}
                    title="Create Task"
                >
                    <CheckSquare className="h-5 w-5" />
                </Button>

                <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={isTaskMode ? "What needs to be done?" : "Type a message..."}
                    className="min-h-[2.5rem] max-h-[150px] w-full resize-none border-0 bg-transparent p-2 focus-visible:ring-0 shadow-none px-0 py-1.5"
                    rows={1}
                />

                <div className="flex items-center gap-1 shrink-0 pb-1">
                    {!isTaskMode && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full">
                            <Smile className="h-5 w-5" />
                        </Button>
                    )}
                    <Button
                        onClick={handleSend}
                        disabled={!message.trim() || isSending}
                        size="icon"
                        className="h-8 w-8 rounded-full"
                    >
                        {isTaskMode ? <CheckSquare className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
