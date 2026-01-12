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


export async function getHabitStats(
  viewType: 'date' | 'month' | 'year' | 'all',
  params: { date?: Date; month?: number; year?: number }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let start = new Date()
  let end = new Date()

  if (viewType === 'date' && params.date) {
    start = new Date(params.date)
    start.setHours(0, 0, 0, 0)
    end = new Date(params.date)
    end.setHours(23, 59, 59, 999)
  } else if (viewType === 'month' && params.month !== undefined && params.year) {
    start = new Date(params.year, params.month, 1)
    end = new Date(params.year, params.month + 1, 0)
    end.setHours(23, 59, 59, 999)
  } else if (viewType === 'year' && params.year) {
    start = new Date(params.year, 0, 1)
    end = new Date(params.year, 11, 31)
    end.setHours(23, 59, 59, 999)
  } else if (viewType === 'all') {
    const { data: habits } = await supabase.from('habits').select('created_at').eq('user_id', user.id).order('created_at', { ascending: true }).limit(1)
    const earliest = habits?.[0]?.created_at || new Date().toISOString()
    start = new Date(earliest)
    end = new Date() // Now
  }

  // Use the shared logic
  return await fetchHabitStats(user.id, start, end, viewType === 'year' ? 'month' : 'day')
}

// Shared function for consistency calculation
export async function fetchHabitStats(
  userId: string,
  start: Date,
  end: Date,
  aggregation: 'day' | 'month'
) {
  const supabase = await createClient()

  // 1. Fetch Habits
  const { data: habits } = await supabase.from('habits').select('id, created_at').eq('user_id', userId)
  const totalHabits = habits?.length || 0
  if (totalHabits === 0) return []

  // 2. Fetch Logs
  const toISODate = (d: Date) => {
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - (offset * 60 * 1000))
    return local.toISOString().split('T')[0]
  }

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('date, status, habit_id')
    .gte('date', toISODate(start))
    .lte('date', toISODate(end))
    .eq('status', true)
    .in('habit_id', habits?.map(h => h.id) || [])

  // 3. Aggregate
  if (aggregation === 'month') {
    // Monthly aggregation
    // Generate months between start and end
    const months = []
    let currentCtx = new Date(start)
    currentCtx.setDate(1) // align to month start

    while (currentCtx <= end) {
       months.push(new Date(currentCtx))
       currentCtx.setMonth(currentCtx.getMonth() + 1)
    }

    return months.map(monthStart => {
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
      monthEnd.setHours(23, 59, 59, 999)

      // Count logs in this month
      // Check if log date falls in this month
      const count = logs?.filter(l => {
        const d = new Date(l.date)
        return d.getMonth() === monthStart.getMonth() && d.getFullYear() === monthStart.getFullYear()
      }).length || 0

      // Calculate total opportunities
      let totalOps = 0
      habits?.forEach(habit => {
        const createdAt = new Date(habit.created_at)
        createdAt.setHours(0, 0, 0, 0)

        const effectiveStart = createdAt > monthStart ? createdAt : monthStart
        // Clamp effectiveEnd to actual end of range if needed, but for "month" bucket usually full month
        // However, if the query range ends mid-month, we should probably respect that?
        // For now, consistent with viewing "Last Year", we show full months.
        const effectiveEnd = monthEnd

        if (effectiveStart <= effectiveEnd) {
           const diffTime = Math.abs(effectiveEnd.getTime() - effectiveStart.getTime());
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
           totalOps += diffDays
        }
      })

      const percentage = totalOps > 0 ? (count / totalOps) * 100 : 0

      return {
        name: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        date: monthStart.toISOString(),
        value: Math.round(percentage)
      }
    })

  } else {
    // Daily aggregation
    const stats = []
    let current = new Date(start)
    // Avoid infinite loop
    if (current > end && start.toDateString() !== end.toDateString()) return [] 
    
    // Safety check
    const maxIterations = 365 * 5 // 5 years max
    let i = 0

    while (current <= end) {
      if (i++ > maxIterations) break;

      const dateStr = toLocalISOString(current)
      
      const activeHabitsCount = habits?.filter(h => {
          const createdAtStr = new Date(h.created_at).toISOString().split('T')[0]
          return createdAtStr <= dateStr
      }).length || 0

      const count = logs?.filter(l => l.date === dateStr).length || 0
      const percentage = activeHabitsCount > 0 ? (count / activeHabitsCount) * 100 : 0

      stats.push({
        name: current.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
        date: dateStr,
        value: Math.round(percentage) 
      })
      current.setDate(current.getDate() + 1)
    }
    return stats
  }
}


// Helper to ensure local ISO string YYYY-MM-DD
function toLocalISOString(d: Date) {
  const pad = (n: number) => n < 10 ? '0' + n : n
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}
