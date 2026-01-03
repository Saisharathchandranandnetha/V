
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Edit, Trash2, ExternalLink } from 'lucide-react'
import { deleteResource, deleteLearningPath } from '@/app/dashboard/actions'
import { getUserSettings } from './actions'
import SettingsForm from './settings-form'
import CollectionsManager from './collections-manager'
import CategoriesManager from './categories-manager'

export default async function SettingsPage() {
    const supabase = await createClient()

    // Fetch user settings and ensure row exists
    const user = await getUserSettings()

    const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false })

    const { data: paths } = await supabase
        .from('learning_paths')
        .select('*')
        .order('created_at', { ascending: false })

    const { data: collections } = await supabase
        .from('collections')
        .select('*')
        .order('name', { ascending: true })

    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account, preferences, and content.</p>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General Settings</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="resources">My Resources</TabsTrigger>
                    <TabsTrigger value="paths">My Learning Paths</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    {user ? (
                        <SettingsForm user={user} />
                    ) : (
                        <div className="p-8 text-center text-red-500">
                            Failed to load user settings. Please try again.
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="categories">
                    <CategoriesManager categories={categories} />
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
                            {resources?.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No resources found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {resources?.map((resource) => (
                                        <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <h3 className="font-medium flex items-center gap-2">
                                                    {resource.title}
                                                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </h3>
                                                <p className="text-sm text-muted-foreground">{resource.type}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/dashboard/resources/${resource.id}/edit`}>
                                                    <Button variant="outline" size="sm">
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
                            {paths?.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No learning paths found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {paths?.map((path) => (
                                        <div key={path.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <h3 className="font-medium">{path.title}</h3>
                                                <p className="text-sm text-muted-foreground truncate max-w-[300px]">{path.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/dashboard/paths/${path.id}/edit`}>
                                                    <Button variant="outline" size="sm">
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
            </Tabs>
        </div>
    )
}
