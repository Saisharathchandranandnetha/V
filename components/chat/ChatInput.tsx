'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Smile, Paperclip, CheckSquare, X, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { sendMessage, createTaskDirectly } from '@/app/dashboard/chat/actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { AttachmentPicker } from './AttachmentPicker'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'

interface ChatInputProps {
    teamId: string
    projectId?: string
    members?: any[]
    onSendMessage?: (formData: FormData) => Promise<void>
    onTyping?: () => void
}

export function ChatInput({ teamId, projectId, members = [], onSendMessage, onTyping }: ChatInputProps) {
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Task Mode State
    const [isTaskMode, setIsTaskMode] = useState(false)
    const [assignedTo, setAssignedTo] = useState<string>('')
    const [priority, setPriority] = useState<string>('Medium')
    const [dueDate, setDueDate] = useState<Date>()

    // Mention State
    const [mentionQuery, setMentionQuery] = useState<string | null>(null)
    const [mentionIndex, setMentionIndex] = useState<number>(-1)
    const [mentionedUserIds, setMentionedUserIds] = useState<Set<string>>(new Set())
    const [activeMemberIndex, setActiveMemberIndex] = useState(0)


    const handleSend = async () => {
        if ((!message.trim() && attachments.length === 0) || isSending) return

        setIsSending(true)
        try {
            if (isTaskMode) {
                // Create Task
                const formData = new FormData()
                formData.append('title', message)
                formData.append('teamId', teamId)
                if (projectId) formData.append('projectId', projectId)
                if (assignedTo) formData.append('assignedTo', assignedTo)
                if (dueDate) formData.append('dueDate', dueDate.toISOString())
                formData.append('priority', priority)

                await createTaskDirectly(formData)
                toast.success('Task created successfully')
                setIsTaskMode(false)
                setAssignedTo('')
                setPriority('Medium')
                setDueDate(undefined)
            } else {
                // Send Message
                const formData = new FormData()
                formData.append('message', message)
                formData.append('teamId', teamId)
                if (projectId) formData.append('projectId', projectId)

                const meta: any = {}
                if (attachments.length > 0) meta.attachments = attachments
                if (mentionedUserIds.size > 0) meta.mentions = Array.from(mentionedUserIds)

                if (Object.keys(meta).length > 0) {
                    formData.append('metadata', JSON.stringify(meta))
                }

                if (onSendMessage) {
                    await onSendMessage(formData)
                } else {
                    await sendMessage(formData)
                }
            }

            setMessage('')
            setAttachments([])
            setMentionedUserIds(new Set())

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
        if (mentionQuery !== null) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveMemberIndex(prev => (prev + 1) % filteredMembers.length)
                return
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveMemberIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length)
                return
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                if (filteredMembers[activeMemberIndex]) {
                    selectMember(filteredMembers[activeMemberIndex])
                }
                return
            }
            if (e.key === 'Escape') {
                setMentionQuery(null)
                return
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const lastTypingTimeRef = useRef(0)

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setMessage(val)
        e.target.style.height = 'auto'
        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`

        // Mention Detection
        const selectionStart = e.target.selectionStart
        const textBeforeCursor = val.slice(0, selectionStart)
        const lastAt = textBeforeCursor.lastIndexOf('@')

        if (lastAt !== -1) {
            const query = textBeforeCursor.slice(lastAt + 1)
            // Ensure no spaces (simple mention) - or allow spaces if we want "@John Doe"
            // Let's stick to simple first: standard is usually name without spaces OR spaces allowed if we check bounds.
            // Usually we stop at space if we support complex like Slack, but simplistic is fine.
            // Actually, names have spaces. So we should allow spaces IF it looks like a name start.
            // But typically we simply check if there's a newline or specific chars breaking it.
            // Let's simplify: Only trigger if there is no space so far OR allow spaces.
            // Standard: Check if we are "in" a mention.
            // If query contains newline, abort.
            if (!query.includes('\n')) {
                setMentionQuery(query)
                setMentionIndex(lastAt)
                setActiveMemberIndex(0)
            } else {
                setMentionQuery(null)
            }
        } else {
            setMentionQuery(null)
        }


        // Throttle typing event
        const now = Date.now()
        if (onTyping && now - lastTypingTimeRef.current > 2000) {
            onTyping()
            lastTypingTimeRef.current = now
        }
    }

    const filteredMembers = mentionQuery !== null
        ? members.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
        : []

    const selectMember = (member: any) => {
        const before = message.slice(0, mentionIndex)
        const after = message.slice(mentionIndex + (mentionQuery?.length || 0) + 1)
        const newText = `${before}@${member.name} ${after}`
        setMessage(newText)
        setMentionedUserIds(prev => new Set(prev).add(member.id))
        setMentionQuery(null)
        // Focus and set cursor? Hard with React controlled input sometimes.
        // We let user continue typing at end of name.
    }

    const [attachments, setAttachments] = useState<{ type: string, item: any }[]>([])

    const addAttachment = (type: string, item: any) => {
        // Prevent duplicates
        if (attachments.some(a => a.item.id === item.id && a.type === type)) return
        setAttachments([...attachments, { type, item }])
    }

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index))
    }

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setMessage(prev => prev + emojiData.emoji)
    }

    return (
        <div className="p-4 border-t border-border bg-card/10 backdrop-blur-sm relative">
            {/* Mention Popup */}
            {mentionQuery !== null && filteredMembers.length > 0 && (
                <div className="absolute bottom-full left-4 mb-2 w-64 bg-popover border rounded-lg shadow-lg overflow-hidden z-50 animate-in slide-in-from-bottom-2">
                    <div className="p-1">
                        {filteredMembers.map((member, i) => (
                            <button
                                key={member.id}
                                className={cn(
                                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors",
                                    i === activeMemberIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                                )}
                                onClick={() => selectMember(member)}
                            >
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span>{member.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg max-w-fit animate-in slide-in-from-bottom-2 fade-in relative group">
                            <div className="text-xs font-medium flex items-center gap-1.5">
                                <span className="capitalize text-muted-foreground">{att.type.replace('_', ' ')}:</span>
                                <span className="text-foreground">{att.item.title || att.item.name}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 rounded-full ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeAttachment(i)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {isTaskMode && (
                <div className="flex items-center gap-2 mb-2 animate-in slide-in-from-bottom-2 fade-in">
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        New Task
                    </div>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                        <SelectTrigger className="h-7 w-[150px] text-xs">
                            <SelectValue placeholder="Assign to" />
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

                    <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="h-7 w-[100px] text-xs">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-7 border-dashed gap-1 text-xs font-normal",
                                    !dueDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="h-3 w-3" />
                                {dueDate ? format(dueDate, "MMM d") : "Due"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dueDate}
                                onSelect={setDueDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

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
                <div className="flex flex-col gap-1 items-center pb-1">
                    <Button
                        variant={isTaskMode ? "default" : "ghost"}
                        size="icon"
                        className={`h-9 w-9 shrink-0 rounded-full ${isTaskMode ? '' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setIsTaskMode(!isTaskMode)}
                        title="Create Task"
                    >
                        <CheckSquare className="h-5 w-5" />
                    </Button>
                    {!isTaskMode && (
                        <AttachmentPicker projectId={projectId} onSelect={addAttachment} />
                    )}
                </div>

                <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={isTaskMode ? "What needs to be done?" : attachments.length > 0 ? "Add a message..." : "Type a message..."}
                    className="min-h-[2.5rem] max-h-[150px] w-full resize-none border-0 bg-transparent p-2 focus-visible:ring-0 shadow-none px-0 py-1.5"
                    rows={1}
                />

                <div className="flex items-center gap-1 shrink-0 pb-1">
                    {!isTaskMode && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full">
                                    <Smile className="h-5 w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent side="top" align="end" className="w-full p-0 border-none bg-transparent shadow-none">
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={Theme.AUTO}
                                    width={350}
                                    height={400}
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                    <Button
                        onClick={handleSend}
                        disabled={(!message.trim() && attachments.length === 0) || isSending}
                        size="icon"
                        className="h-8 w-8 rounded-full"
                    >
                        {isTaskMode ? <CheckSquare className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div >
    )
}
