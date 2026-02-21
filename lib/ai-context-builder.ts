import { createClient } from '@/lib/supabase/server'
import type { PageContext } from './ai-page-contexts'

// ============================================================
// LEVEL 1 — Static App Knowledge
// This never changes. The AI always gets this to understand
// what LifeOS is, what features exist, and what relationships
// connect the data.
// ============================================================
const APP_KNOWLEDGE = `
## APP: LifeOS — Personal Life Tracking OS

### WHAT THIS APP IS
LifeOS is a personal productivity and life management system that helps users track their 
tasks, habits, goals, finances, notes, resources, and learning. Think of it as a full 
second brain + life dashboard.

### FEATURES MAP
1. **Dashboard** — Daily overview: tasks due today, habits to complete, active goals, quick stats
2. **Tasks** — To-do manager: create/edit/delete tasks, set priority (Low/Medium/High/Urgent), status (Todo/In Progress/Done), due dates
3. **Habits** — Daily habit tracker: create habits with Daily/Weekly frequency, log completion each day, track streaks
4. **Goals** — Long-term goal setting: Short Term / Mid Term / Long Term goals with target values, progress tracking, units (e.g., km, books, hours), deadlines
5. **Finances** — Personal finance tracker: income and expense transactions, categories, monthly summaries
6. **Notes** — Free-form note-taking: titled notes with rich content for journaling, ideas, reflections
7. **Resources** — Learning resource library: save articles, videos, 3D models with tags and AI summaries
8. **Learning Paths** — Structured learning: create or follow learning modules with progress
9. **Roadmaps** — Visual branching roadmaps for skills, projects, or long-term journeys
10. **Analytics** — Charts and metrics: task completion rates, habit streaks, goal progress, spending trends
11. **Teams** — Team collaboration: create teams, invite members, share projects
12. **Team Chat** — Real-time team messaging with shared tasks and projects
13. **Settings** — Profile, theme (light/dark), preferences

### DATA RELATIONSHIPS
- A Task can have priority, status, due date, and completion details
- A Habit has daily/weekly frequency and is logged via habit_logs (one record per day)
- A Goal has target_value, current_value, unit, and deadline
- A Transaction belongs to a Category (Income/Expense type)
- A Resource can have Notes attached to it
- Tasks can be assigned to team members in team context

### NAVIGATION & ACTION GUIDE
- You are an ACTIVE assistant. If the user wants to go to a page, call the \`navigate_to_page\` tool.
- You can create, edit, or delete user data using your tools (Tasks, Habits, Goals, etc.).
- If a user asks to do something outside the current page, either navigate them there or use the relevant tool.

### THINGS YOU CANNOT DO
- You cannot access other users' data.
- You cannot change system-level infrastructure settings.
- You cannot make predictions without data.

### TONE
Be like Notion AI — concise, smart, action-oriented. No fluff. Give direct answers.
If the user asks something vague, make a reasonable assumption and explain it.
Use bullet points when listing multiple items.
`

// ============================================================
// AIContextBuilder
// Assembles the full system prompt for every AI request.
// Combines all 3 levels of context.
// ============================================================
export class AIContextBuilder {
    private userId: string

    constructor(userId: string) {
        this.userId = userId
    }

    // Main entry point — call this before every AI request
    async build(pageContext: PageContext): Promise<string> {
        const [relevantData, userProfile] = await Promise.all([
            this.fetchRelevantData(pageContext),
            this.fetchUserProfile(),
        ])

        return `
${APP_KNOWLEDGE}

## CURRENT USER
Name: ${userProfile?.name || 'User'}
Email: ${userProfile?.email || ''}

## CURRENT PAGE CONTEXT
Page: ${pageContext.page}
Description: ${pageContext.description}
Hint for AI behavior: ${pageContext.hint}

## RELEVANT DATA FOR THIS PAGE
${relevantData}

## INSTRUCTIONS
- Answer based ONLY on the data provided above. Do not make up numbers or records.
- If data is empty (e.g., no tasks found), say so and guide the user to create some.
- Keep responses concise. Use bullet points for lists.
- If the user asks for something outside the current page's scope, guide them to the right page.
- Today's date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Current time: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
    `.trim()
    }

