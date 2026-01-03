import { createClient } from '@/lib/supabase/server'
import { ResourceCard, ResourceProps } from '@/components/resource-card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default async function CategoryDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: category } = await supabase
        .from('categories')
        .select('name')
        .eq('id', id)
        .single()

    const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('category_id', id)
        .order('created_at', { ascending: false })

    if (!category) {
        return <div>Category not found</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Link href="/dashboard/categories">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
                    <p className="text-muted-foreground">
                        {resources?.length || 0} resources in this category
                    </p>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {resources?.map((resource: any) => (
                    <ResourceCard key={resource.id} resource={resource} />
                ))}

                {resources?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                        No resources in this category yet.
                        <div className="mt-4">
                            <Link href="/dashboard/resources/new">
                                <Button variant="outline">Add Resource</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
