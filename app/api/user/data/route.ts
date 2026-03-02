import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users, resources, learningPaths } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

    const userId = session.user.id

    // Fetch user data
    const [userProfile] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const userResources = await db.select().from(resources).where(eq(resources.userId, userId))
    const userPaths = await db.select().from(learningPaths).where(eq(learningPaths.userId, userId))

    const exportData = {
        user: userProfile,
        resources: userResources,
        learning_paths: userPaths,
        exported_at: new Date().toISOString()
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="data-${userId}.json"`
        }
    })
}