    // ============================================================
    // LEVEL 3 — Smart per-page data fetching
    // Only fetch what's needed for the current page.
    // ============================================================
    private async fetchRelevantData(pageContext: PageContext): Promise<string> {
        const page = pageContext.page.toLowerCase()
        const dataNeeded = pageContext.availableData

        if (dataNeeded.length === 0) return 'No specific data needed for this page.'

        const fetchers: Record<string, () => Promise<string>> = {
            tasks: () => this.fetchTasks(),
            tasks_summary: () => this.fetchTasksSummary(),
            habits: () => this.fetchHabits(),
            habits_today: () => this.fetchHabits(), // same query, shown as today context
            habit_logs_today: () => this.fetchHabitLogsToday(),
            habits_summary: () => this.fetchHabitsSummary(),
            goals: () => this.fetchGoals(),
            goals_summary: () => this.fetchGoalsSummary(),
            transactions_this_month: () => this.fetchTransactionsThisMonth(),
            transactions_summary: () => this.fetchTransactionsSummary(),
            categories: () => this.fetchCategories(),
            notes_recent: () => this.fetchRecentNotes(),
            resources_recent: () => this.fetchRecentResources(),
            paths: () => this.fetchPaths(),
        }

        const results: string[] = []
        for (const key of dataNeeded) {
            if (fetchers[key]) {
                const data = await fetchers[key]()
                results.push(data)
            }
        }

        return results.join('\n\n') || 'No data available.'
    }

    // ============================================================
    // Data Fetchers — each fetches only what matters
    // ============================================================

    private async fetchTasks(): Promise<string> {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('tasks')
            .select('id, title, description, priority, status, due_date')
            .eq('user_id', this.userId)
            .neq('status', 'Done')
            .order('due_date', { ascending: true })
            .limit(30)

        if (error || !data?.length) return '### Tasks\nNo pending tasks found.'

        const grouped = { Todo: [] as any[], 'In Progress': [] as any[] }
        data.forEach(t => {
            if (grouped[t.status as keyof typeof grouped]) {
                grouped[t.status as keyof typeof grouped].push(t)
            }
        })

        let result = '### Tasks\n'
        for (const [status, tasks] of Object.entries(grouped)) {
            if (tasks.length > 0) {
                result += `\n**${status}** (${tasks.length}):\n`
                tasks.forEach((t: any) => {
                    const due = t.due_date ? ` — due ${new Date(t.due_date).toLocaleDateString()}` : ''
                    result += `- [${t.priority}] ${t.title}${due}\n`
                })
            }
        }
        return result
    }

    private async fetchTasksSummary(): Promise<string> {
        const supabase = await createClient()
        const { data } = await supabase
            .from('tasks')
            .select('status, priority')
            .eq('user_id', this.userId)

        if (!data?.length) return '### Tasks Summary\nNo tasks yet.'

        const total = data.length
        const done = data.filter(t => t.status === 'Done').length
        const inProgress = data.filter(t => t.status === 'In Progress').length
        const todo = data.filter(t => t.status === 'Todo').length
        const urgent = data.filter(t => t.priority === 'Urgent').length

        return `### Tasks Summary
- Total: ${total} tasks
- Done: ${done} | In Progress: ${inProgress} | Todo: ${todo}
- Urgent tasks: ${urgent}`
    }

    private async fetchHabits(): Promise<string> {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('habits')
            .select('id, name, frequency')
            .eq('user_id', this.userId)
            .order('created_at', { ascending: false })

        if (error || !data?.length) return '### Habits\nNo habits created yet.'

        return `### Habits (${data.length} total)\n` +
            data.map(h => `- ${h.name} (${h.frequency})`).join('\n')
    }

    private async fetchHabitLogsToday(): Promise<string> {
        const supabase = await createClient()
        const today = new Date().toISOString().split('T')[0]

        const { data: habits } = await supabase
            .from('habits')
            .select('id, name')
            .eq('user_id', this.userId)

        if (!habits?.length) return ''

        const { data: logs } = await supabase
            .from('habit_logs')
            .select('habit_id, status')
            .in('habit_id', habits.map(h => h.id))
            .eq('date', today)

        const completedIds = new Set(
            logs?.filter(l => l.status).map(l => l.habit_id) || []
        )

        const completed = habits.filter(h => completedIds.has(h.id)).map(h => h.name)
        const pending = habits.filter(h => !completedIds.has(h.id)).map(h => h.name)

        return `### Today's Habit Status
- ✅ Completed (${completed.length}): ${completed.join(', ') || 'none'}
- ⏳ Pending (${pending.length}): ${pending.join(', ') || 'none'}`
    }

    private async fetchHabitsSummary(): Promise<string> {
        const supabase = await createClient()
        const { data: habits } = await supabase
            .from('habits')
            .select('id, name')
            .eq('user_id', this.userId)

        if (!habits?.length) return '### Habits\nNo habits yet.'

        // Last 7 days logs
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: logs } = await supabase
            .from('habit_logs')
            .select('habit_id, status')
            .in('habit_id', habits.map(h => h.id))
            .gte('date', sevenDaysAgo.toISOString().split('T')[0])
            .eq('status', true)

        const logCount = logs?.length || 0

