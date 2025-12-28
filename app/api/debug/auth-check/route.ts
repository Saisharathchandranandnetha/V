import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({
            step: 'auth',
            error: authError,
            user: null
        })
    }

    const { data: row, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    let insertResult = null
    if (!row && selectError?.code === 'PGRST116') {
        // Try insert
        insertResult = await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            name: 'Debug User',
            avatar: '',
            settings: {}
        }).select().single()
    }

    return NextResponse.json({
        step: 'db',
        user_id: user.id,
        select_error: selectError,
        row_found: !!row,
        insert_result: insertResult
    })
}
