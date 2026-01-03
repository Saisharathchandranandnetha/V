import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CategoriesManager from '../settings/categories-manager'

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateCategoryDialog } from './create-category-dialog'

export default async function CategoriesPage() {
    const supabase = await createClient()
    const { data: categories } = await supabase
        .from('categories')
        .select('*, resources(count)')
        .order('name', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                    <p className="text-muted-foreground">Browse your resources by category.</p>
                </div>
                <Link href="/dashboard/settings?tab=categories">
                    <Button variant="outline" className="mr-2">Manage Categories</Button>
                </Link>
                <CreateCategoryDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {categories?.map((category: any) => (
                    <Link key={category.id} href={`/dashboard/categories/${category.id}`}>
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Folder className="h-5 w-5 text-blue-500" />
                                    {category.name}
                                </CardTitle>
                                <CardDescription>
                                    {category.resources?.[0]?.count || 0} resources
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}

                {categories?.length === 0 && (
                    <div className="col-span-full p-8 border rounded-lg border-dashed text-center text-muted-foreground">
                        No categories found. Create one via "Manage Categories" or when adding a resource.
                    </div>
                )}
            </div>
        </div>
    )
}
