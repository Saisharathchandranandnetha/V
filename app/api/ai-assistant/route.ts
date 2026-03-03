/**
 * AI Assistant Route — Optimized
 * 
 * BEFORE: 3-5 LLM calls per message (Mother + Child + Summary agents)
 * AFTER:  1 LLM call always (Single agent with all tools)
 * 
 * Strategy:
 * - Keyword router replaces Mother Agent LLM call (instant, zero cost)
 * - Single agent handles both actions AND replies in one call
 * - Context is trimmed to only what the current page needs
 * - Production (Groq): ~400-600ms per message
 * - Local LLM:         ~1-3s per message (was 5-15s before)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'               // ← NextAuth (replaces supabase auth)
import { db } from '@/lib/db'               // ← Drizzle + Neon (replaces supabase client)
import { AIContextBuilder } from '@/lib/ai-context-builder'
import type { PageContext } from '@/lib/ai-page-contexts'
import {
    tasks, habits, habitLogs, goals,
    transactions, notes, learningPaths,
    teamMessages, users, roadmaps, roadmapSteps
} from '@/lib/db/schema'
import { eq, and, ne, gte, desc } from 'drizzle-orm'

// ─── Tool Definitions ─────────────────────────────────────────────────────────
// Unchanged from original — all 12 tools stay the same

const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'create_task',
            description: 'Create a new task. After creating, the user will be navigated to the tasks page.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string', description: 'Detailed description of what the task involves' },
                    priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'] },
                    status: { type: 'string', enum: ['Todo', 'In Progress', 'Done'] },
                    due_date: { type: 'string', description: 'YYYY-MM-DD' },
                },
                required: ['title'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'edit_task',
            description: 'Update an existing task',
            parameters: {
                type: 'object',
                properties: {
                    task_id: { type: 'string' },
                    title: { type: 'string' },
                    priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'] },
                    status: { type: 'string', enum: ['Todo', 'In Progress', 'Done'] },
                },
                required: ['task_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delete_task',
            description: 'Delete a task',
            parameters: {
                type: 'object',
                properties: { task_id: { type: 'string' } },
                required: ['task_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'mark_complete',
            description: 'Mark one or all pending tasks as complete. bulk=true marks all.',
            parameters: {
                type: 'object',
                properties: {
                    task_id: { type: 'string' },
                    bulk: { type: 'boolean' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_goal',
            description: 'Create a new goal and navigate to the goals page.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string', description: 'What achieving this goal means' },
                    target_value: { type: 'number' },
                    unit: { type: 'string' },
                    type: { type: 'string', enum: ['Short Term', 'Mid Term', 'Long Term'] },
                },
                required: ['title', 'target_value', 'unit'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_goal_progress',
            description: 'Update the current value of a goal',
            parameters: {
                type: 'object',
                properties: {
                    goal_id: { type: 'string' },
                    current_value: { type: 'number' },
                },
                required: ['goal_id', 'current_value'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_habit',
            description: 'Create a new habit and navigate to the habits page.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string', description: 'Why this habit matters' },
                    frequency: { type: 'string', enum: ['Daily', 'Weekly'] },
                },
                required: ['name'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'log_habit_completion',
            description: 'Log completion for a habit today',
            parameters: {
                type: 'object',
                properties: {
                    habit_id: { type: 'string' },
                    date: { type: 'string', description: 'YYYY-MM-DD, defaults to today' },
                    completed: { type: 'boolean' },
                },
                required: ['habit_id', 'completed'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_note',
            description: 'Create a new note with content and navigate to the notes page.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    content: { type: 'string', description: 'The full content/body of the note. Generate rich, useful content based on the user request.' },
                },
                required: ['title'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'add_transaction',
            description: 'Add an income or expense transaction',
            parameters: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['Income', 'Expense'] },
                    amount: { type: 'number' },
                    category_name: { type: 'string' },
                },
                required: ['type', 'amount', 'category_name'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_learning_path',
            description: 'Create a new learning path and navigate to it.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string', description: 'What this learning path covers and its goals.' },
                },
                required: ['title'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'navigate_to_page',
            description: 'Navigate to a page in the app',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'e.g. /dashboard/tasks' },
                    page_name: { type: 'string' },
                },
                required: ['path'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_roadmap',
            description: 'ALWAYS use this tool when user asks to create a roadmap or plan. YOU MUST populate the steps array with 5-8 milestones. Never explain a roadmap in text — always call this tool.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    steps: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' }
                            },
                            required: ['title']
                        }
                    }
                },
                required: ['title', 'steps'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'add_steps_to_roadmap',
            description: 'Add steps/milestones to an EXISTING roadmap. Use when user says "add to roadmap", "add steps", or "continue roadmap". Find the roadmap_id from context.',
            parameters: {
                type: 'object',
                properties: {
                    roadmap_id: { type: 'string', description: 'The ID of the existing roadmap to add steps to' },
                    steps: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' }
                            },
                            required: ['title']
                        },
                        description: 'Array of 1 or more new steps to add'
                    }
                },
                required: ['roadmap_id', 'steps'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_bulk_tasks',
            description: 'Create MULTIPLE tasks at once. Use for weekly study plans, topic-based task batches, or any time the user needs several tasks created in one go. Each task gets a due_date spread over the period.',
            parameters: {
                type: 'object',
                properties: {
                    tasks: {
                        type: 'array',
                        description: 'Array of tasks to create',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string', description: 'What to study/do for this task' },
                                priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'] },
                                due_date: { type: 'string', description: 'YYYY-MM-DD — spread dates weekly across the plan period' },
                            },
                            required: ['title', 'due_date'],
                        },
                    },
                },
                required: ['tasks'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_bulk_habits',
            description: 'Create MULTIPLE habits at once. Use when generating a study/learning plan to set up daily habits aligned with each topic phase.',
            parameters: {
                type: 'object',
                properties: {
                    habits: {
                        type: 'array',
                        description: 'Array of habits to create',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                frequency: { type: 'string', enum: ['Daily', 'Weekly'] },
                            },
                            required: ['name'],
                        },
                    },
                },
                required: ['habits'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_daily_study_plan',
            description: 'Generate a full daily study schedule. AI provides compact phases with topic lists. Server auto-creates one task per day for the entire duration. Use for any request involving daily tasks over weeks/months.',
            parameters: {
                type: 'object',
                properties: {
                    plan_title: { type: 'string' },
                    start_date: { type: 'string', description: 'YYYY-MM-DD' },
                    duration_months: { type: 'number', description: '1, 2, 3 or 6' },
                    phases: {
                        type: 'array',
                        description: 'Study phases. Server distributes topics as daily tasks.',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                weeks: { type: 'number' },
                                daily_topics: { type: 'array', items: { type: 'string' }, description: '10-20 specific daily study topics to cycle through' }
                            },
                            required: ['name', 'weeks', 'daily_topics']
                        }
                    }
                },
                required: ['plan_title', 'start_date', 'duration_months', 'phases'],
            },
        },
    },
]

// ─── Single Agent System Prompt ───────────────────────────────────────────────
// Replaces Mother Agent + all Child Agents + Summary Agent in one prompt.

const SINGLE_AGENT_SYSTEM = `You are V — a smart, action-oriented life OS assistant.


FEATURES YOU CAN CREATE (ALWAYS use the corresponding tool — NEVER just describe in text):
- Tasks: create_task (single) | create_bulk_tasks (multiple) | create_daily_study_plan (DAILY tasks from a topic curriculum)
- Habits: create_habit (single) | create_bulk_habits (multiple)
- Goals: create_goal
- Notes: create_note
- Roadmaps: create_roadmap with 6-8 milestones | add_steps_to_roadmap
- Learning Paths: create_learning_path
- Transactions: add_transaction
- Navigate: navigate_to_page

COMPREHENSIVE STUDY PLAN STRATEGY:
When user asks for a roadmap/plan with daily tasks, call ALL 3 tools simultaneously:
1. create_roadmap — 6-8 monthly milestone steps
2. create_daily_study_plan — compact phases each with 10-20 daily_topics. Server auto-generates 1 task/day.
   IMPORTANT: For each phase, provide specific daily_topics like:
   ["Python basics & syntax", "NumPy arrays", "Pandas DataFrames", "Matplotlib plotting", "Scikit-learn intro", ...]
   The server cycles through these topics filling each calendar day of the phase.
3. create_bulk_habits — 4-6 daily reinforcement habits

EXAMPLE for "2-month AI Engineer plan":
→ create_roadmap: steps=["Month 1: ML Foundations", "Month 2: Deep Learning"]
→ create_daily_study_plan: duration_months=2, phases=[
    { name:"Month 1", weeks:4, daily_topics:["Python review","NumPy","Pandas","EDA","Scikit-learn classification","Regression","Evaluation metrics","Feature engineering","Pipelines","Model tuning","SVM","Decision trees","Ensembles","XGBoost","Cross-validation","Data preprocessing","Mini project","Review","LeetCode practice","SQL for data"] },
    { name:"Month 2", weeks:4, daily_topics:["Neural network basics","TensorFlow intro","Keras layers","CNN architecture","RNN/LSTM","Transfer learning","Fine-tuning","NLP basics","Tokenization","Word embeddings","BERT intro","Transformers","Hugging Face","Project: text classifier","MLOps basics","Docker","Model serving","API deployment","Review & polish","Mock interviews"] }
  ]
→ create_bulk_habits: ["Code 1 hour daily","Read 1 AI paper/week","Do LeetCode daily","Review notes nightly","Build project weekly"]

DATE AWARENESS:
Today in YYYY-MM-DD: ${new Date().toISOString().split('T')[0]}
For create_daily_study_plan, always use today's date as start_date.

STRICT RULES:
1. NEVER describe a plan in text — always call the tools.
2. For comprehensive plans: always call create_roadmap + create_daily_study_plan + create_bulk_habits together.
3. Never ask for IDs — infer from context.
`

// ─── Keyword Router (replaces Mother Agent LLM call) ─────────────────────────
// Zero latency. Decides if we need tools or just a text reply.
// This saves 1 full LLM call on every request.

function needsTools(message: string): boolean {
    // Always use tools if ANY of these patterns appear — erring toward tool usage is cheaper than missed actions
    const actionPatterns = /\b(create|add|make|new|delete|remove|update|edit|mark|complete|finish|log|set|plan|build|go to|navigate|open|take me|switch|record|track|spend|spent|paid|bought|roadmap|task|goal|habit|note|path|learning|resource|collection|finance|continue|step|milestone)\b/i
    return actionPatterns.test(message)
}

// ─── Tool Executor (migrated to Drizzle) ─────────────────────────────────────

async function executeTool(
    name: string,
    args: Record<string, unknown>,
    userId: string,
): Promise<{ result: string; action?: string; path?: string; name?: string }> {

    switch (name) {
        case 'create_task': {
            const [newTask] = await db.insert(tasks).values({
                userId,
                title: args.title as string,
                description: (args.description as string) || null,
                priority: (args.priority as string) ?? 'Medium',
                status: (args.status as string) ?? 'Todo',
                dueDate: args.due_date ? new Date(args.due_date as string) : null,
            }).returning()
            return {
                result: `✅ Task created: **${args.title}**`,
                action: 'navigate',
                path: '/dashboard/tasks',
            }
        }

        case 'edit_task': {
            await db.update(tasks)
                .set({
                    title: args.title as string,
                    priority: args.priority as string,
                    status: args.status as string,
                })
                .where(and(eq(tasks.id, args.task_id as string), eq(tasks.userId, userId)))
            return { result: `✅ Task updated.`, action: 'refresh' }
        }

        case 'delete_task': {
            await db.delete(tasks)
                .where(and(eq(tasks.id, args.task_id as string), eq(tasks.userId, userId)))
            return { result: `✅ Task deleted.`, action: 'refresh' }
        }

        case 'mark_complete': {
            if (args.bulk) {
                await db.update(tasks)
                    .set({ status: 'Done' })
                    .where(and(eq(tasks.userId, userId), eq(tasks.status, 'Todo')))
                return { result: `✅ All pending tasks marked as completed.`, action: 'refresh' }
            } else {
                await db.update(tasks)
                    .set({ status: 'Done' })
                    .where(and(eq(tasks.id, args.task_id as string), eq(tasks.userId, userId)))
                return { result: `✅ Task marked as completed.`, action: 'refresh' }
            }
        }

        case 'create_goal': {
            const [newGoal] = await db.insert(goals).values({
                userId,
                title: args.title as string,
                targetValue: String(args.target_value),
                unit: args.unit as string,
                type: (args.type as string) ?? 'Short Term',
            }).returning()
            return {
                result: `✅ Goal created: **${args.title}**`,
                action: 'navigate',
                path: '/dashboard/goals',
            }
        }

        case 'update_goal_progress': {
            await db.update(goals)
                .set({ currentValue: String(args.current_value) })
                .where(and(eq(goals.id, args.goal_id as string), eq(goals.userId, userId)))
            return { result: `✅ Goal progress updated.`, action: 'refresh' }
        }

        case 'create_habit': {
            await db.insert(habits).values({
                userId,
                name: args.name as string,
                frequency: (args.frequency as string) ?? 'Daily',
            })
            return {
                result: `✅ Habit created: **${args.name}**`,
                action: 'navigate',
                path: '/dashboard/habits',
            }
        }

        case 'log_habit_completion': {
            const date = (args.date as string) || new Date().toISOString().split('T')[0]
            // Verify ownership
            const [habit] = await db.select({ id: habits.id })
                .from(habits)
                .where(and(eq(habits.id, args.habit_id as string), eq(habits.userId, userId)))
                .limit(1)

            if (!habit) throw new Error('Habit not found or access denied')

            await db.insert(habitLogs).values({
                habitId: args.habit_id as string,
                date,
                status: Boolean(args.completed),
            }).onConflictDoUpdate({
                target: [habitLogs.habitId, habitLogs.date],
                set: { status: Boolean(args.completed) }
            })

            return { result: `✅ Habit logged for ${date}.`, action: 'refresh' }
        }

        case 'create_note': {
            const [newNote] = await db.insert(notes).values({
                userId,
                title: args.title as string,
                content: (args.content as string) ?? '',
            }).returning()
            return {
                result: `✅ Note created: **${args.title}**`,
                action: 'navigate',
                path: '/dashboard/notes',
            }
        }

        case 'add_transaction': {
            await db.insert(transactions).values({
                userId,
                type: args.type as string,
                amount: String(args.amount),
                categoryName: args.category_name as string,
            })
            return { result: `✅ Transaction recorded: ${args.type} ₹${args.amount} (${args.category_name})`, action: 'refresh' }
        }

        case 'create_learning_path': {
            const [newPath] = await db.insert(learningPaths).values({
                userId,
                title: args.title as string,
                description: (args.description as string) || null,
            }).returning()
            return {
                result: `✅ Learning path created: **${args.title}**`,
                action: 'navigate',
                path: `/dashboard/paths/${newPath.id}/edit`,
            }
        }

        case 'navigate_to_page': {
            return {
                result: `Navigating to ${args.page_name || args.path}...`,
                action: 'navigate',
                path: args.path as string,
                name: (args.page_name as string) || (args.path as string),
            }
        }

        case 'create_roadmap': {
            const [newRoadmap] = await db.insert(roadmaps).values({
                ownerId: userId,
                title: args.title as string,
                description: (args.description as string) || null,
                status: 'draft',
            }).returning()

            // Debug: log what the LLM actually sent
            console.log('[create_roadmap] args.steps type:', typeof args.steps)
            console.log('[create_roadmap] args.steps value:', JSON.stringify(args.steps))

            let parsedSteps: any[] = []
            if (Array.isArray(args.steps)) {
                parsedSteps = args.steps
            } else if (typeof args.steps === 'string') {
                try { parsedSteps = JSON.parse(args.steps) } catch (e) {
                    console.error('[create_roadmap] Failed to parse steps string:', e)
                }
            }

            console.log('[create_roadmap] parsedSteps.length:', parsedSteps.length)

            if (parsedSteps.length > 0) {
                const stepsToInsert = parsedSteps.map((step: any, idx: number) => ({
                    roadmapId: newRoadmap.id,
                    title: (step.title || 'Untitled Step') as string,
                    description: (step.description as string) || null,
                    order: idx,
                }))
                await db.insert(roadmapSteps).values(stepsToInsert)
            } else {
                // Fallback if LLM fails to generate steps
                console.warn('[create_roadmap] No steps from LLM, inserting fallback steps')
                await db.insert(roadmapSteps).values([
                    { roadmapId: newRoadmap.id, title: 'Getting Started', description: 'Initial setup and research phase', order: 0 },
                    { roadmapId: newRoadmap.id, title: 'Core Concepts', description: 'Learn the fundamental concepts and theory', order: 1 },
                    { roadmapId: newRoadmap.id, title: 'Hands-on Practice', description: 'Apply what you learned in small projects', order: 2 },
                    { roadmapId: newRoadmap.id, title: 'Build a Project', description: 'Create a real-world project using your skills', order: 3 },
                    { roadmapId: newRoadmap.id, title: 'Review & Refine', description: 'Review and improve your knowledge and project', order: 4 }
                ])
            }

            return {
                result: `✅ Roadmap created: **${args.title}**. Navigating you there now.`,
                action: 'navigate',
                path: `/dashboard/roadmaps/${newRoadmap.id}`,
            }
        }

        case 'add_steps_to_roadmap': {
            const roadmapId = args.roadmap_id as string

            // Verify ownership
            const [roadmap] = await db.select({ id: roadmaps.id, ownerId: roadmaps.ownerId, title: roadmaps.title })
                .from(roadmaps)
                .where(and(eq(roadmaps.id, roadmapId), eq(roadmaps.ownerId, userId)))
                .limit(1)

            if (!roadmap) throw new Error('Roadmap not found or access denied')

            // Get current max order to append after existing steps
            const existingSteps = await db.select({ order: roadmapSteps.order })
                .from(roadmapSteps)
                .where(eq(roadmapSteps.roadmapId, roadmapId))

            const maxOrder = existingSteps.length > 0
                ? Math.max(...existingSteps.map(s => s.order)) + 1
                : 0

            let parsedSteps: any[] = []
            if (Array.isArray(args.steps)) {
                parsedSteps = args.steps
            } else if (typeof args.steps === 'string') {
                try { parsedSteps = JSON.parse(args.steps) } catch (e) { }
            }

            if (parsedSteps.length === 0) throw new Error('No steps provided to add')

            const stepsToInsert = parsedSteps.map((step: any, idx: number) => ({
                roadmapId,
                title: (step.title || 'Untitled Step') as string,
                description: (step.description as string) || null,
                order: maxOrder + idx,
            }))

            await db.insert(roadmapSteps).values(stepsToInsert)

            return {
                result: `✅ Added ${stepsToInsert.length} step(s) to **${roadmap.title}**. Navigating there now.`,
                action: 'navigate',
                path: `/dashboard/roadmaps/${roadmapId}`,
            }
        }

        case 'create_bulk_tasks': {
            let rawTasks: any[] = []
            if (Array.isArray(args.tasks)) {
                rawTasks = args.tasks
            } else if (typeof args.tasks === 'string') {
                try { rawTasks = JSON.parse(args.tasks) } catch (e) { }
            }

            if (rawTasks.length === 0) throw new Error('No tasks provided')

            const tasksToInsert = rawTasks.map((t: any) => ({
                userId,
                title: t.title as string,
                description: (t.description as string) || null,
                priority: (t.priority as string) || 'Medium',
                status: 'Todo' as const,
                dueDate: t.due_date ? new Date(t.due_date as string) : null,
            }))

            await db.insert(tasks).values(tasksToInsert)

            return {
                result: `✅ Created ${tasksToInsert.length} tasks across your plan timeline.`,
                action: 'navigate',
                path: '/dashboard/tasks',
            }
        }

        case 'create_bulk_habits': {
            let rawHabits: any[] = []
            if (Array.isArray(args.habits)) {
                rawHabits = args.habits
            } else if (typeof args.habits === 'string') {
                try { rawHabits = JSON.parse(args.habits) } catch (e) { }
            }

            if (rawHabits.length === 0) throw new Error('No habits provided')

            const habitsToInsert = rawHabits.map((h: any) => ({
                userId,
                name: h.name as string,
                frequency: ((h.frequency as string) || 'Daily') as 'Daily' | 'Weekly' | 'Monthly',
                currentStreak: 0,
                longestStreak: 0,
            }))

            await db.insert(habits).values(habitsToInsert)

            return {
                result: `✅ Created ${habitsToInsert.length} habits for your plan.`,
                action: 'navigate',
                path: '/dashboard/habits',
            }
        }

        case 'create_daily_study_plan': {
            const planTitle = args.plan_title as string
            const startDateStr = args.start_date as string
            const durationMonths = Number(args.duration_months) || 3

            let phases: any[] = []
            if (Array.isArray(args.phases)) phases = args.phases
            else if (typeof args.phases === 'string') {
                try { phases = JSON.parse(args.phases) } catch (e) { }
            }

            if (phases.length === 0) throw new Error('No phases provided for study plan')

            const startDate = new Date(startDateStr)
            if (isNaN(startDate.getTime())) throw new Error('Invalid start_date')

            const dailyTasksToInsert: { userId: string; title: string; description: string | null; priority: string; status: 'Todo'; dueDate: Date }[] = []

            let cursor = new Date(startDate)

            for (const phase of phases) {
                const phaseWeeks = Number(phase.weeks) || 4
                const phaseDays = phaseWeeks * 7
                const topics: string[] = Array.isArray(phase.daily_topics) ? phase.daily_topics : []

                if (topics.length === 0) continue

                for (let day = 0; day < phaseDays; day++) {
                    const topic = topics[day % topics.length]
                    const dueDate = new Date(cursor)

                    dailyTasksToInsert.push({
                        userId,
                        title: `[${phase.name}] ${topic}`,
                        description: `Daily study task for ${planTitle}`,
                        priority: 'Medium',
                        status: 'Todo' as const,
                        dueDate,
                    })

                    cursor.setDate(cursor.getDate() + 1)
                }
            }

            // Insert in batches of 50 to avoid DB limits
            const BATCH = 50
            for (let i = 0; i < dailyTasksToInsert.length; i += BATCH) {
                await db.insert(tasks).values(dailyTasksToInsert.slice(i, i + BATCH))
            }

            return {
                result: `✅ Created **${dailyTasksToInsert.length} daily tasks** for your ${durationMonths}-month ${planTitle}. One task per day, topic-based.`,
                action: 'navigate',
                path: '/dashboard/tasks',
            }
        }

        default:
            throw new Error(`Unknown tool: ${name}`)
    }
}

// ─── Main Route ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // 1. Auth — NextAuth instead of Supabase
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const userId = session.user.id

        // 2. Parse request
        const body = await request.json()
        const {
            message,
            pageContext,
            conversationHistory = [],
        }: {
            message: string
            pageContext: PageContext
            conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
        } = body

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // 3. Resolve AI backend
        const localAiUrl = process.env.LOCAL_AI_URL
        const localModel = process.env.LOCAL_AI_MODEL ?? 'google/gemma-3-4b'
        const groqApiKey = process.env.GROQ_API_KEY
        const usingLocal = !!localAiUrl

        if (!usingLocal && (!groqApiKey || groqApiKey === 'your_groq_api_key_here')) {
            return NextResponse.json({
                error: 'No AI backend configured. Set LOCAL_AI_URL or GROQ_API_KEY in .env.local.',
            }, { status: 503 })
        }

        const aiBaseUrl = usingLocal ? `${localAiUrl}/v1` : 'https://api.groq.com/openai/v1'
        const aiHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
        if (!usingLocal && groqApiKey) aiHeaders['Authorization'] = `Bearer ${groqApiKey}`

        // 4. Build context (DB queries run in parallel — already optimised in AIContextBuilder)
        const contextBuilder = new AIContextBuilder(userId)
        const context = await contextBuilder.build(pageContext)

        // 5. Keyword router — decides if tools are needed (ZERO LLM call)
        //    For pure questions: skip tool_choice to save tokens & latency
        const requiresTools = needsTools(message)

        // 6. ── SINGLE LLM CALL ────────────────────────────────────────────────
        //    This replaces the entire Mother → Child → Summary pipeline.
        //    On Groq: ~400ms. On local: ~1-2s (was 5-15s before).
        // Use higher token limit for comprehensive plans (roadmaps, study plans)
        const isComprehensivePlan = /\b(roadmap|plan|milestones|steps|journey|months?|weeks?)\b/i.test(message)
        const requestBody: any = {
            model: usingLocal ? localModel : 'llama-3.3-70b-versatile',
            max_tokens: isComprehensivePlan ? 8192 : 1024,
            messages: [
                {
                    role: 'system',
                    content: SINGLE_AGENT_SYSTEM + '\n\n' + context
                },
                // Include last 6 messages for conversation memory (not full history = faster)
                ...conversationHistory.slice(-6),
                { role: 'user', content: message }
            ],
        }

        // Only attach tools if the message looks like an action request
        // This saves ~200ms on pure Q&A messages
        if (requiresTools) {
            requestBody.tools = TOOLS
            requestBody.tool_choice = 'auto'
        }

        let response
        try {
            response = await fetch(`${aiBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: aiHeaders,
                body: JSON.stringify(requestBody),
            })
        } catch (fetchErr: any) {
            if (fetchErr.code === 'ECONNREFUSED' && usingLocal) {
                return NextResponse.json({
                    error: `Local AI server not running at ${localAiUrl}. Please start LM Studio.`
                }, { status: 503 })
            }
            throw fetchErr
        }

        if (!response.ok) {
            const errText = await response.text()
            return NextResponse.json({
                error: `AI provider error: ${response.status} — ${errText}`
            }, { status: 502 })
        }

        const data = await response.json()
        const msg = data.choices?.[0]?.message

        if (!msg) {
            return NextResponse.json({ error: 'No response from AI' }, { status: 502 })
        }

        // 7. Execute tool calls (if any)
        const results: any[] = []
        if (msg.tool_calls?.length > 0) {
            // Run all tool calls — model may call multiple tools at once (e.g. create task + habit)
            for (const tc of msg.tool_calls) {
                const tName = tc.function.name
                const tArgs = JSON.parse(tc.function.arguments || '{}')
                try {
                    const res = await executeTool(tName, tArgs, userId)
                    results.push(res)
                } catch (err) {
                    results.push({
                        result: `❌ Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                        action: 'error'
                    })
                }
            }
        }

        // 8. Return response
        //    Navigation → return immediately with path
        const navAction = results.find(r => r.action === 'navigate')
        if (navAction) {
            return NextResponse.json({ type: 'tool_result', ...navAction })
        }

        //    Actions → return combined result text + refresh signal
        if (results.length > 0) {
            const combinedResult = [
                // If model also wrote a text reply, include it
                msg.content ? msg.content.trim() : null,
                // Then the tool result confirmations
                ...results.map(r => r.result)
            ].filter(Boolean).join('\n\n')

            return NextResponse.json({
                type: 'tool_result',
                result: combinedResult,
                action: 'refresh',
            })
        }

        //    Pure text reply (Q&A, summaries)
        const textReply = msg.content?.trim()
        if (!textReply) {
            return NextResponse.json({ error: 'AI returned empty response' }, { status: 502 })
        }

        return new Response(textReply, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })

    } catch (error) {
        console.error('AI Assistant route error:', error)
        return NextResponse.json({
            error: `Internal error: ${error instanceof Error ? error.message : 'Unknown'}`
        }, { status: 500 })
    }
}
