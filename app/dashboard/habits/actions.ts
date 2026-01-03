'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createHabit(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const frequency = (formData.get('frequency') as string) || 'Daily'

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase.from('habits').insert({
    name,
    frequency,
    user_id: user.id,
  })

  if (error) {
    console.error('Error creating habit:', error)
    throw new Error('Failed to create habit')
  }

  revalidatePath('/dashboard/habits')
}

export async function deleteHabit(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('habits').delete().eq('id', id)

  if (error) {
    console.error('Error deleting habit:', error)
    throw new Error('Failed to delete habit')
  }

  revalidatePath('/dashboard/habits')
}

export async function toggleHabit(habitId: string, date: string, completed: boolean) {
  const supabase = await createClient()

  // Check if log exists
  const { data: existingLog } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('habit_id', habitId)
    .eq('date', date)
    .single()

  if (existingLog) {
    // Update
    const { error } = await supabase
      .from('habit_logs')
      .update({ status: completed })
      .eq('id', existingLog.id)

    if (error) throw new Error('Failed to update habit log')
  } else {
    // Insert
    const { error } = await supabase
      .from('habit_logs')
      .insert({
        habit_id: habitId,
        date: date,
        status: completed
      })

    if (error) throw new Error('Failed to create habit log')
  }

  revalidatePath('/dashboard/habits')
}

export async function updateHabit(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const frequency = (formData.get('frequency') as string) || 'Daily'

  const { error } = await supabase.from('habits')
    .update({
      name,
      frequency
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating habit:', error)
    throw new Error('Failed to update habit')
  }

  revalidatePath('/dashboard/habits')
}
