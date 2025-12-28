
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ResourceCard, ResourceType } from '@/components/resource-card'
import { createClient } from '@/lib/supabase/server'

export default async function ResourcesPage() {
    const supabase = await createClient()
    const { data: resources } = await supabase.from('resources').select('*').order('created_at', { ascending: false })

    const typedResources = (resources || []).map(r => ({
        ...r,
        date: r.created_at
    }))

    const linkResources = typedResources.filter(r => r.type === 'url' || r.type === 'youtube')
    const docResources = typedResources.filter(r => r.type === 'pdf')
    const modelResources = typedResources.filter(r => r.type === 'gltf' || r.type === 'spline')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
                    <p className="text-muted-foreground">Manage your learning materials.</p>
                </div>
                <Link href="/dashboard/resources/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Resource
                    </Button>
                </Link>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="links">Links</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="3d">3D Models</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-4">
                    {typedResources.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-muted-foreground">
                            No resources found. Add one to get started!
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {typedResources.map(r => (
                                <ResourceCard key={r.id} resource={r as any} />
                            ))}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="links" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {linkResources.map(r => (
                            <ResourceCard key={r.id} resource={r as any} />
                        ))}
                    </div>
                    {linkResources.length === 0 && <div className="text-center text-muted-foreground p-8">No links found.</div>}
                </TabsContent>
                <TabsContent value="documents" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {docResources.map(r => (
                            <ResourceCard key={r.id} resource={r as any} />
                        ))}
                    </div>
                    {docResources.length === 0 && <div className="text-center text-muted-foreground p-8">No documents found.</div>}
                </TabsContent>
                <TabsContent value="3d" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {modelResources.map(r => (
                            <ResourceCard key={r.id} resource={r as any} />
                        ))}
                    </div>
                    {modelResources.length === 0 && <div className="text-center text-muted-foreground p-8">No 3D models found.</div>}
                </TabsContent>
            </Tabs>
        </div>
    )
}
