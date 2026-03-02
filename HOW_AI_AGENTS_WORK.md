# 🤖 How the AI Agents Work in LifeOS

> This document explains the full flow of the AI system, from when the user sends a message to when the UI updates.

---

## Overview — Multi-Agent Architecture

LifeOS uses a **Mother → Child agent** pattern. Instead of one giant AI doing everything, the work is split across specialized agents that each know their domain.

```
User Message
     │
     ▼
┌──────────────────┐
│   Mother Agent   │  ← decides what to do (orchestrator)
│  (Orchestrator)  │
└────────┬─────────┘
         │ delegates to (0..N agents)
    ┌────┴──────────────────────────────┐
    │                                   │
    ▼                                   ▼
productivity_agent              summary_agent
finance_agent                   navigator_agent
         (child agents — focused specialists)
    │
    ▼
Tool Execution (writes to Supabase DB)
    │
    ▼
Final Response → UI refresh / text reply
```

---

## The 4 Files That Power Everything

| File | Role |
|------|------|
| `lib/agents.ts` | Defines all agents (Mother + Children) and their system prompts |
| `lib/ai-context-builder.ts` | Fetches the user's live data and builds the AI system prompt |
| `lib/ai-page-contexts.ts` | Maps each page URL to a context descriptor |
| `app/api/ai-assistant/route.ts` | The API route that orchestrates the full 3-step flow |

---

## Step 1 — Mother Agent: Intent Detection

When the user sends a message, **the Mother Agent runs first**.

**File:** `lib/agents.ts` (exported as `MOTHER_AGENT_SYSTEM`)

```
"You are the Antigravity Orchestrator (Mother Agent).
Your job is to analyze the user message and decide which specialized agents should handle it."
```

The Mother Agent responds with JSON like:
```json
{
  "agents": ["productivity_agent"],
  "reason": "User wants to create a new career path.",
  "priority_agent": "productivity_agent"
}
```

### Shortcut: Direct Execution
For **simple, single-action commands** (e.g. *"Add buy milk to tasks"*), the Mother Agent can call the tools directly without delegating to child agents. This skips Step 2 entirely.

---

## Step 2 — Child Agents: Specialized Execution

Each child agent in `lib/agents.ts` is a specialist:

| Agent | What It Handles | Tools It Can Use |
|-------|----------------|-----------------|
| `productivity_agent` | Tasks, Habits, Goals | `create_task`, `edit_task`, `delete_task`, `mark_complete`, `create_habit`, `log_habit_completion`, `create_goal`, `update_goal_progress` |
| `finance_agent` | Money transactions | `add_transaction` |
| `summary_agent` | Read-only Q&A about user data | *(none — text only)* |
| `navigator_agent` | Page navigation | `navigate_to_page` |

Each child agent gets:
- Its own focused **system prompt**
- Only the **tools relevant to its domain**
- The **full context** built by `AIContextBuilder` (see Step 2a)
- Any **previous results** from earlier agents in the chain

### Step 2a — Context Building
Before running child agents, `AIContextBuilder` builds a rich system prompt from 3 layers:

```
Layer 1 — Static App Knowledge
   ↕ always included
   What LifeOS is, all features, data relationships, capabilities

Layer 2 — Current Page Context (from lib/ai-page-contexts.ts)
   ↕ based on which URL the user is on
   Page description, quick actions, AI behavior hints

Layer 3 — Live User Data (fetched from Supabase)
   ↕ only data relevant to the current page
   e.g. on /tasks → fetches real tasks; on /finances → fetches this month's transactions
```

**Page Context Example** (`/dashboard/tasks`):
```ts
{
  page: 'Tasks',
  description: 'Full task manager...',
  hint: 'Be action-oriented and help them decide what to work on.',
  availableData: ['tasks']  // ← tells context builder what to fetch
}
```

---

## Step 3 — Tools: Writing to the Database

Tools are the **only way the AI can mutate data**. Each tool is a typed function that writes to Supabase.

**Available Tools (defined in `route.ts`):**
- `create_task` / `edit_task` / `delete_task` / `mark_complete`
- `create_goal` / `update_goal_progress`
- `create_habit` / `log_habit_completion`
- `create_note`
- `add_transaction`
- `create_learning_path`
- `navigate_to_page`

**Security:** Every tool call enforces ownership — all DB queries include `.eq('user_id', userId)`, so agents can only touch the authenticated user's data.

---

## Step 4 — Response Back to UI

After all agents finish, the route decides how to respond:

```
Navigation requested?  → Return { type: 'tool_result', action: 'navigate', path: '...' }
                              ↓ frontend router.push(path)

Data was changed?      → Return { type: 'tool_result', action: 'refresh', result: '✅ Task created...' }
                              ↓ frontend refreshes the page data

Only a text answer?    → Stream the text as plain UTF-8 response
                              ↓ frontend renders it as a chat message
```

---

## Full Example: "Help me become a better developer"

```
User: "Help me become a better developer"
  │
  ├─ Mother Agent → { "agents": ["productivity_agent"] }
  │
  ├─ productivity_agent runs with live context (current tasks, habits, goals)
  │    ├─ Calls: create_goal("Become a better developer", target=100, unit="hours")
  │    ├─ Calls: create_task("Study DSA", priority="High")
  │    └─ Calls: create_habit("Code for 1 hour", frequency="Daily")
  │
  └─ UI receives: { type: 'tool_result', action: 'refresh', result: '✅ Goal + Task + Habit created!' }
```

---

## AI Backend Configuration

The system supports two backends, configured via `.env.local`:

| Variable | Provider |
|----------|----------|
| `LOCAL_AI_URL` | Local LLM via LM Studio (e.g. `http://localhost:1234`) |
| `GROQ_API_KEY` | Groq Cloud (default model: `llama-3.3-70b-versatile`) |

If `LOCAL_AI_URL` is set, the local server is used. Otherwise, it falls back to Groq.

---

## Adding a New Agent

1. **Define it** in `lib/agents.ts` under `CHILD_AGENTS`
2. **List the tools** it can use in `tools: [...]`
3. **Register new tools** in the `TOOLS` array in `route.ts`
4. **Implement the tool** in the `executeTool()` switch in `route.ts`
5. **Update `MOTHER_AGENT_SYSTEM`** so the orchestrator knows the new agent exists

---

*Built with Next.js App Router · Supabase · Groq/LM Studio · TypeScript*
