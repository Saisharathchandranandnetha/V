-- ============================================================
-- LifeOS — COMPLETE CONSOLIDATED DATABASE SCHEMA
-- Idempotent: safe to run on an existing project (re-runnable).
-- DROP POLICY IF EXISTS guards all CREATE POLICY statements.
-- Generated: 2026-02-21
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- FUNCTIONS
-- ============================================================

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Auto-create user profile on signup (includes role)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Delete own account
create or replace function delete_user()
returns void
language sql
security definer
as $$
  delete from auth.users where id = auth.uid();
$$;
grant execute on function delete_user() to authenticated;

-- Atomic team creation
create or replace function create_new_team(team_name text)
returns uuid
language plpgsql
security definer
as $$
declare
  new_team_id uuid;
begin
  insert into teams (name, created_by)
  values (team_name, auth.uid())
  returning id into new_team_id;

  insert into team_members (team_id, user_id, role)
  values (new_team_id, auth.uid(), 'owner');

  return new_team_id;
end;
$$;


-- ============================================================
-- TABLE: users
-- ============================================================
create table if not exists users (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  name text,
  avatar text,
  role text default 'user' check (role in ('user', 'team_only', 'admin')),
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table users enable row level security;

drop policy if exists "Users can view their own profile"   on users;
drop policy if exists "Users can update their own profile" on users;
drop policy if exists "Users can insert their own profile" on users;
create policy "Users can view their own profile"   on users for select using ((select auth.uid()) = id);
create policy "Users can update their own profile" on users for update using ((select auth.uid()) = id);
create policy "Users can insert their own profile" on users for insert with check ((select auth.uid()) = id);

drop trigger if exists users_updated_at on users;
create trigger users_updated_at before update on users for each row execute procedure handle_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- TABLE: collections
-- ============================================================
create table if not exists collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table collections enable row level security;

drop policy if exists "Users can view their own collections"   on collections;
drop policy if exists "Users can insert their own collections" on collections;
drop policy if exists "Users can update their own collections" on collections;
drop policy if exists "Users can delete their own collections" on collections;
create policy "Users can view their own collections"   on collections for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own collections" on collections for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own collections" on collections for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own collections" on collections for delete using ((select auth.uid()) = user_id);


-- ============================================================
-- TABLE: resources
-- type: 'url' | 'pdf' | 'youtube' | 'gltf' | 'spline' | 'image' | 'lottie' | '3d'
-- ============================================================
create table if not exists resources (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  collection_id uuid references collections(id) on delete set null,
  original_item_id uuid references resources(id) on delete set null,
  title text not null,
  type text not null check (type in ('url', 'pdf', 'youtube', 'gltf', 'spline', 'image', 'lottie', '3d')),
  url text,
  gltf_url text,
  spline_embed_url text,
  lottie_json_url text,
  tags text[],
  summary text,
  source_meta jsonb,
  copied_from_chat boolean default false,
  copied_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table resources enable row level security;

drop policy if exists "Users can view their own resources"   on resources;
drop policy if exists "Users can insert their own resources" on resources;
drop policy if exists "Users can update their own resources" on resources;
drop policy if exists "Users can delete their own resources" on resources;
create policy "Users can view their own resources"   on resources for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own resources" on resources for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own resources" on resources for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own resources" on resources for delete using ((select auth.uid()) = user_id);

-- Idempotent column additions (for existing databases)
alter table resources add column if not exists collection_id      uuid references collections(id) on delete set null;
alter table resources add column if not exists original_item_id   uuid references resources(id)  on delete set null;
alter table resources add column if not exists gltf_url           text;
alter table resources add column if not exists spline_embed_url   text;
alter table resources add column if not exists lottie_json_url    text;
alter table resources add column if not exists source_meta        jsonb;
alter table resources add column if not exists copied_from_chat   boolean default false;
alter table resources add column if not exists copied_at          timestamp with time zone;
alter table resources add column if not exists updated_at         timestamp with time zone default timezone('utc'::text, now());

create index if not exists idx_resources_original_item on resources(original_item_id);


-- ============================================================
-- TABLE: notes
-- ============================================================
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  collection_id uuid references collections(id) on delete set null,
  original_item_id uuid references notes(id) on delete set null,
  title text not null,
  content text,
  copied_from_chat boolean default false,
  copied_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notes enable row level security;

drop policy if exists "Users can view their own notes"   on notes;
drop policy if exists "Users can insert their own notes" on notes;
drop policy if exists "Users can update their own notes" on notes;
drop policy if exists "Users can delete their own notes" on notes;
create policy "Users can view their own notes"   on notes for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own notes" on notes for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own notes" on notes for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own notes" on notes for delete using ((select auth.uid()) = user_id);

-- Idempotent column additions (for existing databases)
alter table notes add column if not exists collection_id    uuid references collections(id) on delete set null;
alter table notes add column if not exists original_item_id uuid references notes(id)       on delete set null;
alter table notes add column if not exists copied_from_chat boolean default false;
alter table notes add column if not exists copied_at        timestamp with time zone;

create index if not exists idx_notes_original_item on notes(original_item_id);


-- ============================================================
-- TABLE: flashcards
-- ============================================================
create table if not exists flashcards (
  id uuid default gen_random_uuid() primary key,
  note_id uuid references notes(id) on delete cascade,
  resource_id uuid references resources(id) on delete cascade,
  question text not null,
  answer text not null,
  difficulty text,
  next_review timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table flashcards enable row level security;


-- ============================================================
-- TABLE: learning_paths
-- description, links: from older schema. modules: structured version.
-- ============================================================
create table if not exists learning_paths (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  collection_id uuid references collections(id) on delete set null,
  original_item_id uuid references learning_paths(id) on delete set null,
  title text not null,
  description text,
  links text[],
  modules jsonb,
  progress numeric default 0,
  is_completed boolean default false,
  copied_from_chat boolean default false,
  copied_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table learning_paths enable row level security;

drop policy if exists "Users can view their own learning paths"   on learning_paths;
drop policy if exists "Users can insert their own learning paths" on learning_paths;
drop policy if exists "Users can update their own learning paths" on learning_paths;
drop policy if exists "Users can delete their own learning paths" on learning_paths;
create policy "Users can view their own learning paths"   on learning_paths for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own learning paths" on learning_paths for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own learning paths" on learning_paths for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own learning paths" on learning_paths for delete using ((select auth.uid()) = user_id);

-- Idempotent column additions (for existing databases)
alter table learning_paths add column if not exists collection_id    uuid references collections(id)    on delete set null;
alter table learning_paths add column if not exists original_item_id uuid references learning_paths(id) on delete set null;
alter table learning_paths add column if not exists description      text;
alter table learning_paths add column if not exists links            text[];
alter table learning_paths add column if not exists modules          jsonb;
alter table learning_paths add column if not exists progress         numeric default 0;
alter table learning_paths add column if not exists is_completed     boolean default false;
alter table learning_paths add column if not exists copied_from_chat boolean default false;
alter table learning_paths add column if not exists copied_at        timestamp with time zone;

create index if not exists idx_learning_paths_original_item on learning_paths(original_item_id);

-- Legacy alias table
create table if not exists paths (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  modules jsonb,
  progress numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table paths enable row level security;
drop policy if exists "Users can CRUD own paths" on paths;
create policy "Users can CRUD own paths" on paths using ((select auth.uid()) = user_id);


-- ============================================================
-- TABLE: habits
-- ============================================================
create table if not exists habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  collection_id uuid references collections(id) on delete set null,
  name text not null,
  frequency text default 'Daily',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table habits enable row level security;

drop policy if exists "Users can view their own habits"   on habits;
drop policy if exists "Users can insert their own habits" on habits;
drop policy if exists "Users can update their own habits" on habits;
drop policy if exists "Users can delete their own habits" on habits;
create policy "Users can view their own habits"   on habits for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own habits" on habits for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own habits" on habits for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own habits" on habits for delete using ((select auth.uid()) = user_id);

-- Idempotent column additions (for existing databases)
alter table habits add column if not exists collection_id uuid references collections(id) on delete set null;


-- ============================================================
-- TABLE: habit_logs
-- ============================================================
create table if not exists habit_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references habits(id) on delete cascade not null,
  date date not null,
  status boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (habit_id, date)
);

alter table habit_logs enable row level security;

drop policy if exists "Users can view their own habit logs"   on habit_logs;
drop policy if exists "Users can insert their own habit logs" on habit_logs;
drop policy if exists "Users can update their own habit logs" on habit_logs;
drop policy if exists "Users can delete their own habit logs" on habit_logs;
create policy "Users can view their own habit logs" on habit_logs
  for select using (exists (select 1 from habits where habits.id = habit_logs.habit_id and habits.user_id = (select auth.uid())));
create policy "Users can insert their own habit logs" on habit_logs
  for insert with check (exists (select 1 from habits where habits.id = habit_logs.habit_id and habits.user_id = (select auth.uid())));
create policy "Users can update their own habit logs" on habit_logs
  for update using (exists (select 1 from habits where habits.id = habit_logs.habit_id and habits.user_id = (select auth.uid())));
create policy "Users can delete their own habit logs" on habit_logs
  for delete using (exists (select 1 from habits where habits.id = habit_logs.habit_id and habits.user_id = (select auth.uid())));


-- ============================================================
-- TABLE: teams
-- ============================================================
create table if not exists teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table teams enable row level security;

drop policy if exists "Users can view teams they belong to" on teams;
drop policy if exists "Owners and Admins can update teams"  on teams;
drop policy if exists "Owners can delete teams"             on teams;
drop policy if exists "Enable delete for team owners"       on teams;
create policy "Users can view teams they belong to" on teams
  for select using (exists (select 1 from team_members where team_members.team_id = teams.id and team_members.user_id = (select auth.uid())));
create policy "Owners and Admins can update teams" on teams
  for update using (exists (select 1 from team_members where team_members.team_id = teams.id and team_members.user_id = (select auth.uid()) and team_members.role in ('owner', 'admin')));
create policy "Owners can delete teams" on teams
  for delete using (exists (select 1 from team_members where team_members.team_id = teams.id and team_members.user_id = (select auth.uid()) and team_members.role = 'owner'));


-- ============================================================
-- HELPER: is_team_member() — security definer to avoid RLS recursion
-- This runs as the table owner (bypasses RLS) so it is safe to call
-- from within RLS policies on team_members and other tables.
-- ============================================================
create or replace function is_team_member(p_team_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from team_members
    where team_id = p_team_id and user_id = p_user_id
  );
$$;

-- ============================================================
-- TABLE: team_members
-- role: 'owner' | 'admin' | 'member'
-- ============================================================
create table if not exists team_members (
  team_id uuid references teams(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('owner', 'admin', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (team_id, user_id)
);

alter table team_members enable row level security;

drop policy if exists "Users can view members of their teams"  on team_members;
drop policy if exists "Owners and Admins can add members"      on team_members;
drop policy if exists "Owners and Admins can update members"   on team_members;
drop policy if exists "Owners and Admins can remove members"   on team_members;
-- SELECT: a user can always see their own membership rows, and any row in
-- a team they belong to — checked via the security-definer function above
-- that bypasses RLS and avoids infinite recursion.
create policy "Users can view members of their teams" on team_members
  for select using (
    user_id = (select auth.uid())
    or is_team_member(team_id, (select auth.uid()))
  );
create policy "Owners and Admins can add members" on team_members
  for insert with check (
    exists (
      select 1 from team_members r
      where r.team_id = team_members.team_id
        and r.user_id = (select auth.uid())
        and r.role in ('owner', 'admin')
    )
  );
create policy "Owners and Admins can update members" on team_members
  for update using (
    exists (
      select 1 from team_members r
      where r.team_id = team_members.team_id
        and r.user_id = (select auth.uid())
        and r.role in ('owner', 'admin')
    )
  );
create policy "Owners and Admins can remove members" on team_members
  for delete using (
    exists (
      select 1 from team_members r
      where r.team_id = team_members.team_id
        and r.user_id = (select auth.uid())
        and r.role in ('owner', 'admin')
    )
  );


-- ============================================================
-- TABLE: projects
-- ============================================================
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table projects enable row level security;

drop policy if exists "Users can view projects in their teams"   on projects;
drop policy if exists "Owners and Admins can insert projects"    on projects;
drop policy if exists "Owners and Admins can update projects"    on projects;
drop policy if exists "Enable delete for team admins"            on projects;
create policy "Users can view projects in their teams" on projects
  for select using (is_team_member(projects.team_id, (select auth.uid())));
create policy "Owners and Admins can insert projects" on projects
  for insert with check (exists (select 1 from team_members where team_members.team_id = projects.team_id and team_members.user_id = (select auth.uid()) and team_members.role in ('owner', 'admin')));
create policy "Owners and Admins can update projects" on projects
  for update using (exists (select 1 from team_members where team_members.team_id = projects.team_id and team_members.user_id = (select auth.uid()) and team_members.role in ('owner', 'admin')));
create policy "Enable delete for team admins" on projects
  for delete using (exists (select 1 from team_members where team_members.team_id = projects.team_id and team_members.user_id = (select auth.uid()) and team_members.role = any(array['owner'::text, 'admin'::text])));


-- ============================================================
-- TABLE: project_members
-- ============================================================
create table if not exists project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('owner', 'admin', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (project_id, user_id)
);

alter table project_members enable row level security;

drop policy if exists "View project members" on project_members;
create policy "View project members" on project_members
  for select using (
    ((select auth.uid()) = user_id)
    or exists (
      select 1 from projects p
      join team_members tm on tm.team_id = p.team_id
      where p.id = project_members.project_id
      and tm.user_id = (select auth.uid())
    )
  );

create index if not exists project_members_user_id_idx on public.project_members(user_id);


-- ============================================================
-- TABLE: team_messages
-- ============================================================
create table if not exists team_messages (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  sender_id uuid references auth.users(id) on delete set null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table team_messages enable row level security;

drop policy if exists "Users can view messages in their teams" on team_messages;
drop policy if exists "Users can send messages in their teams" on team_messages;
create policy "Users can view messages in their teams" on team_messages
  for select using (exists (select 1 from team_members where team_members.team_id = team_messages.team_id and team_members.user_id = (select auth.uid())));
create policy "Users can send messages in their teams" on team_messages
  for insert with check (exists (select 1 from team_members where team_members.team_id = team_messages.team_id and team_members.user_id = (select auth.uid())));


-- ============================================================
-- TABLE: message_reads
-- ============================================================
create table if not exists message_reads (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references team_messages(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (message_id, user_id)
);

alter table message_reads enable row level security;

drop policy if exists "Users can view read receipts in their teams"  on message_reads;
drop policy if exists "Users can insert their own read receipts"     on message_reads;
create policy "Users can view read receipts in their teams" on message_reads
  for select using (exists (
    select 1 from team_messages
    join team_members on team_members.team_id = team_messages.team_id
    where team_messages.id = message_reads.message_id
    and team_members.user_id = (select auth.uid())
  ));
create policy "Users can insert their own read receipts" on message_reads
  for insert with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from team_messages
      join team_members on team_members.team_id = team_messages.team_id
      where team_messages.id = message_reads.message_id
      and team_members.user_id = (select auth.uid())
    )
  );

create index if not exists idx_message_reads_message_id on public.message_reads(message_id);


-- ============================================================
-- TABLE: chat_shared_items
-- shared_type: 'resource' | 'note' | 'learning_path' | 'roadmap' | 'finance'
-- ============================================================
create table if not exists chat_shared_items (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  team_message_id uuid references team_messages(id) on delete cascade,
  shared_by uuid references auth.users(id) on delete set null,
  shared_item_id uuid not null,
  shared_type text not null check (shared_type in ('resource', 'note', 'learning_path', 'roadmap', 'finance')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table chat_shared_items enable row level security;

drop policy if exists "Team members can view shared items" on chat_shared_items;
drop policy if exists "Team members can share items"       on chat_shared_items;
create policy "Team members can view shared items" on chat_shared_items
  for select using (exists (select 1 from team_members where team_members.team_id = chat_shared_items.team_id and team_members.user_id = (select auth.uid())));
create policy "Team members can share items" on chat_shared_items
  for insert with check (exists (select 1 from team_members where team_members.team_id = chat_shared_items.team_id and team_members.user_id = (select auth.uid())));


-- ============================================================
-- TABLE: tasks
-- Creator OR assignee can view and update.
-- ============================================================
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  team_id uuid references teams(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  collection_id uuid references collections(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  created_from_message_id uuid references team_messages(id) on delete set null,
  title text not null,
  description text,
  priority text check (priority in ('Low', 'Medium', 'High', 'Urgent')) default 'Medium',
  status text check (status in ('Todo', 'In Progress', 'Done')) default 'Todo',
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  completion_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tasks enable row level security;

drop policy if exists "Users can view their own tasks"                on tasks;
drop policy if exists "Users can view their own or assigned tasks"    on tasks;
drop policy if exists "Users can insert their own tasks"              on tasks;
drop policy if exists "Users can update their own tasks"              on tasks;
drop policy if exists "Users can update their own or assigned tasks"  on tasks;
drop policy if exists "Users can delete their own tasks"              on tasks;
create policy "Users can view their own or assigned tasks" on tasks
  for select using ((select auth.uid()) = user_id or (select auth.uid()) = assigned_to);
create policy "Users can insert their own tasks" on tasks
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own or assigned tasks" on tasks
  for update using ((select auth.uid()) = user_id or (select auth.uid()) = assigned_to);
create policy "Users can delete their own tasks" on tasks
  for delete using ((select auth.uid()) = user_id);

-- Idempotent column additions (for existing databases)
alter table tasks add column if not exists team_id                  uuid references teams(id)         on delete cascade;
alter table tasks add column if not exists project_id               uuid references projects(id)       on delete set null;
alter table tasks add column if not exists collection_id            uuid references collections(id)    on delete set null;
alter table tasks add column if not exists assigned_to              uuid references auth.users(id)     on delete set null;
alter table tasks add column if not exists created_from_message_id  uuid references team_messages(id)  on delete set null;
alter table tasks add column if not exists completed_at             timestamp with time zone;
alter table tasks add column if not exists completion_reason        text;


-- ============================================================
-- TABLE: goals
-- ============================================================
create table if not exists goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  collection_id uuid references collections(id) on delete set null,
  title text not null,
  type text check (type in ('Short Term', 'Mid Term', 'Long Term')) default 'Short Term',
  target_value numeric not null,
  current_value numeric default 0,
  unit text not null,
  deadline date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table goals enable row level security;

drop policy if exists "Users can view their own goals"   on goals;
drop policy if exists "Users can insert their own goals" on goals;
drop policy if exists "Users can update their own goals" on goals;
drop policy if exists "Users can delete their own goals" on goals;
create policy "Users can view their own goals"   on goals for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own goals" on goals for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own goals" on goals for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own goals" on goals for delete using ((select auth.uid()) = user_id);

-- Idempotent column additions (for existing databases)
alter table goals add column if not exists collection_id uuid references collections(id) on delete set null;


-- ============================================================
-- TABLE: categories  (Finance)
-- ============================================================
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text check (type in ('Income', 'Expense')) not null,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table categories enable row level security;

drop policy if exists "Users can view their own categories"   on categories;
drop policy if exists "Users can insert their own categories" on categories;
drop policy if exists "Users can update their own categories" on categories;
drop policy if exists "Users can delete their own categories" on categories;
create policy "Users can view their own categories"   on categories for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own categories" on categories for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own categories" on categories for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own categories" on categories for delete using ((select auth.uid()) = user_id);


-- ============================================================
-- TABLE: transactions
-- ============================================================
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  type text check (type in ('Income', 'Expense')) not null,
  amount numeric not null,
  category_name text,
  description text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table transactions enable row level security;

drop policy if exists "Users can view their own transactions"   on transactions;
drop policy if exists "Users can insert their own transactions" on transactions;
drop policy if exists "Users can update their own transactions" on transactions;
drop policy if exists "Users can delete their own transactions" on transactions;
create policy "Users can view their own transactions"   on transactions for select using ((select auth.uid()) = user_id);
create policy "Users can insert their own transactions" on transactions for insert with check ((select auth.uid()) = user_id);
create policy "Users can update their own transactions" on transactions for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own transactions" on transactions for delete using ((select auth.uid()) = user_id);


-- ============================================================
-- TABLE: roadmaps
-- status: 'draft' | 'active' | 'completed'
-- ============================================================
create table if not exists roadmaps (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  team_id uuid references teams(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  status text check (status in ('draft', 'active', 'completed')) default 'draft',
  progress integer default 0,
  original_roadmap_id uuid references roadmaps(id) on delete set null,
  copied_from_chat boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table roadmaps enable row level security;

drop policy if exists "Users can view roadmaps"           on roadmaps;
drop policy if exists "Users can insert roadmaps"          on roadmaps;
drop policy if exists "Users can update their own roadmaps" on roadmaps;
drop policy if exists "Users can delete their own roadmaps" on roadmaps;
create policy "Users can view roadmaps" on roadmaps
  for select using (
    (select auth.uid()) = owner_id or
    (team_id is not null and exists (select 1 from team_members where team_members.team_id = roadmaps.team_id and team_members.user_id = (select auth.uid()))) or
    (project_id is not null and exists (select 1 from team_members join projects on projects.team_id = team_members.team_id where projects.id = roadmaps.project_id and team_members.user_id = (select auth.uid()))) or
    exists (select 1 from chat_shared_items join team_members on team_members.team_id = chat_shared_items.team_id where chat_shared_items.shared_item_id = roadmaps.id and chat_shared_items.shared_type = 'roadmap' and team_members.user_id = (select auth.uid()))
  );
create policy "Users can insert roadmaps"           on roadmaps for insert with check ((select auth.uid()) = owner_id);
create policy "Users can update their own roadmaps" on roadmaps for update using ((select auth.uid()) = owner_id);
create policy "Users can delete their own roadmaps" on roadmaps for delete using ((select auth.uid()) = owner_id);

drop trigger if exists update_roadmaps_updated_at on roadmaps;
create trigger update_roadmaps_updated_at before update on roadmaps for each row execute procedure update_updated_at_column();


-- ============================================================
-- TABLE: roadmap_steps
-- parent_step_id: branching support
-- ============================================================
create table if not exists roadmap_steps (
  id uuid default gen_random_uuid() primary key,
  roadmap_id uuid references roadmaps(id) on delete cascade not null,
  parent_step_id uuid references roadmap_steps(id) on delete set null,
  title text not null,
  description text,
  "order" integer not null,
  linked_resource_id uuid references resources(id) on delete set null,
  linked_task_id uuid references tasks(id) on delete set null,
  completed boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table roadmap_steps enable row level security;

drop policy if exists "Users can view roadmap steps"   on roadmap_steps;
drop policy if exists "Users can insert roadmap steps" on roadmap_steps;
drop policy if exists "Users can update roadmap steps" on roadmap_steps;
drop policy if exists "Users can delete roadmap steps" on roadmap_steps;
create policy "Users can view roadmap steps" on roadmap_steps
  for select using (exists (
    select 1 from roadmaps where roadmaps.id = roadmap_steps.roadmap_id and (
      roadmaps.owner_id = (select auth.uid()) or
      (roadmaps.team_id is not null and exists (select 1 from team_members where team_members.team_id = roadmaps.team_id and team_members.user_id = (select auth.uid()))) or
      (roadmaps.project_id is not null and exists (select 1 from team_members join projects on projects.team_id = team_members.team_id where projects.id = roadmaps.project_id and team_members.user_id = (select auth.uid()))) or
      exists (select 1 from chat_shared_items join team_members on team_members.team_id = chat_shared_items.team_id where chat_shared_items.shared_item_id = roadmaps.id and chat_shared_items.shared_type = 'roadmap' and team_members.user_id = (select auth.uid()))
    )
  ));
create policy "Users can insert roadmap steps" on roadmap_steps
  for insert with check (exists (select 1 from roadmaps where roadmaps.id = roadmap_steps.roadmap_id and roadmaps.owner_id = (select auth.uid())));
create policy "Users can update roadmap steps" on roadmap_steps
  for update using (exists (select 1 from roadmaps where roadmaps.id = roadmap_steps.roadmap_id and roadmaps.owner_id = (select auth.uid())));
create policy "Users can delete roadmap steps" on roadmap_steps
  for delete using (exists (select 1 from roadmaps where roadmaps.id = roadmap_steps.roadmap_id and roadmaps.owner_id = (select auth.uid())));

drop trigger if exists update_roadmap_steps_updated_at on roadmap_steps;
create trigger update_roadmap_steps_updated_at before update on roadmap_steps for each row execute procedure update_updated_at_column();


-- ============================================================
-- TABLE: roadmap_step_links
-- ============================================================
create table if not exists roadmap_step_links (
  id uuid default gen_random_uuid() primary key,
  step_id uuid references roadmap_steps(id) on delete cascade not null,
  linked_step_id uuid references roadmap_steps(id) on delete cascade not null,
  link_type text default 'dependency',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (step_id, linked_step_id)
);

alter table roadmap_step_links enable row level security;

drop policy if exists "Users can view roadmap step links"   on roadmap_step_links;
drop policy if exists "Users can insert roadmap step links" on roadmap_step_links;
drop policy if exists "Users can update roadmap step links" on roadmap_step_links;
drop policy if exists "Users can delete roadmap step links" on roadmap_step_links;
create policy "Users can view roadmap step links" on roadmap_step_links
  for select using (exists (
    select 1 from roadmap_steps
    join roadmaps on roadmaps.id = roadmap_steps.roadmap_id
    where roadmap_steps.id = roadmap_step_links.step_id
    and (
      roadmaps.owner_id = (select auth.uid()) or
      (roadmaps.team_id is not null and exists (select 1 from team_members where team_members.team_id = roadmaps.team_id and team_members.user_id = (select auth.uid()))) or
      (roadmaps.project_id is not null and exists (select 1 from team_members join projects on projects.team_id = team_members.team_id where projects.id = roadmaps.project_id and team_members.user_id = (select auth.uid()))) or
      exists (select 1 from chat_shared_items join team_members on team_members.team_id = chat_shared_items.team_id where chat_shared_items.shared_item_id = roadmaps.id and chat_shared_items.shared_type = 'roadmap' and team_members.user_id = (select auth.uid()))
    )
  ));
create policy "Users can insert roadmap step links" on roadmap_step_links
  for insert with check (exists (select 1 from roadmap_steps join roadmaps on roadmaps.id = roadmap_steps.roadmap_id where roadmap_steps.id = roadmap_step_links.step_id and roadmaps.owner_id = (select auth.uid())));
create policy "Users can update roadmap step links" on roadmap_step_links
  for update using (exists (select 1 from roadmap_steps join roadmaps on roadmaps.id = roadmap_steps.roadmap_id where roadmap_steps.id = roadmap_step_links.step_id and roadmaps.owner_id = (select auth.uid())));
create policy "Users can delete roadmap step links" on roadmap_step_links
  for delete using (exists (select 1 from roadmap_steps join roadmaps on roadmaps.id = roadmap_steps.roadmap_id where roadmap_steps.id = roadmap_step_links.step_id and roadmaps.owner_id = (select auth.uid())));


-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do nothing;

drop policy if exists "Public Access"                  on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Users can update own files"     on storage.objects;
drop policy if exists "Users can delete own files"     on storage.objects;
create policy "Public Access"                  on storage.objects for select using (bucket_id = 'resources');
create policy "Authenticated users can upload" on storage.objects for insert to authenticated with check (bucket_id = 'resources');
create policy "Users can update own files"     on storage.objects for update to authenticated using (bucket_id = 'resources' and auth.uid() = owner);
create policy "Users can delete own files"     on storage.objects for delete to authenticated using (bucket_id = 'resources' and auth.uid() = owner);


-- ============================================================
-- REALTIME PUBLICATIONS
-- ============================================================
-- Idempotent realtime publication (no IF NOT EXISTS in PG, so catch duplicate error)
do $$ begin alter publication supabase_realtime add table team_messages;      exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table message_reads;       exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table roadmaps;            exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table roadmap_steps;       exception when sqlstate '42710' then null; end $$;
do $$ begin alter publication supabase_realtime add table roadmap_step_links;  exception when sqlstate '42710' then null; end $$;


-- ============================================================
-- SCHEMA SUMMARY — 22 Tables
-- ============================================================
-- Core:     users, collections, resources, notes, flashcards,
--           learning_paths, paths (legacy)
-- Habits:   habits, habit_logs
-- Work:     tasks, goals
-- Finance:  categories, transactions
-- Teams:    teams, team_members, projects, project_members,
--           team_messages, message_reads, chat_shared_items
-- Roadmaps: roadmaps, roadmap_steps, roadmap_step_links
--
-- Key: All CREATE POLICY statements are preceded by
--      DROP POLICY IF EXISTS for safe re-runs (idempotent).
-- ============================================================
