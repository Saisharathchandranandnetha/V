'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { habits, habitLogs } from '@/lib/db/schema'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createHabit(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('User not authenticated')

  const name = formData.get('name') as string
  const frequency = (formData.get('frequency') as string) || 'Daily'

  await db.insert(habits).values({ name, frequency, userId: session.user.id })
  revalidatePath('/dashboard/habits')
}

export async function deleteHabit(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, session.user.id)))
  revalidatePath('/dashboard/habits')
}

export async function toggleHabit(habitId: string, date: string, completed: boolean) {
  const [existingLog] = await db.select().from(habitLogs)
    .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)))
    .limit(1)

  if (existingLog) {
    await db.update(habitLogs).set({ status: completed }).where(eq(habitLogs.id, existingLog.id))
  } else {
    await db.insert(habitLogs).values({ habitId, date, status: completed })
  }

  revalidatePath('/dashboard/habits')
}

export async function updateHabit(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const frequency = (formData.get('frequency') as string) || 'Daily'

  await db.update(habits).set({ name, frequency })
    .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)))

  revalidatePath('/dashboard/habits')
}

export async function getHabitStats(
  viewType: 'date' | 'month' | 'year' | 'all',
  params: { date?: Date; month?: number; year?: number }
) {
  const session = await auth()
  if (!session?.user?.id) return []

  let start = new Date()
  let end = new Date()

  if (viewType === 'date' && params.date) {
    start = new Date(params.date); start.setHours(0, 0, 0, 0)
    end = new Date(params.date); end.setHours(23, 59, 59, 999)
  } else if (viewType === 'month' && params.month !== undefined && params.year) {
    start = new Date(params.year, params.month, 1)
    end = new Date(params.year, params.month + 1, 0); end.setHours(23, 59, 59, 999)
  } else if (viewType === 'year' && params.year) {
    start = new Date(params.year, 0, 1)
    end = new Date(params.year, 11, 31); end.setHours(23, 59, 59, 999)
  } else if (viewType === 'all') {
    const earliest = await db.select({ createdAt: habits.createdAt }).from(habits)
      .where(eq(habits.userId, session.user.id)).orderBy(habits.createdAt).limit(1)
    start = earliest[0] ? new Date(earliest[0].createdAt) : new Date()
    end = new Date()
  }

  return await fetchHabitStats(session.user.id, start, end, viewType === 'year' ? 'month' : 'day')
}

export async function fetchHabitStats(userId: string, start: Date, end: Date, aggregation: 'day' | 'month') {
  const toISODate = (d: Date) => {
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - (offset * 60 * 1000))
    return local.toISOString().split('T')[0]
  }

  const habitsData = await db.select({ id: habits.id, createdAt: habits.createdAt })
    .from(habits).where(eq(habits.userId, userId))

  const totalHabits = habitsData.length
  if (totalHabits === 0) return []

  const logs = await db.select({ date: habitLogs.date, status: habitLogs.status, habitId: habitLogs.habitId })
    .from(habitLogs)
    .where(and(
      gte(habitLogs.date, toISODate(start)),
      lte(habitLogs.date, toISODate(end)),
      eq(habitLogs.status, true),
      inArray(habitLogs.habitId, habitsData.map(h => h.id))
    ))

  if (aggregation === 'month') {
    const months = []
    const cur = new Date(start); cur.setDate(1)
    while (cur <= end) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1) }

    return months.map(monthStart => {
      const count = logs.filter(l => {
        const d = new Date(l.date)
        return d.getMonth() === monthStart.getMonth() && d.getFullYear() === monthStart.getFullYear()
      }).length
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
      let totalOps = 0
      habitsData.forEach(habit => {
        const createdAt = new Date(habit.createdAt); createdAt.setHours(0, 0, 0, 0)
        const effectiveStart = createdAt > monthStart ? createdAt : monthStart
        if (effectiveStart <= monthEnd) {
          const diffDays = Math.ceil(Math.abs(monthEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
          totalOps += diffDays
        }
      })
      return { name: monthStart.toLocaleDateString('en-US', { month: 'short' }), date: monthStart.toISOString(), value: totalOps > 0 ? Math.round((count / totalOps) * 100) : 0 }
    })
  } else {
    const stats = []
    const current = new Date(start)
    const maxIterations = 365 * 5; let i = 0
    while (current <= end) {
      if (i++ > maxIterations) break
      const dateStr = toLocalISOString(current)
      const activeHabitsCount = habitsData.filter(h => new Date(h.createdAt).toISOString().split('T')[0] <= dateStr).length
      const count = logs.filter(l => l.date === dateStr).length
      stats.push({ name: current.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }), date: dateStr, value: activeHabitsCount > 0 ? Math.round((count / activeHabitsCount) * 100) : 0 })
      current.setDate(current.getDate() + 1)
    }
    return stats
  }
}

function toLocalISOString(d: Date) {
  const pad = (n: number) => n < 10 ? '0' + n : n
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}
