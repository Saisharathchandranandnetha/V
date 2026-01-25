-- Fix RLS Policy Performance Issues and Duplicates

-- 1. public.project_members (Combine SELECT policies & fix performance)
drop policy if exists "View own project memberships" on project_members;
drop policy if exists "View project members as team member" on project_members;

create policy "View project members" on project_members
  for select using (
    ((select auth.uid()) = user_id)
    OR
    (EXISTS (
        SELECT 1 FROM projects p
        JOIN team_members tm ON tm.team_id = p.team_id
        WHERE p.id = project_members.project_id
        AND tm.user_id = (select auth.uid())
    ))
  );

-- 2. public.teams (Remove duplicate DELETE policy)
-- "Enable delete for team owners" is a duplicate of "Owners can delete their teams" (or vice versa)
-- We will keep "Owners can delete their teams" as it was already optimized (created_by = (select auth.uid()))
drop policy if exists "Enable delete for team owners" on teams;

-- 3. public.projects (Fix performance for DELETE policy)
drop policy if exists "Enable delete for team admins" on projects;

create policy "Enable delete for team admins" on projects
  for delete using (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = projects.team_id
      AND team_members.user_id = (select auth.uid())
      AND team_members.role = ANY (ARRAY['owner'::text, 'admin'::text])
    )
  );
