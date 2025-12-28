
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { updateLearningPath } from '@/app/dashboard/actions'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function EditLearningPathPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params
    const { data: path } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', id)
        .single()

    if (!path) {
        notFound()
    }

    const updatePathWithId = updateLearningPath.bind(null, path.id)

    // Convert links array to string
    const linksValue = Array.isArray(path.links) ? path.links.join('\n') : path.links

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Link href="/dashboard/paths">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Edit Learning Path</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Path Details</CardTitle>
                    <CardDescription>Update your learning path and resources.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form action={updatePathWithId} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" defaultValue={path.title} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" defaultValue={path.description} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="links">Resource Links (One per line)</Label>
                            <Textarea
                                id="links"
                                name="links"
                                defaultValue={linksValue}
                                className="min-h-[150px] font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Add URLs separated by newlines or commas.
                            </p>
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/dashboard/paths">Cancel</Link>
                            </Button>
                            <Button type="submit">Update Path</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
