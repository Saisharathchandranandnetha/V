import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateResource } from '@/app/dashboard/actions'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: resource, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single()

    // Fetch collections for dropdown
    const { data: collections } = await supabase
        .from('collections')
        .select('*')
        .order('name', { ascending: true })

    if (error || !resource) {
        notFound()
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Link href="/dashboard/resources">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Edit Resource</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Details</CardTitle>
                    <CardDescription>Update the information for this resource.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form action={updateResource.bind(null, resource.id)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input id="url" name="url" defaultValue={resource.url} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" defaultValue={resource.title} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select name="type" defaultValue={resource.type}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="url">Web Link</SelectItem>
                                        <SelectItem value="pdf">PDF Document</SelectItem>
                                        <SelectItem value="youtube">YouTube Video</SelectItem>
                                        <SelectItem value="gltf">3D Model (GLTF)</SelectItem>
                                        <SelectItem value="spline">Spline Scene</SelectItem>
                                        <SelectItem value="image">Image</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="collection">Category (Optional)</Label>
                                <Select name="collection_id" defaultValue={resource.collection_id || "none"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {collections?.map((collection: any) => (
                                            <SelectItem key={collection.id} value={collection.id}>
                                                {collection.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags</Label>
                            <Input id="tags" name="tags" defaultValue={resource.tags?.join(', ')} placeholder="react, design, ai (comma separated)" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="summary">Summary (Optional)</Label>
                            <Textarea id="summary" name="summary" defaultValue={resource.summary || ''} placeholder="Brief description of the resource..." />
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/dashboard/resources">Cancel</Link>
                            </Button>
                            <Button type="submit">Update Resource</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
