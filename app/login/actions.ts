'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { createClient } from '@/lib/supabase/server'

import { signupSchema, loginSchema } from '@/lib/auth-schemas'
import { checkRateLimit } from '@/lib/rate-limit'

export async function login(formData: FormData) {
    const rateLimit = await checkRateLimit()
    if (!rateLimit.success) {
        return redirect('/login?error=Too many requests. Please try again later.')
    }

    const supabase = await createClient()

    const rawData = {
        email: formData.get('email'),
        password: formData.get('password'),
    }

    const validation = loginSchema.safeParse(rawData)

    if (!validation.success) {
        return redirect(`/login?error=${encodeURIComponent(validation.error.issues[0].message)}`)
    }

    const { email, password } = validation.data

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login error:', error)
        return redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const rateLimit = await checkRateLimit()
    if (!rateLimit.success) {
        return redirect('/signup?error=Too many requests. Please try again later.')
    }

    const supabase = await createClient()
    const origin = (await headers()).get('origin')

    const rawData = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirm_password: formData.get('confirm_password'),
    }

    const validation = signupSchema.safeParse(rawData)

    if (!validation.success) {
        return redirect(`/signup?error=${encodeURIComponent(validation.error.issues[0].message)}`)
    }

    const { email, password, full_name } = validation.data

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback?next=/signup/verified`,
            data: {
                full_name: full_name,
            },
        },
    })

    if (error) {
        console.error('Signup error:', error)
        return redirect(`/signup?error=${encodeURIComponent(error.message)}`) // Changed redirect to signup page for errors
    }

    return redirect(`/signup/verify-email?email=${encodeURIComponent(email)}`)
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return redirect('/login')
}
