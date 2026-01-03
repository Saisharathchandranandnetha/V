'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAnalyticsData(period: string = '7d', startDate?: string, endDate?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Determine Date Range
    let start = new Date()
    let end = new Date()

    // Reset to start of day for comparison safety
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    if (startDate && endDate) {
        start = new Date(startDate)
        end = new Date(endDate)
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

    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    // 1. Habit Stats
    const { data: habits } = await supabase.from('habits').select('id').eq('user_id', user.id)
    const totalHabits = habits?.length || 0

    const { data: logs } = await supabase
        .from('habit_logs')
        .select('date, status')
        .gte('date', startStr)
        .lte('date', endStr)
        .eq('status', true)
        .in('habit_id', habits?.map(h => h.id) || [])

    let habitData = []

    // Aggregation Logic
    if (period === 'year') {
        // Aggregate by Month
        const months = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(new Date().getFullYear(), i, 1)
            return {
                label: d.toLocaleDateString('en-US', { month: 'short' }),
                monthIndex: i
            }
        })

        habitData = months.map(m => {
            // Find logs in this month
            // Note: This matches regardless of year if we only check month, strictly we should check year too 
            // but for "This Year" view using current year is implied.
            // Better: Filter logs where logDate.month == m.monthIndex
            const countInMonth = logs?.filter(l => new Date(l.date).getMonth() === m.monthIndex).length || 0

            // Approximate total opportunities: Days in Month * Total Habits
            // This is rough but sufficient for trend viewing
            const daysInMonth = new Date(new Date().getFullYear(), m.monthIndex + 1, 0).getDate()
            const totalOps = daysInMonth * totalHabits

            const percentage = totalOps > 0 ? (countInMonth / totalOps) * 100 : 0
            return {
                date: m.label,
                percentage: Math.round(percentage)
            }
        })
    } else {
        // Aggregate by Day (7d, Month, Custom)
        // Generate array of dates between start and end
        const dateArray = []
        let current = new Date(start)
        while (current <= end) {
            dateArray.push(current.toISOString().split('T')[0])
            current.setDate(current.getDate() + 1)
        }

        habitData = dateArray.map(dateStr => {
            const completedCount = logs?.filter(l => l.date === dateStr).length || 0
            const percentage = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0
            return {
                date: new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }), // e.g. "Jan 01"
                fullDate: dateStr,
                percentage: Math.round(percentage)
            }
        })
    }

    // 2. Task Stats (Created in range)
    const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

    const taskData = [
        { name: 'Todo', value: tasks?.filter(t => t.status === 'Todo').length || 0, fill: '#8884d8' },
        { name: 'In Progress', value: tasks?.filter(t => t.status === 'In Progress').length || 0, fill: '#ffc658' },
        { name: 'Done', value: tasks?.filter(t => t.status === 'Done').length || 0, fill: '#00C49F' },
    ].filter(d => d.value > 0)

    // 3. Goal Stats (Created in range)
    const { data: goals } = await supabase
        .from('goals')
        .select('title, current_value, target_value')
        .eq('user_id', user.id)
        .limit(5)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

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
