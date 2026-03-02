import { pgTable, uuid, text, timestamp, boolean, numeric, date, jsonb, unique, integer } from 'drizzle-orm/pg-core'

// ── AUTH (NextAuth required tables) ──────────────────────────────────────────
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name'),
    email: text('email').unique(),
    emailVerified: timestamp('email_verified', { withTimezone: true }),
    image: text('image'),
    role: text('role').default('user'),
    settings: jsonb('settings').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
})

export const sessions = pgTable('sessions', {
    sessionToken: text('session_token').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
    identifier: text('identifier').notNull(),
    token: text('token').unique().notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
})

// ── NOTES ─────────────────────────────────────────────────────────────────────
export const notes = pgTable('notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content'),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'set null' }),
    originalItemId: uuid('original_item_id'),
    copiedFromChat: boolean('copied_from_chat').default(false),
    copiedAt: timestamp('copied_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── HABITS ────────────────────────────────────────────────────────────────────
export const habits = pgTable('habits', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    frequency: text('frequency').default('Daily'),
    collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const habitLogs = pgTable('habit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    habitId: uuid('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    status: boolean('status').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    unique().on(t.habitId, t.date),
])

// ── TASKS ─────────────────────────────────────────────────────────────────────
export const tasks = pgTable('tasks', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    priority: text('priority').default('Medium'),
    status: text('status').default('Todo'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── GOALS ─────────────────────────────────────────────────────────────────────
export const goals = pgTable('goals', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    type: text('type').default('Short Term'),
    targetValue: numeric('target_value').notNull(),
    currentValue: numeric('current_value').default('0'),
    unit: text('unit').notNull(),
    deadline: date('deadline'),
    collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── FINANCES ──────────────────────────────────────────────────────────────────
export const categories = pgTable('categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const transactions = pgTable('transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    amount: numeric('amount').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    categoryName: text('category_name'),
    description: text('description'),
    date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── RESOURCES ─────────────────────────────────────────────────────────────────
export const resources = pgTable('resources', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    type: text('type').notNull(),
    url: text('url'),
    summary: text('summary'),
    tags: text('tags').array(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'set null' }),
    originalItemId: uuid('original_item_id'),
    copiedFromChat: boolean('copied_from_chat').default(false),
    copiedAt: timestamp('copied_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── COLLECTIONS ───────────────────────────────────────────────────────────────
export const collections = pgTable('collections', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── LEARNING PATHS ────────────────────────────────────────────────────────────
export const learningPaths = pgTable('learning_paths', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    links: text('links').array(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'set null' }),
    originalItemId: uuid('original_item_id'),
    copiedFromChat: boolean('copied_from_chat').default(false),
    copiedAt: timestamp('copied_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── ROADMAPS ──────────────────────────────────────────────────────────────────
export const roadmaps = pgTable('roadmaps', {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id'),
    projectId: uuid('project_id'),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').default('draft'), // draft | active | completed
    progress: integer('progress').default(0),
    originalRoadmapId: uuid('original_roadmap_id'),
    copiedFromChat: boolean('copied_from_chat').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const roadmapSteps = pgTable('roadmap_steps', {
    id: uuid('id').defaultRandom().primaryKey(),
    roadmapId: uuid('roadmap_id').notNull().references(() => roadmaps.id, { onDelete: 'cascade' }),
    parentStepId: uuid('parent_step_id'),
    title: text('title').notNull(),
    description: text('description'),
    order: integer('order').notNull().default(0),
    completed: boolean('completed').default(false),
    linkedResourceId: uuid('linked_resource_id'),
    linkedTaskId: uuid('linked_task_id'),
    linkedNoteId: uuid('linked_note_id'),
    linkedPathId: uuid('linked_path_id'),
    linkedGoalId: uuid('linked_goal_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const roadmapStepLinks = pgTable('roadmap_step_links', {
    id: uuid('id').defaultRandom().primaryKey(),
    stepId: uuid('step_id').notNull().references(() => roadmapSteps.id, { onDelete: 'cascade' }),
    noteId: uuid('note_id'),
    learningPathId: uuid('learning_path_id'),
    resourceId: uuid('resource_id'),
    goalId: uuid('goal_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── TEAMS ─────────────────────────────────────────────────────────────────────
export const teams = pgTable('teams', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const teamMembers = pgTable('team_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').default('member'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── PROJECTS ──────────────────────────────────────────────────────────────────
export const projects = pgTable('projects', {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ── CHAT ──────────────────────────────────────────────────────────────────────
export const teamMessages = pgTable('team_messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    message: text('message'),
    type: text('type').default('message'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const messageReads = pgTable('message_reads', {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id').notNull().references(() => teamMessages.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
    unique().on(t.messageId, t.userId),
])

export const chatSharedItems = pgTable('chat_shared_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id').notNull(),
    projectId: uuid('project_id'),
    chatMessageId: uuid('chat_message_id').references(() => teamMessages.id, { onDelete: 'cascade' }),
    sharedType: text('shared_type').notNull(),
    sharedItemId: uuid('shared_item_id').notNull(),
    sharedBy: uuid('shared_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
