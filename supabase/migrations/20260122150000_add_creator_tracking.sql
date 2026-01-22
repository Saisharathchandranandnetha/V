-- Add created_by column to teams
alter table teams
add column if not exists created_by uuid references auth.users(id);

-- Add created_by column to projects
alter table projects
add column if not exists created_by uuid references auth.users(id);

-- Backfill created_by for existing teams (infer from oldest owner)
update teams
set created_by = (
  select user_id
  from team_members
  where team_members.team_id = teams.id
  and role = 'owner'
  order by joined_at asc
  limit 1
)
where created_by is null;

-- Backfill created_by for existing projects (infer from team creator)
update projects
set created_by = (
  select created_by
  from teams
  where teams.id = projects.team_id
)
where created_by is null;
