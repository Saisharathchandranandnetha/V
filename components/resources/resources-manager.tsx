'use client'

import { useOptimistic, useTransition } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResourceCard } from '@/components/resource-card'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { ResourceSearch } from '@/app/dashboard/resources/resource-search'
import { MagneticText } from '@/components/ui/magnetic-text'
import { AddResourceDialog } from '@/components/resources/add-resource-dialog'

interface Resource {
    id: string
    title: string
    type: string
    summary?: string
    tags?: string
    url?: string
    created_at: string
}

interface ResourcesManagerProps {
    initialResources: Resource[]
    searchQuery?: string
    categories: any[]
}

export function ResourcesManager({ initialResources, searchQuery, categories }: ResourcesManagerProps) {
    const [isPending, startTransition] = useTransition()
    const [optimisticResources, addOptimisticResource] = useOptimistic(
        initialResources,
        (state, newResource: Resource) => [newResource, ...state].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    )

    const filteredResources = optimisticResources.filter(r =>
        !searchQuery ||
        (r.title?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )

    const typedResources = filteredResources.map(r => ({
        ...r,
        date: r.created_at
    }))

    const linkResources = typedResources.filter(r => r.type === 'url' || r.type === 'youtube')
    const docResources = typedResources.filter(r => r.type === 'pdf')
    const modelResources = typedResources.filter(r => r.type === 'gltf' || r.type === 'spline')

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <MagneticText>
                        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
                    </MagneticText>
                    <p className="text-muted-foreground">Manage your learning materials.</p>
                </div>
                <AddResourceDialog
                    categories={categories}
                    onAdd={(newResource) => {
                        startTransition(() => {
                            addOptimisticResource(newResource)
                        })
                    }}
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <ResourceSearch />
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <div className="w-full overflow-x-auto pb-2">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="links">Links</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="3d">3D Models</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="all" className="space-y-4">
                    {typedResources.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-muted-foreground">
                            No resources found. Add one to get started!
                        </div>
                    ) : (
                        <StaggerContainer key={`all-${searchQuery}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {typedResources.map(r => (
                                <StaggerItem key={r.id} className="h-full">
                                    <ResourceCard resource={r as any} />
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    )}
                </TabsContent>
                <TabsContent value="links" className="space-y-4">
                    <StaggerContainer key={`links-${searchQuery}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {linkResources.map(r => (
                            <StaggerItem key={r.id} className="h-full">
                                <ResourceCard resource={r as any} />
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                    {linkResources.length === 0 && <div className="text-center text-muted-foreground p-8">No links found.</div>}
                </TabsContent>
                <TabsContent value="documents" className="space-y-4">
                    <StaggerContainer key={`docs-${searchQuery}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {docResources.map(r => (
                            <StaggerItem key={r.id} className="h-full">
                                <ResourceCard resource={r as any} />
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                    {docResources.length === 0 && <div className="text-center text-muted-foreground p-8">No documents found.</div>}
                </TabsContent>
                <TabsContent value="3d" className="space-y-4">
                    <StaggerContainer key={`3d-${searchQuery}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {modelResources.map(r => (
                            <StaggerItem key={r.id} className="h-full">
                                <ResourceCard resource={r as any} />
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                    {modelResources.length === 0 && <div className="text-center text-muted-foreground p-8">No 3D models found.</div>}
                </TabsContent>
            </Tabs>
        </div>
    )
}
