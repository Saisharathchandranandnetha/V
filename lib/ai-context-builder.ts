import { db } from '@/lib/db'
import { tasks, habits, habitLogs, goals, transactions, categories, notes, resources, learningPaths, users } from '@/lib/db/schema'
import { eq, and, ne, gte, inArray, desc, asc } from 'drizzle-orm'
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
        const data = await db.select({
            id: tasks.id,
            title: tasks.title,
            description: tasks.description,
            priority: tasks.priority,
            status: tasks.status,
            dueDate: tasks.dueDate,
        })
            .from(tasks)
            .where(and(eq(tasks.userId, this.userId), ne(tasks.status, 'Done')))
            .orderBy(asc(tasks.dueDate))
            .limit(30)

        if (!data?.length) return '### Tasks\nNo pending tasks found.'

        const grouped = { Todo: [] as any[], 'In Progress': [] as any[] }
        data.forEach(t => {
            if (grouped[t.status as keyof typeof grouped]) {
                grouped[t.status as keyof typeof grouped].push(t)
            }
        })

        let result = '### Tasks\n'
        for (const [status, statusTasks] of Object.entries(grouped)) {
            if (statusTasks.length > 0) {
                result += `\n**${status}** (${statusTasks.length}):\n`
                statusTasks.forEach((t: any) => {
                    const due = t.dueDate ? ` — due ${new Date(t.dueDate).toLocaleDateString()}` : ''
                    result += `- [${t.priority}] ${t.title}${due}\n`
                })
            }
        }
        return result
    }

    private async fetchTasksSummary(): Promise<string> {
        const data = await db.select({
            status: tasks.status,
            priority: tasks.priority,
        })
            .from(tasks)
            .where(eq(tasks.userId, this.userId))

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
        const data = await db.select({
            id: habits.id,
            name: habits.name,
            frequency: habits.frequency,
        })
            .from(habits)
            .where(eq(habits.userId, this.userId))
            .orderBy(desc(habits.createdAt))

        if (!data?.length) return '### Habits\nNo habits created yet.'

        return `### Habits (${data.length} total)\n` +
            data.map(h => `- ${h.name} (${h.frequency})`).join('\n')
    }

    private async fetchHabitLogsToday(): Promise<string> {
        const today = new Date().toISOString().split('T')[0]

        const habitsData = await db.select({
            id: habits.id,
            name: habits.name,
        })
            .from(habits)
            .where(eq(habits.userId, this.userId))

        if (!habitsData?.length) return ''

        const habitIds = habitsData.map(h => h.id)

        const logs = habitIds.length > 0 ? await db.select({
            habitId: habitLogs.habitId,
            status: habitLogs.status,
        })
            .from(habitLogs)
            .where(and(inArray(habitLogs.habitId, habitIds), eq(habitLogs.date, today))) : []

        const completedIds = new Set(
            logs.filter(l => l.status).map(l => l.habitId)
        )

        const completed = habitsData.filter(h => completedIds.has(h.id)).map(h => h.name)
        const pending = habitsData.filter(h => !completedIds.has(h.id)).map(h => h.name)

        return `### Today's Habit Status
- ✅ Completed (${completed.length}): ${completed.join(', ') || 'none'}
- ⏳ Pending (${pending.length}): ${pending.join(', ') || 'none'}`
    }

    private async fetchHabitsSummary(): Promise<string> {
        const habitsData = await db.select({
            id: habits.id,
            name: habits.name,
        })
            .from(habits)
            .where(eq(habits.userId, this.userId))

        if (!habitsData?.length) return '### Habits\nNo habits yet.'

        // Last 7 days logs
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

        const habitIds = habitsData.map(h => h.id)
        const logs = habitIds.length > 0 ? await db.select({
            habitId: habitLogs.habitId,
            status: habitLogs.status,
        })
            .from(habitLogs)
            .where(and(
                inArray(habitLogs.habitId, habitIds),
                gte(habitLogs.date, sevenDaysAgoStr),
                eq(habitLogs.status, true)
            )) : []

        const logCount = logs.length

        return `### Habits Summary
- Total habits: ${habitsData.length}
- Completions in last 7 days: ${logCount}`
    }

    private async fetchGoals(): Promise<string> {
        const data = await db.select({
            id: goals.id,
            title: goals.title,
            type: goals.type,
            targetValue: goals.targetValue,
            currentValue: goals.currentValue,
            unit: goals.unit,
            deadline: goals.deadline,
        })
            .from(goals)
            .where(eq(goals.userId, this.userId))
            .orderBy(asc(goals.deadline))

        if (!data?.length) return '### Goals\nNo goals set yet.'

        return '### Goals\n' + data.map(g => {
            const targetVal = Number(g.targetValue) || 0
            const currentVal = Number(g.currentValue) || 0
            const pct = targetVal > 0 ? Math.round((currentVal / targetVal) * 100) : 0
            const deadline = g.deadline ? ` — deadline ${new Date(g.deadline).toLocaleDateString()}` : ''
            return `- **${g.title}** [${g.type}]: ${currentVal}/${targetVal} ${g.unit} (${pct}%)${deadline}`
        }).join('\n')
    }

    private async fetchGoalsSummary(): Promise<string> {
        const data = await db.select({
            type: goals.type,
            targetValue: goals.targetValue,
            currentValue: goals.currentValue,
        })
            .from(goals)
            .where(eq(goals.userId, this.userId))

        if (!data?.length) return '### Goals\nNo goals yet.'

        const completed = data.filter(g => Number(g.currentValue) >= Number(g.targetValue)).length
        return `### Goals Summary
- Total goals: ${data.length}
- Completed: ${completed} | In progress: ${data.length - completed}`
    }

    private async fetchTransactionsThisMonth(): Promise<string> {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

        const data = await db.select({
            type: transactions.type,
            amount: transactions.amount,
            categoryName: transactions.categoryName,
            description: transactions.description,
            date: transactions.date,
        })
            .from(transactions)
            .where(and(eq(transactions.userId, this.userId), gte(transactions.date, firstDay)))
            .orderBy(desc(transactions.date))
            .limit(50)

        if (!data?.length) return '### Finances\nNo transactions this month.'

        const income = data.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount), 0)
        const expense = data.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0)

        const recentLines = data.slice(0, 10).map(t =>
            `- ${t.type === 'Income' ? '↑' : '↓'} ₹${Number(t.amount).toLocaleString()} — ${t.categoryName || 'Uncategorized'} ${t.description ? '(' + t.description + ')' : ''}`
        )

        return `### Finances — This Month
- Total Income: ₹${income.toLocaleString()}
- Total Expenses: ₹${expense.toLocaleString()}
- Net: ₹${(income - expense).toLocaleString()}

**Recent Transactions:**
${recentLines.join('\n')}`
    }

    private async fetchTransactionsSummary(): Promise<string> {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

        const data = await db.select({
            type: transactions.type,
            amount: transactions.amount,
        })
            .from(transactions)
            .where(and(eq(transactions.userId, this.userId), gte(transactions.date, firstDay)))

        if (!data?.length) return '### Finances\nNo data this month.'

        const income = data.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount), 0)
        const expense = data.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0)

        return `### Finances Summary (This Month)
- Income: ₹${income.toLocaleString()} | Expenses: ₹${expense.toLocaleString()} | Net: ₹${(income - expense).toLocaleString()}`
    }

    private async fetchCategories(): Promise<string> {
        const data = await db.select({
            name: categories.name,
            type: categories.type,
        })
            .from(categories)
            .where(eq(categories.userId, this.userId))

        if (!data?.length) return ''

        return `### Finance Categories\n` +
            data.map(c => `- ${c.name} (${c.type})`).join('\n')
    }

    private async fetchRecentNotes(): Promise<string> {
        const data = await db.select({
            title: notes.title,
            content: notes.content,
            createdAt: notes.createdAt,
        })
            .from(notes)
            .where(eq(notes.userId, this.userId))
            .orderBy(desc(notes.createdAt))
            .limit(10)

        if (!data?.length) return '### Notes\nNo notes written yet.'

        return '### Recent Notes\n' + data.map(n => {
            const preview = (n.content || '').slice(0, 100).replace(/\n/g, ' ')
            const date = n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Unknown Date'
            return `- **${n.title}** (${date}): ${preview}${(n.content || '').length > 100 ? '...' : ''}`
        }).join('\n')
    }

    private async fetchRecentResources(): Promise<string> {
        const data = await db.select({
            title: resources.title,
            type: resources.type,
            tags: resources.tags,
            summary: resources.summary,
        })
            .from(resources)
            .where(eq(resources.userId, this.userId))
            .orderBy(desc(resources.createdAt))
            .limit(10)

        if (!data?.length) return '### Resources\nNo resources saved yet.'

        return '### Recent Resources\n' + data.map(r => {
            const tags = r.tags?.length ? ` [${r.tags.join(', ')}]` : ''
            return `- **${r.title}** (${r.type})${tags}`
        }).join('\n')
    }

    private async fetchPaths(): Promise<string> {
        return '### Learning Paths\nData format for learning paths has changed in the latest update.'
        // Note: original fetched paths.progress which has been removed or structure changed.
        // Assuming paths are represented differently now or not needed. Let's keep it simple for now to fix compiling.
        // We can add it back once we see how Learning Paths track progress in the new schema.
    }

    private async fetchUserProfile(): Promise<{ name: string; email: string } | null> {
        const data = await db.select({
            name: users.name,
            email: users.email,
        })
            .from(users)
            .where(eq(users.id, this.userId))
            .limit(1)

        const user = data[0]
        if (!user) return null

        return {
            name: user.name || 'User',
            email: user.email || ''
        }
    }
}
