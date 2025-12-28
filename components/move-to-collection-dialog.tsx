import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { moveItemToCollection, createCollectionAndReturn } from '@/app/dashboard/actions'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'

interface MoveToCollectionDialogProps {
    itemId: string
    itemType: string
    open: boolean
    onOpenChange: (open: boolean) => void
    currentCollectionId?: string
}

interface Collection {
    id: string
    name: string
}

export function MoveToCollectionDialog({ itemId, itemType, open, onOpenChange, currentCollectionId }: MoveToCollectionDialogProps) {
    const [collections, setCollections] = useState<Collection[]>([])
    const [selectedCollection, setSelectedCollection] = useState<string>(currentCollectionId || 'none')
    const [loading, setLoading] = useState(false)

    // Creation State
    const [isCreating, setIsCreating] = useState(false)
    const [newCollectionName, setNewCollectionName] = useState('')
    const [isCreatingLoading, setIsCreatingLoading] = useState(false)

    useEffect(() => {
        if (open) {
            const fetchCollections = async () => {
                const supabase = createClient()
                const { data } = await supabase.from('collections').select('id, name').order('name')
                if (data) setCollections(data)
            }
            fetchCollections()
            setIsCreating(false)
            setNewCollectionName('')
        }
    }, [open])

    const handleSave = async () => {
        setLoading(true)
        try {
            await moveItemToCollection(itemId, itemType, selectedCollection)
            onOpenChange(false)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return
        setIsCreatingLoading(true)
        try {
            const newCollection = await createCollectionAndReturn(newCollectionName)
            if (newCollection) {
                setCollections(prev => [...prev, newCollection].sort((a, b) => a.name.localeCompare(b.name)))
                setSelectedCollection(newCollection.id)
                setIsCreating(false)
                setNewCollectionName('')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsCreatingLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Move to Collection</DialogTitle>
                    <DialogDescription>
                        Choose a collection to move this item to.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Collection</Label>
                        {!isCreating ? (
                            <div className="flex gap-2">
                                <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a collection" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Collection (Remove)</SelectItem>
                                        {collections.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button size="icon" variant="outline" onClick={() => setIsCreating(true)} title="Create New Collection">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2 items-center">
                                <Input
                                    placeholder="New collection name"
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    autoFocus
                                />
                                <Button onClick={handleCreateCollection} disabled={isCreatingLoading || !newCollectionName.trim()}>
                                    {isCreatingLoading ? '...' : 'Add'}
                                </Button>
                                <Button variant="ghost" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading || isCreating}>
                        {loading ? 'Moving...' : 'Move'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