        return `### Habits Summary
- Total habits: ${habits.length}
- Completions in last 7 days: ${logCount}`
    }

    private async fetchGoals(): Promise<string> {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('goals')
            .select('id, title, type, target_value, current_value, unit, deadline')
            .eq('user_id', this.userId)
            .order('deadline', { ascending: true })

        if (error || !data?.length) return '### Goals\nNo goals set yet.'

        return '### Goals\n' + data.map(g => {
            const pct = g.target_value > 0
                ? Math.round((g.current_value / g.target_value) * 100)
                : 0
            const deadline = g.deadline ? ` — deadline ${new Date(g.deadline).toLocaleDateString()}` : ''
            return `- **${g.title}** [${g.type}]: ${g.current_value}/${g.target_value} ${g.unit} (${pct}%)${deadline}`
        }).join('\n')
    }

    private async fetchGoalsSummary(): Promise<string> {
        const supabase = await createClient()
        const { data } = await supabase
            .from('goals')
            .select('type, target_value, current_value')
            .eq('user_id', this.userId)

        if (!data?.length) return '### Goals\nNo goals yet.'

        const completed = data.filter(g => g.current_value >= g.target_value).length
        return `### Goals Summary
- Total goals: ${data.length}
- Completed: ${completed} | In progress: ${data.length - completed}`
    }

    private async fetchTransactionsThisMonth(): Promise<string> {
        const supabase = await createClient()
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const { data, error } = await supabase
            .from('transactions')
            .select('type, amount, category_name, description, date')
            .eq('user_id', this.userId)
            .gte('date', firstDay)
            .order('date', { ascending: false })
            .limit(50)

        if (error || !data?.length) return '### Finances\nNo transactions this month.'

        const income = data.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount), 0)
        const expense = data.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0)

        const recentLines = data.slice(0, 10).map(t =>
            `- ${t.type === 'Income' ? '↑' : '↓'} ₹${Number(t.amount).toLocaleString()} — ${t.category_name || 'Uncategorized'} ${t.description ? `(${t.description})` : ''}`
        )

        return `### Finances — This Month
- Total Income: ₹${income.toLocaleString()}
- Total Expenses: ₹${expense.toLocaleString()}
- Net: ₹${(income - expense).toLocaleString()}

**Recent Transactions:**
${recentLines.join('\n')}`
    }

    private async fetchTransactionsSummary(): Promise<string> {
        const supabase = await createClient()
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const { data } = await supabase
            .from('transactions')
            .select('type, amount')
            .eq('user_id', this.userId)
            .gte('date', firstDay)

        if (!data?.length) return '### Finances\nNo data this month.'

        const income = data.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount), 0)
        const expense = data.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0)

        return `### Finances Summary (This Month)
- Income: ₹${income.toLocaleString()} | Expenses: ₹${expense.toLocaleString()} | Net: ₹${(income - expense).toLocaleString()}`
    }

    private async fetchCategories(): Promise<string> {
        const supabase = await createClient()
        const { data } = await supabase
            .from('categories')
            .select('name, type')
            .eq('user_id', this.userId)

        if (!data?.length) return ''

        return `### Finance Categories\n` +
            data.map(c => `- ${c.name} (${c.type})`).join('\n')
    }

    private async fetchRecentNotes(): Promise<string> {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('notes')
            .select('title, content, created_at')
            .eq('user_id', this.userId)
            .order('created_at', { ascending: false })
            .limit(10)

        if (error || !data?.length) return '### Notes\nNo notes written yet.'

        return '### Recent Notes\n' + data.map(n => {
            const preview = (n.content || '').slice(0, 100).replace(/\n/g, ' ')
            const date = new Date(n.created_at).toLocaleDateString()
            return `- **${n.title}** (${date}): ${preview}${(n.content || '').length > 100 ? '...' : ''}`
        }).join('\n')
    }

    private async fetchRecentResources(): Promise<string> {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('resources')
            .select('title, type, tags, summary')
            .eq('user_id', this.userId)
            .order('created_at', { ascending: false })
            .limit(10)

        if (error || !data?.length) return '### Resources\nNo resources saved yet.'

        return '### Recent Resources\n' + data.map(r => {
            const tags = r.tags?.length ? ` [${r.tags.join(', ')}]` : ''
            return `- **${r.title}** (${r.type})${tags}`
        }).join('\n')
    }

    private async fetchPaths(): Promise<string> {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('paths')
            .select('title, progress')
            .eq('user_id', this.userId)
            .order('created_at', { ascending: false })

        if (error || !data?.length) return '### Learning Paths\nNo learning paths created yet.'

        return '### Learning Paths\n' + data.map(p => {
            const pct = Math.round((p.progress || 0) * 100)
            return `- **${p.title}**: ${pct}% complete`
        }).join('\n')
    }

    private async fetchUserProfile(): Promise<{ name: string; email: string } | null> {
        const supabase = await createClient()
        const { data } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', this.userId)
            .single()

        return data
    }
}
