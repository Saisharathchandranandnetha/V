import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    // Fetch all user data
    const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('user_id', user.id)

    const { data: paths } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)

    const exportData = {
        user: userProfile,
        resources,
        learning_paths: paths,
        exported_at: new Date().toISOString()
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="data-${user.id}.json"`
        }
    })
}
