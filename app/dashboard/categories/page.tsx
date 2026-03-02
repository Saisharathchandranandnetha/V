import { auth } from '@/auth'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Folder } from 'lucide-react'
import { HoverEffect } from '@/components/ui/hover-effect'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { StaggerContainer, StaggerItem } from '@/components/ui/entrance'
import { Button } from '@/components/ui/button'
import { CreateCategoryDialog } from './create-category-dialog'
import { DashboardSearch } from '@/components/dashboard-search'
import { redirect } from 'next/navigation'

export default async function CategoriesPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q: searchQuery } = await searchParams
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const categoriesData = await db.select().from(categories).where(eq(categories.userId, session.user.id))

    const filtered = categoriesData.filter((c: any) =>
        !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                    <p className="text-muted-foreground">Browse your resources by category.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/settings?tab=categories">
                        <Button variant="outline">Manage Categories</Button>
                    </Link>
                    <CreateCategoryDialog />
                </div>
            </div>
            <DashboardSearch placeholder="Search categories..." />
            <StaggerContainer key={searchQuery} className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((category: any) => (
                    <StaggerItem key={category.id} className="h-full">
                        <HoverEffect variant="lift">
                            <Link href={`/dashboard/categories/${category.id}`}>
                                <SpotlightCard className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Folder className="h-5 w-5 text-blue-500" />
                                            {category.name}
                                        </CardTitle>
                                        <CardDescription>0 resources</CardDescription>
                                    </CardHeader>
                                </SpotlightCard>
                            </Link>
                        </HoverEffect>
                    </StaggerItem>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No categories found. Create one to organize your resources.
                    </div>
                )}
            </StaggerContainer>
        </div>
    )
}
