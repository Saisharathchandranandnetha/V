'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createGoal(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const type = (formData.get('type') as string) || 'Short Term'
    const target = Number(formData.get('target_value'))
    const unit = (formData.get('unit') as string) || '%'
    const current = Number(formData.get('current_value')) || 0
    const deadline = formData.get('deadline') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase.from('goals').insert({
        title,
        type,
        target_value: target,
        current_value: current,
        unit,
        deadline: deadline ? deadline : null,
        user_id: user.id
    })

    if (error) {
        console.error('Error creating goal:', error)
        throw new Error('Failed to create goal')
    }

    revalidatePath('/dashboard/goals')
}

export async function updateGoalProgress(id: string, current: number) {
    const supabase = await createClient()

    const { error } = await supabase.from('goals').update({ current_value: current }).eq('id', id)

    if (error) {
        console.error('Error updating goal:', error)
        throw new Error('Failed to update goal')
    }

    revalidatePath('/dashboard/goals')
}

export async function deleteGoal(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) throw new Error('Failed to delete goal')

    revalidatePath('/dashboard/goals')
}

export async function updateGoal(id: string, formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const target = Number(formData.get('target_value'))
    const unit = formData.get('unit') as string
    const deadline = formData.get('deadline') as string

    const { error } = await supabase.from('goals')
        .update({
            title,
            type,
            target_value: target,
            unit,
            deadline: deadline ? deadline : null,
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating goal:', error)
        throw new Error('Failed to update goal')
    }

    revalidatePath('/dashboard/goals')
}
