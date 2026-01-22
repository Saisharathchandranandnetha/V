'use server'

import { createClient } from '@/lib/supabase/server'
import { fetchHabitStats } from '../habits/actions'

export async function getAnalyticsData(period: string = '7d', startDate?: string, endDate?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Determine Date Range
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
        // Ensure end captures the full day
        end.setHours(23, 59, 59, 999)
    } else {
        // Defaults based on period if no explicit dates provided
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


    // 1. Habit Stats using shared logic
    // Determine aggregation type based on period
    const aggregation = period === 'year' ? 'month' : 'day'
    const rawHabitData = await fetchHabitStats(user.id, start, end, aggregation)

    // Map to structure compatible with charts (if needed, or just return rawHabitData)
    // AnalyticsCharts currently expects: 
    // - BarChart with dataKey="percentage" (and "date" param for axis)
    // New fetchHabitStats returns: { name, date, value } where value is percentage.

    const habitData = rawHabitData.map((d: any) => ({
        date: d.name, // Display label (Jan 01 or Jan)
        fullDate: d.date, // ISO Date
        percentage: d.value
    }))


    // 2. Task Stats (Created in range)
    const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .or(`assigned_to.eq.${user.id},and(assigned_to.is.null,user_id.eq.${user.id})`)
        .gte('due_date', start.toISOString())
        .lte('due_date', end.toISOString())

    const taskData = [
        { name: 'Todo', value: tasks?.filter(t => t.status === 'Todo').length || 0, fill: '#8884d8' },
        { name: 'In Progress', value: tasks?.filter(t => t.status === 'In Progress').length || 0, fill: '#ffc658' },
        { name: 'Done', value: tasks?.filter(t => t.status === 'Done').length || 0, fill: '#00C49F' },
    ].filter(d => d.value > 0)

    // 3. Goal Stats (Updated in range)
    const { data: goals } = await supabase
        .from('goals')
        .select('title, current_value, target_value, updated_at')
        .eq('user_id', user.id)
        .limit(5)
        .gte('updated_at', start.toISOString())
        .lte('updated_at', end.toISOString())

    const goalData = goals?.map(g => ({
        name: g.title,
        current: Number(g.current_value),
        target: Number(g.target_value),
        progress: Math.min((Number(g.current_value) / Number(g.target_value)) * 100, 100)
    })) || []

    // 4. Finance Stats (Filtered by Date)
    const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', user.id)
        .gte('date', start.toISOString())
        .lte('date', end.toISOString())

    // Safe handling: transaction dates are timestamps, logic expects filter to work

    const income = transactions?.filter(t => t.type === 'Income').reduce((acc, t) => acc + Number(t.amount), 0) || 0
    const expense = transactions?.filter(t => t.type === 'Expense').reduce((acc, t) => acc + Number(t.amount), 0) || 0

    const financeData = [
        { name: 'Income', value: income, fill: '#10b981' }, // green-500
        { name: 'Expense', value: expense, fill: '#ef4444' }, // red-500
    ]

    return {
        habitData,
        taskData,
        goalData,
        financeData,
        dateRange: { start: startStr, end: endStr } // Return resolved dates for UI if needed
    }
}
