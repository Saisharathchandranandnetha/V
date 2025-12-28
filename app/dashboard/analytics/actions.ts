'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAnalyticsData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // 1. Habit Stats (Last 7 Days)
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(today.getDate() - i)
        return d.toISOString().split('T')[0]
    }).reverse()

    const { data: habits } = await supabase.from('habits').select('id').eq('user_id', user.id)
    const totalHabits = habits?.length || 0

    const { data: logs } = await supabase
        .from('habit_logs')
        .select('date, status')
        .in('date', last7Days)
        .eq('status', true)
        .in('habit_id', habits?.map(h => h.id) || [])

    const habitData = last7Days.map(date => {
        const completedCount = logs?.filter(l => l.date === date).length || 0
        // Avoid division by zero
        const percentage = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0
        return {
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            fullDate: date,
            percentage: Math.round(percentage)
        }
    })

    // 2. Task Stats
    const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('user_id', user.id)

    const taskData = [
        { name: 'Todo', value: tasks?.filter(t => t.status === 'Todo').length || 0, fill: '#8884d8' },
        { name: 'In Progress', value: tasks?.filter(t => t.status === 'In Progress').length || 0, fill: '#ffc658' },
        { name: 'Done', value: tasks?.filter(t => t.status === 'Done').length || 0, fill: '#00C49F' },
    ].filter(d => d.value > 0)

    // 3. Goal Stats (Top 5 Active)
    const { data: goals } = await supabase
        .from('goals')
        .select('title, current_value, target_value')
        .eq('user_id', user.id)
        .limit(5)

    const goalData = goals?.map(g => ({
        name: g.title,
        current: Number(g.current_value),
        target: Number(g.target_value),
        progress: Math.min((Number(g.current_value) / Number(g.target_value)) * 100, 100)
    })) || []

    // 4. Finance Stats (Income vs Expense)
    const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)

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
        financeData
    }
}
