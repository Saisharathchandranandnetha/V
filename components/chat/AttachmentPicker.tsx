'use client'

import { useState } from 'react'
import { Paperclip, Book, FileText, TrendingUp, GraduationCap, X, Map as MapIcon } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

type AttachmentType = 'resource' | 'note' | 'finance' | 'learning_path' | 'roadmap'

interface AttachmentPickerProps {
    onSelect: (type: AttachmentType, item: any) => void
    projectId?: string
}

export function AttachmentPicker({ onSelect, projectId }: AttachmentPickerProps) {
    const [open, setOpen] = useState(false)
    const [pickerType, setPickerType] = useState<AttachmentType | null>(null)
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const handleTypeSelect = async (type: AttachmentType) => {
        if (type === 'finance') {
            if (projectId) {
                onSelect('finance', { id: projectId, title: 'Project Finance Overview' })
                setOpen(false)
                return
            }
            setPickerType('finance')
            await fetchItems('finance')
        } else {
            setPickerType(type)
            await fetchItems(type)
        }
    }

    const fetchItems = async (type: AttachmentType) => {
        setLoading(true)
        const supabase = createClient()
        let data: any[] = []

        try {
            if (type === 'resource') {
                const { data: resources } = await supabase.from('resources').select('id, title, project_id').limit(20)
                data = resources || []
            } else if (type === 'note') {
                const { data: notes } = await supabase.from('notes').select('id, title, project_id').limit(20)
                data = notes || []
            } else if (type === 'learning_path') {
                const { data: paths } = await supabase.from('learning_paths').select('id, title, project_id').limit(20)
                data = paths || []
            } else if (type === 'finance') {
                const { data: projects } = await supabase.from('projects').select('id, name')
                data = projects?.map(p => ({ id: p.id, title: p.name, project_id: p.id })) || []
            } else if (type === 'roadmap') {
                const { data: roadmaps } = await supabase.from('roadmaps').select('id, title, project_id').limit(20)
                data = roadmaps || []
            }
        } catch (error) {
            console.error('Failed to fetch items', error)
        } finally {
            setItems(data)
            setLoading(false)
        }
    }

    const handleItemSelect = (item: any) => {
        onSelect(pickerType!, item)
        setOpen(false)
        setPickerType(null)
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                    <div className="grid grid-cols-1 gap-1">
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => handleTypeSelect('resource')}>
                            <Book className="mr-2 h-4 w-4" />
                            Share Resource
                        </Button>
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => handleTypeSelect('note')}>
                            <FileText className="mr-2 h-4 w-4" />
                            Share Note
                        </Button>
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => handleTypeSelect('learning_path')}>
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Share Learning Path
                        </Button>
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => handleTypeSelect('finance')}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Share Finance
                        </Button>
                        <Button variant="ghost" className="justify-start font-normal" onClick={() => handleTypeSelect('roadmap')}>
                            <MapIcon className="mr-2 h-4 w-4" />
                            Share Roadmap
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            <Dialog open={!!pickerType} onOpenChange={(val) => !val && setPickerType(null)}>
                <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-4 pb-2 border-b">
                        <DialogTitle>
                            Select {pickerType === 'resource' ? 'Resource' :
                                pickerType === 'note' ? 'Note' :
                                    pickerType === 'learning_path' ? 'Learning Path' :
                                        pickerType === 'roadmap' ? 'Roadmap' : 'Project'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Search..."
                            className="border-none shadow-none focus-visible:ring-0"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {items.length === 0 && !loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No results found.
                            </div>
                        )}
                        {loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Loading...
                            </div>
                        )}
                        <div className="grid gap-1">
                            {items.map((item) => (
                                <button
                                    key={item.id}
                                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer text-left"
                                    onClick={() => handleItemSelect(item)}
                                >
                                    {pickerType === 'resource' && <Book className="mr-2 h-4 w-4 opacity-50" />}
                                    {pickerType === 'note' && <FileText className="mr-2 h-4 w-4 opacity-50" />}
                                    {pickerType === 'learning_path' && <GraduationCap className="mr-2 h-4 w-4 opacity-50" />}
                                    {pickerType === 'finance' && <TrendingUp className="mr-2 h-4 w-4 opacity-50" />}
                                    {pickerType === 'roadmap' && <MapIcon className="mr-2 h-4 w-4 opacity-50" />}
                                    {item.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
