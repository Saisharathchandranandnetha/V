-- COMBINED SUPABASE SCHEMA
-- Generated from active migrations

-- 1. USERS & PROFILES
-- From: 20250101000000_create_users.sql

-- Create users table if it doesn't exist
create table if not exists users (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  name text,
  avatar text,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table users enable row level security;

-- Policies
create policy "Users can view their own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on users
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on users
  for insert with check (auth.uid() = id);

-- Trigger to handle updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on users
  for each row
  execute procedure handle_updated_at();

-- Trigger to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication errors on re-runs during dev
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();


-- 2. RESOURCES & LEARNING PATHS
-- From: schema.sql

-- Resources Table
create table if not exists resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null check (type in ('url', 'pdf', 'youtube', 'gltf', 'spline', 'image')),
  url text,
  summary text,
  tags text[], -- Array of strings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade default auth.uid() -- Added Cascade directly
);

-- Learning Paths Table
create table if not exists learning_paths (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  links text[], -- Array of URLs
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade default auth.uid() -- Added Cascade directly
);

-- Enable RLS
alter table resources enable row level security;
alter table learning_paths enable row level security;

-- Policies for Resources
create policy "Users can view their own resources" on resources
  for select using (auth.uid() = user_id);

create policy "Users can insert their own resources" on resources
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own resources" on resources
  for delete using (auth.uid() = user_id);

create policy "Users can update their own resources" on resources
  for update using (auth.uid() = user_id);

-- Policies for Learning Paths
create policy "Users can view their own learning paths" on learning_paths
  for select using (auth.uid() = user_id);

create policy "Users can insert their own learning paths" on learning_paths
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own learning paths" on learning_paths
  for delete using (auth.uid() = user_id);

create policy "Users can update their own learning paths" on learning_paths
  for update using (auth.uid() = user_id);


-- 3. SECOND BRAIN (HABITS, TASKS, GOALS, FINANCES)
-- From: 20241219155000_second_brain_schema.sql

-- Habits Table
CREATE TABLE IF NOT EXISTS habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT DEFAULT 'Daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" ON habits
  FOR DELETE USING (auth.uid() = user_id);


-- Habit Logs Table
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(habit_id, date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own habit logs" ON habit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own habit logs" ON habit_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own habit logs" ON habit_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own habit logs" ON habit_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()
    )
  );


-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
  status TEXT CHECK (status IN ('Todo', 'In Progress', 'Done')) DEFAULT 'Todo',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);


-- Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('Short Term', 'Mid Term', 'Long Term')) DEFAULT 'Short Term',
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);


-- Categories Table (for Finances)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Income', 'Expense')) NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);


-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('Income', 'Expense')) NOT NULL,
  amount NUMERIC NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT, 
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);


-- 4. NOTES
-- From: 20240523000000_create_notes_table.sql
-- (Cleaned up: removed drop table to avoid accidental data loss if this runs on prod, but IF NOT EXISTS handles creation)

create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(), -- Added Cascade directly
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table notes enable row level security;

-- Policies
create policy "Users can view their own notes" on notes
  for select using (auth.uid() = user_id);

create policy "Users can insert their own notes" on notes
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own notes" on notes
  for update using (auth.uid() = user_id);

create policy "Users can delete their own notes" on notes
  for delete using (auth.uid() = user_id);


-- 5. COLLECTIONS
-- From: 20250101000001_create_collections.sql

create table if not exists collections (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) default auth.uid() not null
);

alter table collections enable row level security;

create policy "Users can view their own collections" on collections
  for select using (auth.uid() = user_id);

create policy "Users can insert their own collections" on collections
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own collections" on collections
  for update using (auth.uid() = user_id);

create policy "Users can delete their own collections" on collections
  for delete using (auth.uid() = user_id);


-- 6. ALTERATIONS & FIXES
-- From: 20250101000002_add_collection_to_resources.sql

alter table resources 
add column if not exists collection_id uuid references collections(id) on delete set null;

-- From: 20250101000003_fix_user_deletion.sql
-- (Note: I already applied the ON DELETE CASCADE directly to the tables above in their CREATE statements for cleanliness, 
-- but I Include them here as ALTERs just in case tables already existed without them when running this script)

ALTER TABLE notes
  DROP CONSTRAINT IF EXISTS notes_user_id_fkey, 
  ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE resources
  DROP CONSTRAINT IF EXISTS resources_user_id_fkey,
  ADD CONSTRAINT resources_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE learning_paths
  DROP CONSTRAINT IF EXISTS learning_paths_user_id_fkey,
  ADD CONSTRAINT learning_paths_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
