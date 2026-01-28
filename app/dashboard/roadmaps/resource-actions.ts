'use server'

import { createClient } from '@/lib/supabase/server'

export async function getLinkableItems() {
    const supabase = await createClient()

    const [notesRes, pathsRes, resourcesRes, goalsRes] = await Promise.all([
        supabase.from('notes').select('id, title').order('title'),
        supabase.from('learning_paths').select('id, title').order('title'),
        supabase.from('resources').select('id, title, type').order('title'),
        supabase.from('goals').select('id, title').order('title')
    ])

    return {
        notes: notesRes.data || [],
        paths: pathsRes.data || [],
        resources: resourcesRes.data || [],
        goals: goalsRes.data || []
    }
}
