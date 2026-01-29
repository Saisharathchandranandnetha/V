'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { MoreHorizontal, SquareCheckBig, Check, CheckCheck, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createTaskFromMessage, deleteMessage } from '@/app/dashboard/chat/actions'
import { toast } from 'sonner'
import { SharedContentCard } from './SharedContentCard'
import { CreateTaskDialog } from './CreateTaskDialog'

export interface Message {
    id: string
    team_id: string
    project_id: string | null
    sender_id: string
    message: string
    created_at: string
    sender?: {
        name: string
        avatar: string
        email: string
    }
    is_sender?: boolean
    read_status?: 'sent' | 'delivered' | 'read'
    metadata?: any
    message_reads?: { user_id: string }[]
}

interface MessageItemProps {
    message: Message
    isConsecutive?: boolean
    teamId: string
    projectId?: string
    onDelete?: (id: string) => void
    members?: any[]
}

// Helper to render mentions
const renderMessageWithMentions = (text: string, mentions: string[] | undefined, isSender: boolean) => {
    if (!text) return null
    if (!mentions || mentions.length === 0) return text

    // Split by spaces or special chars to find potential mentions
    // Simpler: Regex for @Word
    const parts = text.split(/(@\w+(?:\s+\w+)?)/g) // Split keeping delimiters

    return parts.map((part, i) => {
        if (part.startsWith('@')) {
            return (
                <span
                    key={i}
                    className={cn(
                        "font-bold px-1 rounded-sm",
                        isSender
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-primary/10 text-primary"
                    )}
                >
                    {part}
                </span>
            )
        }
        return part
    })
}

export function MessageItem({ message, isConsecutive, teamId, projectId, onDelete, members = [] }: MessageItemProps) {
    const isSender = message.is_sender
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)

    // Format time
    const time = format(new Date(message.created_at), 'p')

    const handleCreateTask = () => {
        setIsCreateTaskOpen(true)
    }

    const handleDelete = async () => {
        try {
            // Optimistic update
            onDelete?.(message.id)
            await deleteMessage(message.id, teamId)
            toast.success("Message deleted")
        } catch (e) {
            console.error("Failed to delete message", e)
            toast.error("Failed to delete message")
        }
    }

    return (
        <div className={cn("flex w-full group mb-1", isSender ? "justify-end" : "justify-start")}>
            <div className={cn("flex max-w-[70%] gap-2", isSender ? "flex-row-reverse" : "flex-row")}>
                {/* Avatar - only show if not consecutive and not sender (or if we want sender avatar too) */}
                {!isSender && !isConsecutive && (
                    <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={message.sender?.avatar || ''} />
                        <AvatarFallback>{message.sender?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                )}
                {!isSender && isConsecutive && <div className="w-8" />}

                <div className={cn("flex flex-col", isSender ? "items-end" : "items-start")}>
                    {/* Sender Name - only if not consecutive and not me */}
                    {!isSender && !isConsecutive && (
                        <span className="text-xs text-muted-foreground ml-1 mb-1">
                            {message.sender?.name}
                        </span>
                    )}

                    <div className="relative group/msg">
                        <div
                            className={cn(
                                "px-4 py-2 rounded-2xl text-sm shadow-sm relative",
                                isSender
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-card border border-border text-card-foreground rounded-tl-sm"
                            )}
                        >
                            {renderMessageWithMentions(message.message, message.metadata?.mentions, isSender || false)}
                        </div>

                        {/* Actions Overlay */}
                        <div className={cn(
                            "absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1",
                            isSender ? "-left-14" : "-right-14"
                        )}>
                            {/* Add Task Quick Action */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full bg-background border border-border shadow-sm"
                                title="Create Task"
                                onClick={handleCreateTask}
                            >
                                <SquareCheckBig className="h-3 w-3" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-background border border-border shadow-sm">
                                        <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isSender ? 'end' : 'start'}>
                                    <DropdownMenuItem onClick={handleCreateTask}>
                                        <SquareCheckBig className="mr-2 h-4 w-4" />
                                        Create Task
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {isSender && (
                                        <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                                            Delete Message
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Shared Content Card */}
                    {message.metadata && (
                        <div className="mt-2 mb-1 flex flex-wrap gap-2">
                            {/* New Array Format */}
                            {(message.metadata as any).attachments?.map((att: any, i: number) => (
                                <SharedContentCard key={i} attachment={att} />
                            ))}

                            {/* Legacy Single Format */}
                            {!(message.metadata as any).attachments && (message.metadata as any).attachment && (
                                <SharedContentCard attachment={(message.metadata as any).attachment} />
                            )}
                        </div>
                    )}

                    {/* Metadata (Time + Read Receipt) */}
                    <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[10px] text-muted-foreground">
                            {time}
                        </span>
                        {isSender && (
                            <span className="text-muted-foreground">
                                {message.read_status === 'read' ? (
                                    <CheckCheck className="h-3 w-3 text-blue-500" />
                                ) : message.read_status === 'delivered' ? (
                                    <CheckCheck className="h-3 w-3" />
                                ) : (
                                    <Check className="h-3 w-3" />
                                )}
                            </span>
                        )}
                    </div>
                </div>

            </div>
            <CreateTaskDialog
                open={isCreateTaskOpen}
                onOpenChange={setIsCreateTaskOpen}
                messageId={message.id}
                initialTitle={message.message.substring(0, 50) + (message.message.length > 50 ? '...' : '')}
                teamId={teamId}
                projectId={projectId}
                members={members}
            />
        </div >
    )
}
