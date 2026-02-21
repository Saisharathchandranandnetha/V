// AI Page Context Descriptors
// Every dashboard route gets an entry here.
// The frontend reads usePathname() → looks up this map → sends pageContext with every AI request.

export interface PageContext {
    page: string
    description: string
    quickActions: string[]
    hint: string
    availableData: string[]
}

export const pageContexts: Record<string, PageContext> = {
    '/dashboard': {
        page: 'Dashboard',
        description: 'Overview of the user\'s day — shows recent tasks, habits due today, active goals, and a summary of their productivity.',
        quickActions: [
            "What's on my plate today?",
            'Summarize my progress this week',
            'What should I focus on right now?',
            'Any habits I missed recently?',
        ],
        hint: 'User wants a high-level overview or quick actions. Be concise and motivating.',
        availableData: ['tasks_summary', 'habits_today', 'goals_summary'],
    },

    '/dashboard/tasks': {
        page: 'Tasks',
        description: 'Full task manager — user can view, create, edit, delete tasks with priorities (Low/Medium/High/Urgent) and statuses (Todo/In Progress/Done).',
        quickActions: [
            "What tasks are due today?",
            'Which tasks are high priority?',
            'Show me incomplete tasks',
            'Help me prioritize my task list',
        ],
        hint: 'User is focused on their to-do list. Be action-oriented and help them decide what to work on.',
        availableData: ['tasks'],
    },

    '/dashboard/habits': {
        page: 'Habits',
        description: 'Habit tracker — user tracks daily and weekly habits. Each habit has a name, frequency, and daily completion logs.',
        quickActions: [
            "Which habits did I complete today?",
            "What's my current streak?",
            'Which habits am I struggling with?',
            'Suggest a new habit for productivity',
        ],
        hint: 'User wants to build or track recurring habits. Be encouraging and focus on consistency.',
        availableData: ['habits', 'habit_logs_today'],
    },

    '/dashboard/goals': {
        page: 'Goals',
        description: 'Long-term goals tracker — Short Term, Mid Term, Long Term goals with target values, current progress, units, and deadlines.',
        quickActions: [
            "How am I progressing on my goals?",
            'Which goal is closest to completion?',
            'Which goal has the nearest deadline?',
            'Help me break a goal into smaller steps',
        ],
        hint: 'User is planning long-term. Help them reflect on progress and break big goals into actionable steps.',
        availableData: ['goals'],
    },

    '/dashboard/finances': {
        page: 'Finances',
        description: 'Finance tracker — tracks income and expense transactions with categories, amounts, descriptions, and dates.',
        quickActions: [
            "How much did I spend this month?",
            "What's my income vs expenses?",
            "What's my biggest expense category?",
            'Am I on track with my budget?',
        ],
        hint: 'User wants financial clarity. Be analytical and give concrete numbers when data is available.',
        availableData: ['transactions_this_month', 'categories'],
    },

    '/dashboard/notes': {
        page: 'Notes',
        description: 'Notes page — user writes free-form notes with titles and content. Used for journaling, ideas, and reflections.',
        quickActions: [
            "What did I write about recently?",
            'Summarize my latest note',
            'Find notes about a topic',
            'Help me write a reflection',
        ],
        hint: 'User wants to reflect or write. Be warm, thoughtful, and support their creative process.',
        availableData: ['notes_recent'],
    },

    '/dashboard/resources': {
        page: 'Resources',
        description: 'Resource library — user saves articles, videos, 3D models, and other learning materials, organized with tags and summaries.',
        quickActions: [
            "What resources have I saved recently?",
            'Find resources about a specific topic',
            'What resources have I not reviewed yet?',
            'Summarize what I\'ve been learning',
        ],
        hint: 'User is building their knowledge library. Help them find, organize, or understand saved resources.',
        availableData: ['resources_recent'],
    },

    '/dashboard/paths': {
        page: 'Learning Paths',
        description: 'Structured learning paths — user creates or follows learning modules with progress tracking.',
        quickActions: [
            "What learning paths am I on?",
            'How far along am I in my current path?',
            'What should I study next?',
            'Help me create a learning plan',
        ],
        hint: 'User is working on structured learning. Be like a knowledgeable mentor guiding them forward.',
        availableData: ['paths'],
    },

    '/dashboard/roadmaps': {
        page: 'Roadmaps',
        description: 'Visual roadmaps — user creates branching roadmaps for skills, projects, or learning journeys.',
        quickActions: [
            "Explain how to use roadmaps",
            'Help me plan a roadmap for a skill',
            'What makes a good roadmap structure?',
            'How do I break a big goal into a roadmap?',
        ],
        hint: 'User is doing high-level planning. Help them think structurally about long-term journeys.',
        availableData: [],
    },

    '/dashboard/analytics': {
        page: 'Analytics',
        description: 'Analytics dashboard — shows charts and metrics about task completion, habit streaks, goal progress, and financial trends.',
        quickActions: [
            "What does my productivity look like?",
            'How consistent have I been with habits?',
            'What trends do you see in my data?',
            'Which area needs the most improvement?',
        ],
        hint: 'User wants insights. Be analytical, specific, and help them identify patterns.',
        availableData: ['tasks_summary', 'habits_summary', 'goals_summary', 'transactions_summary'],
    },

    '/dashboard/settings': {
        page: 'Settings',
        description: 'App settings — user configures their profile, theme, preferences, and account details.',
        quickActions: [
            "How do I change my theme?",
            'What can I customize in settings?',
            'How do I update my profile?',
            'What do the different settings do?',
        ],
        hint: 'User needs help navigating settings. Be clear and direct.',
        availableData: [],
    },

    '/dashboard/teams': {
        page: 'Teams',
        description: 'Teams dashboard — user can view and manage their teams, collaborators, and shared projects.',
        quickActions: [
            "What teams am I in?",
            'How do I invite someone to a team?',
            'What can teams see and share?',
            'How does team collaboration work?',
        ],
        hint: 'User is collaborating. Help them understand team features and workflows.',
        availableData: [],
    },

    '/dashboard/chat': {
        page: 'Team Chat',
        description: 'Real-time team chat — user communicates with teammates, shares tasks, and collaborates on projects.',
        quickActions: [
            "How is team chat organized?",
            'What can I share in chat?',
            'How do I create a team project?',
            'Can I link tasks to chat messages?',
        ],
        hint: 'User wants to collaborate effectively. Be helpful about communication and teamwork.',
        availableData: [],
    },
}

// Helper: match pathname to a context (handles dynamic sub-routes)
export function getPageContext(pathname: string): PageContext {
    // Exact match first
    if (pageContexts[pathname]) return pageContexts[pathname]

    // Prefix match (e.g. /dashboard/tasks/123 → /dashboard/tasks)
    const match = Object.keys(pageContexts)
        .filter(key => pathname.startsWith(key))
        .sort((a, b) => b.length - a.length)[0]

    return match
        ? pageContexts[match]
        : {
            page: 'LifeOS',
            description: 'A personal life tracking and productivity OS.',
            quickActions: ['What can you help me with?', 'Give me a quick overview', 'What features does LifeOS have?'],
            hint: 'User is on an unknown page. Give a general helpful response about LifeOS.',
            availableData: [],
        }
}
