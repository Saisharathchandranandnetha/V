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

  const { data: habits } = await supabase.from('habits').select('id, created_at').eq('user_id', user.id)
  const totalHabits = habits?.length || 0
  if (totalHabits === 0) return []

  let start = new Date()
  let end = new Date()

  // Helper to format date as YYYY-MM-DD
  const toISODate = (d: Date) => {
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - (offset * 60 * 1000))
    return local.toISOString().split('T')[0]
  }

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
    // Find earliest habit creation
    const earliest = habits?.reduce((min, h) => (h.created_at < min ? h.created_at : min), new Date().toISOString())
    start = new Date(earliest || new Date())
    end = new Date() // Now
  }

  // Fetch logs in range
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('date, status')
    .gte('date', toISODate(start))
    .lte('date', toISODate(end))
    .eq('status', true)
    .in('habit_id', habits?.map(h => h.id) || [])


  // Aggregate
  if (viewType === 'year') {
    // Monthly aggregation
    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(params.year!, i, 1)
      const monthEnd = new Date(params.year!, i + 1, 0)
      
      // Count logs in this month
      const count = logs?.filter(l => {
        const d = new Date(l.date)
        return d.getMonth() === i && d.getFullYear() === params.year
      }).length || 0

      // Calculate total opportunities based on when each habit was created
      let totalOps = 0
      habits?.forEach(habit => {
        const createdAt = new Date(habit.created_at)
        // Reset time to start of day for fair comparison
        createdAt.setHours(0, 0, 0, 0)

        // Find overlap between habit existence and this month
        // max(monthStart, createdAt)
        const effectiveStart = createdAt > monthStart ? createdAt : monthStart
        
        // We only count up to the end of the month
        // (Note: If you want to not count future days within the current month, 
        // you'd also need min(monthEnd, today). But sticking to "active in month" logic for now
        // to match previous behavior of showing full month potential, 
        // OR we can clamp to "now" if that's preferred. 
        // The user request was about "previous consistency should not be changed". 
        // Making strict "active days" is safer.)
        const effectiveEnd = monthEnd

        if (effectiveStart <= effectiveEnd) {
           // Difference in days
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
    return monthlyStats

  } else {
    // Daily aggregation (Date, Month, All)
    const stats = []
    let current = new Date(start)
    // Avoid infinite loop if dates are messed up
    if (current > end) return []

    while (current <= end) {
      const dateStr = toLocalISOString(current)
      
      // Count active habits for this specific day
      // A habit is active if created_at <= current day (end of day comparison or start?)
      // Typically created_at is a timestamp. If I create it at 5PM, does it count for that day?
      // Usually yes, you want to do it that day.
      // Comparison: habit.created_at (timestamp) <= current (which is set to 00:00 iterate? No, wait.)
      // 'current' in loop starts at 'start'. 
      // Let's ensure strict date string comparison to avoid time zone issues.
      
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
