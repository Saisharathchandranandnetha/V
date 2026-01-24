import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createProject, getTeamMembers } from '@/app/dashboard/teams/actions'
import { Plus, Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface CreateProjectDialogProps {
    teamId: string
}

export function CreateProjectDialog({ teamId }: CreateProjectDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [isLoading, setIsLoading] = useState(false) // For creating
    const [isMembersLoading, setIsMembersLoading] = useState(false) // For fetching details
    const [members, setMembers] = useState<any[]>([])
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const router = useRouter()

    useEffect(() => {
        if (open) {
            setIsMembersLoading(true)
            getTeamMembers(teamId)
                .then(data => setMembers(data))
                .catch(err => console.error("Failed to load members", err))
                .finally(() => setIsMembersLoading(false))
        } else {
            // Reset
            setName('')
            setSelectedMembers([])
        }
    }, [open, teamId])

    const toggleMember = (userId: string) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', name)
            formData.append('teamId', teamId)
            formData.append('members', JSON.stringify(selectedMembers))

            await createProject(formData)
            setOpen(false)
            router.refresh()
        } catch (error) {
            console.error('Failed to create project:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start pl-2 text-xs text-muted-foreground h-7 hover:text-foreground">
                    <Plus className="h-3 w-3 mr-2" />
                    Add Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                    <DialogDescription>
                        Create a private space for your project context.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Project Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Marketing Campaign"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Add Members</Label>
                            <div className="border rounded-md p-2">
                                <ScrollArea className="h-[200px]">
                                    {isMembersLoading ? (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading members...</div>
                                    ) : members.length === 0 ? (
                                        <div className="text-center text-sm text-muted-foreground py-2">No other members in team.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {members.map(member => (
                                                <div key={member.id} className="flex items-center space-x-2 rounded-lg border p-2 bg-card hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => toggleMember(member.id)}>
                                                    <Checkbox
                                                        id={`member-${member.id}`}
                                                        checked={selectedMembers.includes(member.id)}
                                                        onCheckedChange={() => toggleMember(member.id)}
                                                    />
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={member.avatar} />
                                                            <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="grid gap-0.5 leading-none">
                                                            <label
                                                                htmlFor={`member-${member.id}`}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                            >
                                                                {member.name || member.email}
                                                            </label>
                                                            {member.isCreator && <span className="text-[10px] text-muted-foreground">Team Owner</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Only selected members will see this project. You are automatically added.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
