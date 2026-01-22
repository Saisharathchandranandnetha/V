-- Update Team Member Policies to include Admins
-- Drop existing policies first
drop policy if exists "Owners can add members" on team_members;
drop policy if exists "Owners can update members" on team_members;
drop policy if exists "Owners can remove members" on team_members;

-- Allow owners and admins to add members (Insert)
create policy "Owners and Admins can add members" on team_members
  for insert with check (
    exists (
      select 1 from team_members as requestor
      where requestor.team_id = team_members.team_id
      and requestor.user_id = auth.uid()
      and requestor.role in ('owner', 'admin')
    )
  );

-- Allow owners and admins to update members (Update roles)
create policy "Owners and Admins can update members" on team_members
  for update using (
    exists (
      select 1 from team_members as requestor
      where requestor.team_id = team_members.team_id
      and requestor.user_id = auth.uid()
      and requestor.role in ('owner', 'admin')
    )
  );

-- Allow owners and admins to remove members (Delete)
create policy "Owners and Admins can remove members" on team_members
  for delete using (
    exists (
      select 1 from team_members as requestor
      where requestor.team_id = team_members.team_id
      and requestor.user_id = auth.uid()
      and requestor.role in ('owner', 'admin')
    )
  );

-- Policies for Teams modification
create policy "Owners and Admins can update teams" on teams
  for update using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
      and team_members.role in ('owner', 'admin')
    )
  );

create policy "Owners can delete teams" on teams
  for delete using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
      and team_members.role = 'owner'
    )
  );

-- Policies for Projects modification
create policy "Owners and Admins can insert projects" on projects
  for insert with check (
    exists (
      select 1 from team_members
      where team_members.team_id = projects.team_id
      and team_members.user_id = auth.uid()
      and team_members.role in ('owner', 'admin')
    )
  );

create policy "Owners and Admins can update projects" on projects
  for update using (
    exists (
      select 1 from team_members
      where team_members.team_id = projects.team_id
      and team_members.user_id = auth.uid()
      and team_members.role in ('owner', 'admin')
    )
  );

create policy "Owners and Admins can delete projects" on projects
  for delete using (
    exists (
      select 1 from team_members
      where team_members.team_id = projects.team_id
      and team_members.user_id = auth.uid()
      and team_members.role in ('owner', 'admin')
    )
  );
