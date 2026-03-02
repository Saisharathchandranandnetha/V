import { auth } from '@/auth'
import { db } from '@/lib/db'
import { resources, learningPaths, collections, categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Edit, Trash2, ExternalLink, ShieldCheck } from 'lucide-react'
import { deleteResource, deleteLearningPath } from '@/app/dashboard/actions'
import { getUserSettings, isAdmin } from './actions'
import SettingsForm from './settings-form'
import CollectionsManager from './collections-manager'
import CategoriesManager from './categories-manager'
import DeviceList from '@/components/settings/device-list'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
    const session = await auth()
    if (!session?.user?.id) redirect('/login')

    const user = await getUserSettings()

    const [resourcesData, pathsData, collectionsData, categoriesData] = await Promise.all([
        db.select().from(resources).where(eq(resources.userId, session.user.id)),
        db.select().from(learningPaths).where(eq(learningPaths.userId, session.user.id)),
        db.select().from(collections).where(eq(collections.userId, session.user.id)),
        db.select().from(categories).where(eq(categories.userId, session.user.id)),
    ])

    return (
        <div className="space-y-6 w-full max-w-full overflow-x-hidden">
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">Manage your account, preferences, and content.</p>
                    </div>
                    {/* Admin Access Button */}
                    {await (async () => {
                        const adminUser = await isAdmin()
                        if (adminUser) {
                            return (
                                <Link href="/dashboard/admin">
                                    <Button variant="outline" className="gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                                        <ShieldCheck className="h-4 w-4" />
                                        Admin Dashboard
                                    </Button>
                                </Link>
                            )
                        }
                        return null
                    })()}
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <div className="w-full overflow-x-auto pb-2">
                    <TabsList>
                        <TabsTrigger value="general">General Settings</TabsTrigger>
                        <TabsTrigger value="categories">Categories</TabsTrigger>
                        <TabsTrigger value="resources">My Resources</TabsTrigger>
                        <TabsTrigger value="paths">My Learning Paths</TabsTrigger>
                        <TabsTrigger value="devices">Devices</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="general">
                    {user ? (
                        <SettingsForm user={user as any} />
                    ) : (
                        <div className="p-8 text-center text-red-500">
                            Failed to load user settings. Please try again.
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="categories">
                    <CategoriesManager categories={categoriesData as any} />
                </TabsContent>

                <TabsContent value="resources" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Resources</CardTitle>
                            <CardDescription>
                                View, edit, or delete the resources you have added.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {resourcesData.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No resources found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {resourcesData.map((resource: any) => (
                                        <div key={resource.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
                                            <div className="space-y-1 min-w-0">
                                                <h3 className="font-medium flex items-center gap-2 truncate">
                                                    <span className="truncate">{resource.title}</span>
                                                    <a href={resource.url || '#'} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary flex-shrink-0">
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </h3>
                                                <p className="text-sm text-muted-foreground">{resource.type}</p>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                                                <Link href={`/dashboard/resources/${resource.id}/edit`} className="flex-1 sm:flex-initial">
                                                    <Button variant="outline" size="sm" className="w-full">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <form action={deleteResource.bind(null, resource.id)}>
                                                    <Button variant="destructive" size="sm" type="submit">
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="paths" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Learning Paths</CardTitle>
                            <CardDescription>
                                View, edit, or delete your learning paths.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {pathsData.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No learning paths found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {pathsData.map((path: any) => (
                                        <div key={path.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4">
                                            <div className="space-y-1 min-w-0">
                                                <h3 className="font-medium truncate">{path.title}</h3>
                                                <p className="text-sm text-muted-foreground truncate max-w-full sm:max-w-[300px]">{path.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                                                <Link href={`/dashboard/paths/${path.id}/edit`} className="flex-1 sm:flex-initial">
                                                    <Button variant="outline" size="sm" className="w-full">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <form action={deleteLearningPath.bind(null, path.id)}>
                                                    <Button variant="destructive" size="sm" type="submit">
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="devices">
                    <DeviceList />
                </TabsContent>
            </Tabs>
        </div >
    )
}
