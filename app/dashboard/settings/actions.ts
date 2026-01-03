'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getUserSettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // Try to fetch user settings
    let { data: userSettings, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    // If user row doesn't exist (e.g. existing user before migration), create it
    if (!userSettings && error?.code === 'PGRST116') {
        console.log('User row missing, creating default...')
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || '',
                avatar: user.user_metadata?.avatar_url || '',
                settings: {}
            })
            .select()
            .single()

        if (createError) {
            console.error('Error creating user row:', JSON.stringify(createError, null, 2))
            return null
        }
        userSettings = newUser
    }

    return userSettings
}

export async function updateSettings(settings: Record<string, any>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    // Get current settings first to merge (JSONB updates are merges by default in Postgres,
    // but typically via || operator. Supabase update merges top-level columns but for JSONB
    // we might need to be careful. Actually, updating a jsonb column with a json object
    // REPLACES the column value in standard SQL update unless we use special operators.
    // However, we want to update specific keys inside the jsonb 'settings' column.

    // Fetch current settings
    const { data: currentUser } = await supabase
        .from('users')
        .select('settings')
        .eq('id', user.id)
        .single()

    const currentSettings = currentUser?.settings || {}
    const newSettings = { ...currentSettings, ...settings }

    const { error } = await supabase
        .from('users')
        .update({ settings: newSettings })
        .eq('id', user.id)

    if (error) {
        console.error('Error updating settings:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        throw new Error(`Failed to update settings: ${error.message}`)
    }

    revalidatePath('/dashboard/settings')
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const name = formData.get('name') as string
    const bio = formData.get('bio') as string

    // Update 'name' column and 'bio' inside settings
    const { error } = await supabase
        .from('users')
        .update({
            name,
            settings: {
                ...(await getUserSettings())?.settings,
                profileBio: bio
            }
        })
        .eq('id', user.id)

    if (error) {
        console.error('Error updating profile:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        throw new Error(`Failed to update profile: ${error.message}`)
    }

    revalidatePath('/dashboard/settings')
}

export async function createCollection(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('collections').insert({
        name,
        user_id: user.id
    })

    if (error) {
        console.error('Error creating collection:', error)
        throw new Error('Failed to create collection')
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/categories')
    revalidatePath('/dashboard/collections')
}

export async function deleteCollection(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('collections').delete().eq('id', id)

    if (error) {
        console.error('Error deleting collection:', error)
        throw new Error('Failed to delete collection')
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/categories')
}

export async function updateCollection(id: string, formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string

    const { error } = await supabase
        .from('collections')
        .update({ name })
        .eq('id', id)

    if (error) {
        console.error('Error updating collection:', error)
        throw new Error('Failed to update collection')
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/categories')
}

export async function deleteAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    // Call the database function to delete self
    const { error } = await supabase.rpc('delete_user')

    if (error) {
        console.error('Error deleting user:', error)
        throw new Error('Failed to delete account')
    }

    return redirect('/login')
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
    }

    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        throw new Error(error.message)
    }

    return { success: true }
}

// --- Categories Actions ---

export async function createCategory(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('categories').insert({
        name,
        type: 'resource',
        user_id: user.id
    })

    if (error) {
        console.error('Error creating category:', error)
        throw new Error('Failed to create category')
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/categories')
}

export async function deleteCategory(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (error) {
        console.error('Error deleting category:', error)
        throw new Error('Failed to delete category')
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/categories')
}

export async function updateCategory(id: string, formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string

    const { error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id)

    if (error) {
        console.error('Error updating category:', error)
        throw new Error('Failed to update category')
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/categories')
}
