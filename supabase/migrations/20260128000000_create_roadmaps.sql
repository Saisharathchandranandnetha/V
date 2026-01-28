-- Create Roadmaps Table
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Roadmap Steps Table
create table if not exists roadmap_steps (
  id uuid default gen_random_uuid() primary key,
  roadmap_id uuid references roadmaps(id) on delete cascade not null,
  title text not null,
  description text,
  "order" integer not null,
  linked_resource_id uuid references resources(id) on delete set null,
  linked_task_id uuid references tasks(id) on delete set null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update chat_shared_items constraint to include 'roadmap'
alter table chat_shared_items drop constraint if exists chat_shared_items_shared_type_check;
alter table chat_shared_items add constraint chat_shared_items_shared_type_check 
  check (shared_type in ('resource', 'note', 'learning_path', 'roadmap', 'finance'));

-- Enable RLS
alter table roadmaps enable row level security;
alter table roadmap_steps enable row level security;

-- Policies for Roadmaps

-- View policy:
-- 1. Owner can view
-- 2. Team members can view if attached to team
-- 3. Project members can view if attached to project
create policy "Users can view roadmaps" on roadmaps
  for select using (
    auth.uid() = owner_id or
    (team_id is not null and exists (
      select 1 from team_members
      where team_members.team_id = roadmaps.team_id
      and team_members.user_id = auth.uid()
    )) or
    (project_id is not null and exists (
      select 1 from team_members
      join projects on projects.team_id = team_members.team_id
      where projects.id = roadmaps.project_id
      and team_members.user_id = auth.uid()
    ))
  );

-- Insert policy: Authenticad users can insert
create policy "Users can insert roadmaps" on roadmaps
  for insert with check (
    auth.uid() = owner_id
  );

-- Update policy: Only owner can update
create policy "Users can update their own roadmaps" on roadmaps
  for update using (
    auth.uid() = owner_id
  );

-- Delete policy: Only owner can delete
create policy "Users can delete their own roadmaps" on roadmaps
  for delete using (
    auth.uid() = owner_id
  );

-- Policies for Roadmap Steps

-- Steps inherit access from roadmap
create policy "Users can view roadmap steps" on roadmap_steps
  for select using (
    exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_steps.roadmap_id
      and (
        roadmaps.owner_id = auth.uid() or
        (roadmaps.team_id is not null and exists (
          select 1 from team_members
          where team_members.team_id = roadmaps.team_id
          and team_members.user_id = auth.uid()
        )) or
        (roadmaps.project_id is not null and exists (
          select 1 from team_members
          join projects on projects.team_id = team_members.team_id
          where projects.id = roadmaps.project_id
          and team_members.user_id = auth.uid()
        ))
      )
    )
  );

create policy "Users can insert roadmap steps" on roadmap_steps
  for insert with check (
    exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_steps.roadmap_id
      and roadmaps.owner_id = auth.uid()
    )
  );

create policy "Users can update roadmap steps" on roadmap_steps
  for update using (
    exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_steps.roadmap_id
      and roadmaps.owner_id = auth.uid()
    )
  );

create policy "Users can delete roadmap steps" on roadmap_steps
  for delete using (
    exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_steps.roadmap_id
      and roadmaps.owner_id = auth.uid()
    )
  );

-- Enable Realtime
alter publication supabase_realtime add table roadmaps;
alter publication supabase_realtime add table roadmap_steps;
