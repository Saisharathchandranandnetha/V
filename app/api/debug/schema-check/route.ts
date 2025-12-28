import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    // We can't easily query information_schema via supabase client due to permissions usually,
    // but we can try to select specific columns and see if it errors.

    const results: any = {}

    // Check if updated_at exists by selecting it
    const { error: selectError } = await supabase
        .from('users')
        .select('updated_at')
        .limit(1)

    if (selectError) {
        results.updated_at_check = { exists: false, error: selectError.message }
    } else {
        results.updated_at_check = { exists: true }
    }

    // Also check created_at
    const { error: createdAtError } = await supabase
        .from('users')
        .select('created_at')
        .limit(1)

    results.created_at_check = createdAtError ? { exists: false, error: createdAtError.message } : { exists: true }

    return NextResponse.json(results)
}
