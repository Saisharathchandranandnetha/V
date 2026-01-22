-- Policies for Team Members Management

-- Allow owners to add members (Insert)
create policy "Owners can add members" on team_members
  for insert with check (
    exists (
      select 1 from team_members as requestor
      where requestor.team_id = team_members.team_id
      and requestor.user_id = auth.uid()
      and requestor.role = 'owner'
    )
  );

-- Allow owners to update members (Update roles)
create policy "Owners can update members" on team_members
  for update using (
    exists (
      select 1 from team_members as requestor
      where requestor.team_id = team_members.team_id
      and requestor.user_id = auth.uid()
      and requestor.role = 'owner'
    )
  );

-- Allow owners to remove members (Delete)
create policy "Owners can remove members" on team_members
  for delete using (
    exists (
      select 1 from team_members as requestor
      where requestor.team_id = team_members.team_id
      and requestor.user_id = auth.uid()
      and requestor.role = 'owner'
    )
  );
