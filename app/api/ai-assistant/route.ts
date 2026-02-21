import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AIContextBuilder } from '@/lib/ai-context-builder'
import type { PageContext } from '@/lib/ai-page-contexts'
import { CHILD_AGENTS, MOTHER_AGENT_SYSTEM } from '@/lib/agents'

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'create_task',
            description: 'Create a new task',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
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
                properties: {
                    task_id: { type: 'string' },
                },
                required: ['task_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'mark_complete',
            description: 'Mark one or all pending tasks as complete. If user says "all tasks" set bulk=true. Never ask user for task IDs — fetch them automatically from contest.',
            parameters: {
                type: 'object',
                properties: {
                    task_id: { type: 'string', description: 'single task ID — optional' },
                    bulk: { type: 'boolean', description: 'true = mark ALL pending tasks complete' }
                },
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_goal',
            description: 'Create a new goal',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
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
            description: 'Create a new habit',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
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
            description: 'Log completion for a habit for a specific date',
            parameters: {
                type: 'object',
                properties: {
                    habit_id: { type: 'string' },
                    date: { type: 'string', description: 'YYYY-MM-DD' },
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
            description: 'Create a new note',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                },
                required: ['title'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'add_transaction',
            description: 'Add an income or expense',
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
            description: 'Create a new learning path',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                },
                required: ['title'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'navigate_to_page',
            description: 'Navigate to a page',
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
]

// ─── Tool Executor ────────────────────────────────────────────────────────────

async function executeTool(
    name: string,
    args: Record<string, unknown>,
    userId: string,
    supabase: any
): Promise<{ result: string; action?: string; path?: string; name?: string }> {

    switch (name) {
        case 'create_task': {
            const { error } = await supabase.from('tasks').insert({
                user_id: userId,
                title: args.title,
                priority: args.priority ?? 'Medium',
                status: args.status ?? 'Todo',
                due_date: args.due_date ?? null,
            })
            if (error) throw new Error(`Failed to create task: ${error.message}`)
            return { result: `✅ Task created: **${args.title}**`, action: 'refresh' }
        }

        case 'edit_task': {
            const { error } = await supabase
                .from('tasks')
                .update({
                    title: args.title,
                    priority: args.priority,
                    status: args.status,
                })
                .eq('id', args.task_id)
                .eq('user_id', userId)
            if (error) throw new Error(`Failed to update task: ${error.message}`)
            return { result: `✅ Task updated.`, action: 'refresh' }
        }

        case 'delete_task': {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', args.task_id)
                .eq('user_id', userId)
            if (error) throw new Error(`Failed to delete task: ${error.message}`)
            return { result: `✅ Task deleted.`, action: 'refresh' }
        }

        case 'mark_complete': {
            if (args.bulk) {
                const { error } = await supabase
                    .from('tasks')
                    .update({ status: 'Done', completed_at: new Date().toISOString() })
                    .eq('user_id', userId)
                    .eq('status', 'Todo')
                if (error) throw new Error(`Failed to complete all tasks: ${error.message}`)
                return { result: `✅ All pending tasks marked as completed.`, action: 'refresh' }
            } else {
                const { error } = await supabase
                    .from('tasks')
                    .update({ status: 'Done', completed_at: new Date().toISOString() })
                    .eq('id', args.task_id)
                    .eq('user_id', userId)
                if (error) throw new Error(`Failed to complete task: ${error.message}`)
                return { result: `✅ Task marked as completed.`, action: 'refresh' }
            }
        }

        case 'create_goal': {
            const { error } = await supabase.from('goals').insert({
                user_id: userId,
                title: args.title,
                target_value: args.target_value,
                unit: args.unit,
                type: args.type ?? 'Short Term',
            })
            if (error) throw new Error(`Failed to create goal: ${error.message}`)
            return { result: `✅ Goal created: **${args.title}**`, action: 'refresh' }
        }

        case 'update_goal_progress': {
            const { error } = await supabase
                .from('goals')
                .update({ current_value: args.current_value })
                .eq('id', args.goal_id)
                .eq('user_id', userId)
            if (error) throw new Error(`Failed to update goal: ${error.message}`)
            return { result: `✅ Goal progress updated.`, action: 'refresh' }
        }

        case 'create_habit': {
            const { error } = await supabase.from('habits').insert({
                user_id: userId,
                name: args.name,
                frequency: args.frequency ?? 'Daily',
            })
            if (error) throw new Error(`Failed to create habit: ${error.message}`)
            return { result: `✅ Habit created: **${args.name}**`, action: 'refresh' }
        }

        case 'log_habit_completion': {
            const date = args.date || new Date().toISOString().split('T')[0]
            // Verify ownership via join logic or check
            const { data: habit } = await supabase
                .from('habits')
                .select('id')
                .eq('id', args.habit_id)
                .eq('user_id', userId)
                .single()

            if (!habit) throw new Error('Habit not found or access denied')

            const { error } = await supabase
                .from('habit_logs')
                .upsert({
                    habit_id: args.habit_id,
                    date: date,
                    status: args.completed,
                }, { onConflict: 'habit_id,date' })

            if (error) throw new Error(`Failed to log habit: ${error.message}`)
            return { result: `✅ Habit logged for ${date}.`, action: 'refresh' }
        }

        case 'create_note': {
            const { error } = await supabase.from('notes').insert({
                user_id: userId,
                title: args.title,
                content: args.content ?? '',
            })
            if (error) throw new Error(`Failed to create note: ${error.message}`)
            return { result: `✅ Note created: **${args.title}**`, action: 'refresh' }
        }

        case 'add_transaction': {
            const { error } = await supabase.from('transactions').insert({
                user_id: userId,
                type: args.type,
                amount: args.amount,
                category_name: args.category_name,
            })
            if (error) throw new Error(`Failed to add transaction: ${error.message}`)
            return { result: `✅ Transaction recorded.`, action: 'refresh' }
        }

        case 'create_learning_path': {
            const { error } = await supabase.from('learning_paths').insert({
                user_id: userId,
                title: args.title,
            })
            if (error) throw new Error(`Failed to create learning path: ${error.message}`)
            return { result: `✅ Learning path created.`, action: 'refresh' }
        }

        case 'navigate_to_page': {
            return {
                result: `Navigating...`,
                action: 'navigate',
                path: args.path as string,
                name: (args.page_name as string) || (args.path as string)
            }
        }

        default:
            throw new Error(`Unknown tool: ${name}`)
    }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // 1. Auth check
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

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

        // 3. Resolve AI backend — local server OR Groq
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

        // -------------------------------------------------------------------------
        // STEP 1 — Mother Agent Decides Intent
        // -------------------------------------------------------------------------
        console.log('[AI] Calling Mother Agent for message:', message)
        const motherBody: any = {
            model: usingLocal ? localModel : 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: MOTHER_AGENT_SYSTEM + "\n\nIf the request is simple (one-off task, navigation, or basic finance), you may use the provided tools directly instead of delegating to agents." },
                { role: 'user', content: message }
            ],
            tools: TOOLS,
            tool_choice: 'auto'
        }

        // JSON mode is only officially supported on Groq for certain models
        // For local AI, we rely on the system prompt for now to avoid errors
        if (!usingLocal) {
            motherBody.response_format = { type: 'json_object' }
        }

        let intentResponse;
        try {
            intentResponse = await fetch(`${aiBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: aiHeaders,
                body: JSON.stringify(motherBody),
            })
        } catch (fetchErr: any) {
            console.error('[AI] Fetch error (Mother Agent):', fetchErr)
            if (fetchErr.code === 'ECONNREFUSED' && usingLocal) {
                return NextResponse.json({ error: `Local AI server not running at ${localAiUrl}. Please start LM Studio.` }, { status: 503 })
            }
            throw fetchErr
        }

        if (!intentResponse.ok) {
            const errText = await intentResponse.text()
            console.error('[AI] Mother Agent API error:', errText)
            return NextResponse.json({ error: `AI provider error: ${intentResponse.status} ${errText}` }, { status: 502 })
        }

        let intentData;
        try {
            intentData = await intentResponse.json()
        } catch (jsonErr) {
            console.error('[AI] Mother Agent returned invalid JSON:', await intentResponse.text())
            throw new Error('AI provider returned a non-JSON response.')
        }

        const motherMsg = intentData.choices?.[0]?.message
        const results: any[] = []

        // If Mother Agent chose to use tools directly
        if (motherMsg?.tool_calls?.length > 0) {
            console.log('[AI] Mother Agent executing directly via tools')
            for (const tc of motherMsg.tool_calls) {
                const tName = tc.function.name
                const tArgs = JSON.parse(tc.function.arguments || '{}')
                try {
                    const res = await executeTool(tName, tArgs, user.id, supabase)
                    results.push({ agent: 'mother', action: tName, ...res })
                } catch (err) {
                    console.error(`[AI] Mother tool execution error (${tName}):`, err)
                    results.push({ agent: 'mother', action: tName, error: err instanceof Error ? err.message : 'Unknown error' })
                }
            }
        }

        let rawContent = motherMsg?.content || '{}'

        // Robust JSON parsing: strip markdown backticks if present
        if (rawContent.includes('```json')) {
            rawContent = rawContent.split('```json')[1].split('```')[0].trim()
        } else if (rawContent.includes('```')) {
            rawContent = rawContent.split('```')[1].split('```')[0].trim()
        }

        let intent: any = {}
        try {
            intent = JSON.parse(rawContent)
        } catch (e) {
            console.error('[AI] Failed to parse Mother Agent intent JSON:', rawContent)
            intent = { agents: ['summary_agent'] } // Fallback
        }

        const agentsToRun = intent.agents || []
        console.log('[AI] Intent determined:', intent)

        // If Mother Agent used tools AND no further agents were requested, we can finish early
        const shouldSkipDelegation = results.length > 0 && agentsToRun.length === 0
        if (shouldSkipDelegation) {
            console.log('[AI] Skipping delegation as Mother Agent fulfilled the request directly.')
        } else if (agentsToRun.length === 0 && results.length === 0) {
            // Default to summary if nothing happened
            agentsToRun.push('summary_agent')
        }

        // -------------------------------------------------------------------------
        // STEP 2 — Execute Child Agents Sequentially
        // -------------------------------------------------------------------------
        const contextBuilder = new AIContextBuilder(user.id)
        const commonContext = await contextBuilder.build(pageContext)

        if (!shouldSkipDelegation) {
            for (const agentKey of agentsToRun) {
                console.log(`[AI] Running child agent: ${agentKey}`)
                const agent = CHILD_AGENTS[agentKey]
                if (!agent) {
                    console.warn(`[AI] Agent ${agentKey} not found in CHILD_AGENTS`)
                    continue
                }

                // Filter tools available for this agent
                const agentTools = TOOLS.filter(t => agent.tools.includes(t.function.name))

                const agentBody = {
                    model: usingLocal ? localModel : 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: agent.system + '\n\n' + commonContext },
                        {
                            role: 'user',
                            content: message + (results.length > 0 ? `\n\nPrevious actions taken: ${JSON.stringify(results)}` : '')
                        }
                    ],
                    tools: agentTools.length > 0 ? agentTools : undefined,
                    tool_choice: agentTools.length > 0 ? 'auto' : undefined,
                }

                let response;
                try {
                    response = await fetch(`${aiBaseUrl}/chat/completions`, {
                        method: 'POST',
                        headers: aiHeaders,
                        body: JSON.stringify(agentBody),
                    })
                } catch (fetchErr: any) {
                    console.error(`[AI] Fetch error (Agent ${agentKey}):`, fetchErr)
                    results.push({ agent: agentKey, action: 'system', error: `Connection failed: ${fetchErr.message}` })
                    continue
                }

                if (!response.ok) {
                    const errText = await response.text()
                    console.error(`[AI] Agent ${agentKey} API error:`, errText)
                    results.push({ agent: agentKey, action: 'system', error: `API error: ${response.status}` })
                    continue
                }

                let data;
                try {
                    data = await response.json()
                } catch (jsonErr) {
                    console.error(`[AI] Agent ${agentKey} returned invalid JSON:`, await response.text())
                    results.push({ agent: agentKey, action: 'system', error: 'Invalid JSON response' })
                    continue
                }
                const msg = data.choices?.[0]?.message

                if (msg?.tool_calls?.length > 0) {
                    // Execute all tool calls for this agent
                    for (const tc of msg.tool_calls) {
                        const tName = tc.function.name
                        const tArgs = JSON.parse(tc.function.arguments || '{}')
                        console.log(`[AI] Agent ${agentKey} tool call: ${tName}`, tArgs)

                        try {
                            const res = await executeTool(tName, tArgs, user.id, supabase)
                            results.push({ agent: agentKey, action: tName, ...res })
                        } catch (err) {
                            console.error(`[AI] Tool execution error (${tName}):`, err)
                            results.push({ agent: agentKey, action: tName, error: err instanceof Error ? err.message : 'Unknown error' })
                        }
                    }
                } else if (msg?.content) {
                    // If it's a summary or just a text response, add it as a chat result
                    results.push({ agent: agentKey, action: 'chat', result: msg.content })
                }
            }
        }

        // -------------------------------------------------------------------------
        // STEP 3 — Final Reply Generation (Or simple merge)
        // -------------------------------------------------------------------------
        console.log('[AI] All agent steps complete. Results count:', results.length)

        // If we have a navigation action, skip final summary and just return the tool result
        const navAction = results.find(r => r.action === 'navigate')
        if (navAction) {
            return NextResponse.json({
                type: 'tool_result',
                ...navAction
            })
        }

        // For data creation/updates, return the first one as a primary tool result for the UI to refresh
        const primaryAction = results.find(r => r.action !== 'chat' && !r.error)
        if (primaryAction) {
            // If there's a summary agent at the end, merge its result into the response
            const summary = results.find(r => r.agent === 'summary_agent')?.result
            return NextResponse.json({
                type: 'tool_result',
                ...primaryAction,
                result: summary || primaryAction.result // If summary exists, use it as the text feedback
            })
        }

        // If only text responses (chat)
        const finalContent = results.map(r => r.result).filter(Boolean).join('\n\n')

        if (!finalContent) {
            return NextResponse.json({ error: 'AI failed to generate a response' }, { status: 502 })
        }

        // Return as a streaming-friendly response if possible, or just plain JSON
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(finalContent))
                controller.close()
            },
        })

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
            },
        })

    } catch (error) {
        console.error('AI Assistant route error:', error)
        const msg = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: `Internal server error: ${msg}` }, { status: 500 })
    }
}
