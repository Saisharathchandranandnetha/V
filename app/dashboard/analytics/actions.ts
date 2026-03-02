'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { tasks, goals, transactions } from '@/lib/db/schema'
import { eq, or, gte, lte, and } from 'drizzle-orm'
import { fetchHabitStats } from '../habits/actions'

export async function getAnalyticsData(period: string = '7d', startDate?: string, endDate?: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const userId = session.user.id

    // Determine Date Range (Force IST)
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
    const todayStr = formatter.format(now) // YYYY-MM-DD in IST
    const [y, m, d] = todayStr.split('-').map(Number)

    let start = new Date(y, m - 1, d)
    let end = new Date(y, m - 1, d)

    // Reset to start of day for comparison safety
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    const parseLocalDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number)
        return new Date(y, m - 1, d)
    }

    if (startDate && endDate) {
        start = parseLocalDate(startDate)
        end = parseLocalDate(endDate)
        end.setHours(23, 59, 59, 999)
    } else {
        if (period === 'month') {
            start.setDate(1) // Start of current month
        } else if (period === 'year') {
            start.setMonth(0, 1) // Start of current year
        } else {
            // Default 7 days
            start.setDate(end.getDate() - 6)
        }
    }

    const toLocalISOString = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    const startStr = toLocalISOString(start)
    const endStr = toLocalISOString(end)

    // 1. Habit Stats
    const aggregation = period === 'year' ? 'month' : 'day'
    const rawHabitData = await fetchHabitStats(userId, start, end, aggregation)

    const habitData = rawHabitData.map((d: any) => ({
        date: d.name,
        fullDate: d.date,
        percentage: d.value
    }))

    // 2. Task Stats
    const tasksData = await db.select().from(tasks)
        .where(
            and(
                or(eq(tasks.userId, userId), eq(tasks.assignedTo, userId)),
                gte(tasks.dueDate, start),
                lte(tasks.dueDate, end)
            )
        )

    const taskData = [
        { name: 'Todo', value: tasksData.filter(t => t.status === 'Todo').length, fill: '#8884d8' },
        { name: 'In Progress', value: tasksData.filter(t => t.status === 'In Progress').length, fill: '#ffc658' },
        { name: 'Done', value: tasksData.filter(t => t.status === 'Done').length, fill: '#00C49F' },
    ].filter(d => d.value > 0)

    // 3. Goal Stats
    const goalsData = await db.select().from(goals)
        .where(
            and(
                eq(goals.userId, userId),
                gte(goals.createdAt, start),
                lte(goals.createdAt, end)
            )
        )
        .limit(5)

    const goalData = goalsData.map((g: any) => ({
        name: g.title,
        current: Number(g.currentValue),
        target: Number(g.targetValue),
        progress: Math.min((Number(g.currentValue) / Number(g.targetValue)) * 100, 100)
    }))

    // 4. Finance Stats (Transactions)
    const transactionsData = await db.select().from(transactions)
        .where(
            and(
                eq(transactions.userId, userId),
                gte(transactions.date, start),
                lte(transactions.date, end)
            )
        )

    const income = transactionsData.filter(t => t.type === 'Income').reduce((acc, t) => acc + Number(t.amount), 0)
    const expense = transactionsData.filter(t => t.type === 'Expense').reduce((acc, t) => acc + Number(t.amount), 0)

    const financeData = [
        { name: 'Income', value: income, fill: '#10b981' },
        { name: 'Expense', value: expense, fill: '#ef4444' },
    ]

    return {
        habitData,
        taskData,
        goalData,
        financeData,
        dateRange: { start: startStr, end: endStr }
    }
}
