-- Drop valid policies to recreate them with sharing logic
drop policy if exists "Users can view roadmaps" on roadmaps;
drop policy if exists "Users can view roadmap steps" on roadmap_steps;

-- Recreate policy for roadmaps with chat sharing logic
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
    )) or
    -- Allow access if shared in chat
    exists (
      select 1 from chat_shared_items
      join team_members on team_members.team_id = chat_shared_items.team_id
      where chat_shared_items.shared_item_id = roadmaps.id
      and chat_shared_items.shared_type = 'roadmap'
      and team_members.user_id = auth.uid()
    )
  );

-- Recreate policy for steps to mirror roadmap access
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
        )) or
        -- Check shared items logic
        exists (
          select 1 from chat_shared_items
          join team_members on team_members.team_id = chat_shared_items.team_id
          where chat_shared_items.shared_item_id = roadmaps.id
          and chat_shared_items.shared_type = 'roadmap'
          and team_members.user_id = auth.uid()
        )
      )
    )
  );
