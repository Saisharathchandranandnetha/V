
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createLearningPath } from '@/app/dashboard/actions'

export default function NewLearningPathPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Link href="/dashboard/paths">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Add Learning Path</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Path Details</CardTitle>
                    <CardDescription>Create a structured learning path with external resources.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form action={createLearningPath} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" placeholder="e.g. Mastering Next.js" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="What will be covered in this path?" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="links">Resource Links (One per line)</Label>
                            <Textarea
                                id="links"
                                name="links"
                                placeholder="https://example.com/part-1&#10;https://example.com/part-2"
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
                            <Button type="submit">Create Path</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
