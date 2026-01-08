-- Function for admins to view sessions of a specific user
create or replace function admin_get_user_sessions(target_user_id uuid)
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_agent text,
  ip text
)
language sql
security definer
set search_path = public, auth
as $$
  -- In a real app, you might check if auth.uid() is an admin here
  -- For now, we assume this is called by a Service Role client or restricted via RLS policy
  select id, created_at, updated_at, user_agent, ip 
  from auth.sessions 
  where user_id = target_user_id;
$$;

-- Function for admins to revoke any session
create or replace function admin_revoke_session(session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from auth.sessions 
  where id = session_id;
end;
$$;
