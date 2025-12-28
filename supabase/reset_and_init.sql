-- DANGEROUS: This script will delete all data in the public schema!
-- usage: Run this in the Supabase SQL Editor to reset your app database.

-- 1. DROP EXISTING TABLES (Cleanup)
DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS learning_paths CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS delete_user();

-- 2. RE-CREATE SCHEMA (Full Schema)

-- 2.1 USERS & PROFILES
create table users (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  name text,
  avatar text,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table users enable row level security;

create policy "Users can view their own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on users
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on users
  for insert with check (auth.uid() = id);

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

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication errors
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();


-- 2.2 COLLECTIONS (Base for resources)
create table collections (
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


-- 2.3 RESOURCES & LEARNING PATHS
create table resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null check (type in ('url', 'pdf', 'youtube', 'gltf', 'spline', 'image')),
  url text,
  summary text,
  tags text[],
  collection_id uuid references collections(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade default auth.uid()
);

create table learning_paths (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  links text[],
  collection_id uuid references collections(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade default auth.uid()
);

alter table resources enable row level security;
alter table learning_paths enable row level security;

create policy "Users can view their own resources" on resources
  for select using (auth.uid() = user_id);
create policy "Users can insert their own resources" on resources
  for insert with check (auth.uid() = user_id);
create policy "Users can delete their own resources" on resources
  for delete using (auth.uid() = user_id);
create policy "Users can update their own resources" on resources
  for update using (auth.uid() = user_id);

create policy "Users can view their own learning paths" on learning_paths
  for select using (auth.uid() = user_id);
create policy "Users can insert their own learning paths" on learning_paths
  for insert with check (auth.uid() = user_id);
create policy "Users can delete their own learning paths" on learning_paths
  for delete using (auth.uid() = user_id);
create policy "Users can update their own learning paths" on learning_paths
  for update using (auth.uid() = user_id);


-- 2.4 SECOND BRAIN (Core Tables)
CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  frequency TEXT DEFAULT 'Daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habits" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(habit_id, date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own habit logs" ON habit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()));
CREATE POLICY "Users can insert their own habit logs" ON habit_logs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()));
CREATE POLICY "Users can update their own habit logs" ON habit_logs FOR UPDATE USING (EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()));
CREATE POLICY "Users can delete their own habit logs" ON habit_logs FOR DELETE USING (EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid()));

CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
  status TEXT CHECK (status IN ('Todo', 'In Progress', 'Done')) DEFAULT 'Todo',
  due_date TIMESTAMP WITH TIME ZONE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('Short Term', 'Mid Term', 'Long Term')) DEFAULT 'Short Term',
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  deadline DATE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON goals FOR DELETE USING (auth.uid() = user_id);


-- 2.5 FINANCES
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Income', 'Expense')) NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE transactions (
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
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);


-- 2.6 NOTES
create table notes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  collection_id uuid references collections(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notes enable row level security;
create policy "Users can view their own notes" on notes for select using (auth.uid() = user_id);
create policy "Users can insert their own notes" on notes for insert with check (auth.uid() = user_id);
create policy "Users can update their own notes" on notes for update using (auth.uid() = user_id);
create policy "Users can delete their own notes" on notes for delete using (auth.uid() = user_id);


-- 3. UTILITY FUNCTIONS
-- Function to allow users to delete their own account (bypass service role key)
create or replace function delete_user()
returns void
language sql
security definer
as $$
  delete from auth.users where id = auth.uid();
$$;

grant execute on function delete_user() to authenticated;


-- 4. RESTORE PROFILES (Fix for Orphaned Accounts)
-- This block re-inserts profiles for any existing Auth users so they aren't broken after the reset
insert into public.users (id, email, name, avatar)
select id, email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;
