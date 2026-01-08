-- Run this in your Supabase SQL Editor

-- Function to list active sessions for the current user
create or replace function get_active_sessions()
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
  select id, created_at, updated_at, user_agent, ip 
  from auth.sessions 
  where user_id = auth.uid();
$$;

-- Function to revoke a specific session for the current user
create or replace function revoke_session(session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  delete from auth.sessions 
  where id = session_id and user_id = auth.uid();
end;
$$;
