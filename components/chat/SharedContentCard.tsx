'use client'

import { Book, FileText, TrendingUp, GraduationCap, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { copyItemToAccount } from '@/app/dashboard/chat/shared-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SharedContentCard({ attachment }: { attachment: { type: string, item: any } }) {
    const { type, item } = attachment
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    let icon = <FileText className="h-4 w-4" />
    let color = "bg-blue-500/10 text-blue-500"

    // Default href for original context (if viewed without clicking?)
    // Actually, we want override the click.

    switch (type) {
        case 'resource':
            icon = <Book className="h-4 w-4" />
            color = "bg-purple-500/10 text-purple-500"
            break
        case 'note':
            icon = <FileText className="h-4 w-4" />
            color = "bg-yellow-500/10 text-yellow-500"
            break
        case 'learning_path':
            icon = <GraduationCap className="h-4 w-4" />
            color = "bg-green-500/10 text-green-500"
            break
        case 'finance':
            icon = <TrendingUp className="h-4 w-4" />
            color = "bg-emerald-500/10 text-emerald-500"
            break
    }

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (type === 'finance') {
            router.push('/dashboard/finances')
            return
        }

        setIsLoading(true)
        const toastId = toast.loading('Opening shared item...')

        try {
            const result = await copyItemToAccount(item.id, type)

            if (result.success && result.newId) {
                if (result.isNew) {
                    toast.success('Added to your account!', { id: toastId })
                } else {
                    toast.success('Opening item...', { id: toastId })
                }

                // Redirect to the item page
                if (type === 'resource') {
                    // Resources list or specific? Resources usually list.
                    // But if we have an ID, maybe we filter? Or just go to list.
                    // Wait, resource usually doesn't have a detail page in this app? 
                    // Let's check routes... /dashboard/resources is list.
                    // If it's a URL resource, maybe open it?
                    // Assuming list for now.
                    router.push('/dashboard/resources')
                } else if (type === 'note') {
                    // Notes page doesn't have [id] route, likely a modal or list view
                    router.push(`/dashboard/notes`)
                } else if (type === 'learning_path') {
                    router.push(`/dashboard/paths/${result.newId}/edit`)
                }
            }
        } catch (error) {
            console.error('Failed to open shared item:', error)
            toast.error('Failed to open item', { id: toastId })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div
            onClick={handleClick}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50 hover:bg-muted/50 transition-colors w-64 group/card cursor-pointer"
        >
            <div className={`p-2 rounded-lg ${color}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground capitalize mb-0.5">{type.replace('_', ' ')}</div>
                <div className="text-sm font-medium truncate">{item.title || item.name}</div>
            </div>
            {isLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            ) : (
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/card:opacity-100 transition-opacity" />
            )}
        </div>
    )
}
