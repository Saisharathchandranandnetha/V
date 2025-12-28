import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const results = {
        users: { exists: false, error: null },
        collections: { exists: false, error: null }
    }

    // Check users table
    const { error: usersError } = await supabase.from('users').select('id').limit(1)
    if (usersError) {
        results.users.error = usersError.message
    } else {
        results.users.exists = true
    }

    // Check collections table
    const { error: collectionsError } = await supabase.from('collections').select('id').limit(1)
    if (collectionsError) {
        results.collections.error = collectionsError.message
    } else {
        results.collections.exists = true
    }

    return NextResponse.json(results)
}
