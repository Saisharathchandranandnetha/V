-- Create Teams Table
create table if not exists teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Team Members Table
create table if not exists team_members (
  team_id uuid references teams(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('owner', 'admin', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (team_id, user_id)
);

-- Create Projects Table
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Team Messages Table
create table if not exists team_messages (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  sender_id uuid references auth.users(id) on delete set null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Message Reads Table
create table if not exists message_reads (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references team_messages(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (message_id, user_id)
);

-- Modify Tasks Table to add team context and link to chat
alter table tasks 
add column if not exists team_id uuid references teams(id) on delete cascade,
add column if not exists project_id uuid references projects(id) on delete set null,
add column if not exists assigned_to uuid references auth.users(id) on delete set null,
add column if not exists created_from_message_id uuid references team_messages(id) on delete set null;

-- Enable RLS
alter table teams enable row level security;
alter table team_members enable row level security;
alter table projects enable row level security;
alter table team_messages enable row level security;
alter table message_reads enable row level security;

-- Policies for Teams
-- Users can view teams they are members of
create policy "Users can view teams they belong to" on teams
  for select using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
    )
  );

-- Policies for Team Members
-- Users can view members of their teams
create policy "Users can view members of their teams" on team_members
  for select using (
    exists (
      select 1 from team_members as tm
      where tm.team_id = team_members.team_id
      and tm.user_id = auth.uid()
    )
  );

-- Policies for Projects
-- Users can view projects in their teams
create policy "Users can view projects in their teams" on projects
  for select using (
    exists (
      select 1 from team_members
      where team_members.team_id = projects.team_id
      and team_members.user_id = auth.uid()
    )
  );

-- Policies for Team Messages
-- Users can view messages in their teams
create policy "Users can view messages in their teams" on team_messages
  for select using (
    exists (
      select 1 from team_members
      where team_members.team_id = team_messages.team_id
      and team_members.user_id = auth.uid()
    )
  );

-- Users can insert messages in their teams
create policy "Users can send messages in their teams" on team_messages
  for insert with check (
    exists (
      select 1 from team_members
      where team_members.team_id = team_messages.team_id
      and team_members.user_id = auth.uid()
    )
  );

-- Policies for Message Reads
-- Users can view read receipts in their teams
create policy "Users can view read receipts in their teams" on message_reads
  for select using (
    exists (
      select 1 from team_messages
      join team_members on team_members.team_id = team_messages.team_id
      where team_messages.id = message_reads.message_id
      and team_members.user_id = auth.uid()
    )
  );

-- Users can insert their own read receipts
create policy "Users can insert their own read receipts" on message_reads
  for insert with check (
    auth.uid() = user_id
    and exists (
       select 1 from team_messages
       join team_members on team_members.team_id = team_messages.team_id
       where team_messages.id = message_reads.message_id
       and team_members.user_id = auth.uid()
    )
  );

-- Enable Realtime for Messages
alter publication supabase_realtime add table team_messages;
alter publication supabase_realtime add table message_reads;
