
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ModelViewer } from '@/components/3d/model-viewer'
import { SplineViewer } from '@/components/3d/spline-viewer'
import { SketchfabViewer } from '@/components/3d/sketchfab-viewer'
import { LottiePlayer } from '@/components/lottie-player'
import { ResourceType } from '@/components/resource-card'
import Link from 'next/link'
import { ArrowLeft, Sparkles, BrainCircuit, MessageSquare } from 'lucide-react'

// Mock Data Fetcher (since we don't have DB connected yet)
async function getResource(id: string) {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const mockDb: Record<string, any> = {
        '1': {
            id: '1', title: 'Introduction to Next.js', type: 'youtube',
            url: 'https://www.youtube.com/embed/__mSgDEOyv8',
            summary: 'A definitive guide to Next.js App Router.', date: '2024-01-01', tags: ['nextjs', 'react']
        },
        '2': {
            id: '2', title: 'Advanced AI Patterns', type: 'pdf',
            url: 'https://arxiv.org/pdf/2303.11366.pdf',
            summary: 'Paper on Ref lexion.', date: '2024-01-02', tags: ['ai']
        },
        '3': {
            id: '3', title: '3D Heart Model', type: 'gltf',
            gltf_url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', // using astronaut as placeholder
            summary: 'Interactive 3D model.', date: '2024-01-03', tags: ['science']
        }
    }
    return mockDb[id] || mockDb['1']
}

export default async function ResourceDetailPage({ params }: { params: { id: string } }) {
    const resource = await getResource(params.id)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Link href="/dashboard/resources">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">{resource.title}</h1>
                        <div className="flex gap-2">
                            <Badge variant="outline">{resource.type}</Badge>
                            {resource.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                        </div>
                    </div>

                    <Card className="overflow-hidden min-h-[400px]">
                        <CardContent className="p-0 h-full">
                            {resource.type === 'youtube' && (
                                <iframe src={resource.url} className="w-full aspect-video border-0" allowFullScreen />
                            )}
                            {resource.type === 'gltf' && (
                                <ModelViewer src={resource.gltf_url || resource.url} />
                            )}
                            {resource.type === 'spline' && (
                                <SplineViewer url={resource.spline_embed_url || resource.url} />
                            )}
                            {resource.type === 'sketchfab' && (
                                <SketchfabViewer url={resource.url} />
                            )}
                            {/* Fallback for others */}
                            {['pdf', 'url', 'image'].includes(resource.type) && (
                                <div className="flex flex-col items-center justify-center h-64 bg-muted">
                                    <p>Preview not available for this type.</p>
                                    <Button variant="link" asChild><a href={resource.url} target="_blank">Open Original</a></Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>AI Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{resource.summary}</p>
                            {/* Lottie Animation for "AI Thinking" could go here if generating */}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Actions (1 col) */}
                <div className="space-y-4">
                    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-indigo-500" />
                                AI Study Tools
                            </CardTitle>
                            <CardDescription>Master this content</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full justify-start" variant="outline">
                                <BrainCircuit className="mr-2 h-4 w-4" />
                                Generate Flashcards
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Start Quiz
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Explain Like I'm 15
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground italic">No notes taken yet.</p>
                            <Button variant="link" className="px-0">Add Note</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
