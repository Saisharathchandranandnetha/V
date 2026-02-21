-- Create RPC for atomic team creation
create or replace function create_new_team(team_name text)
returns uuid
language plpgsql
security definer
as $$
declare
  new_team_id uuid;
begin
  -- Insert into teams
  insert into teams (name)
  values (team_name)
  returning id into new_team_id;

  -- Insert into team_members as owner
  insert into team_members (team_id, user_id, role)
  values (new_team_id, auth.uid(), 'owner');

  return new_team_id;
end;
$$;
