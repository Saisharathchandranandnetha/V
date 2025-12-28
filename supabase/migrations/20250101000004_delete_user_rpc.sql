-- Function to allow users to delete their own account
-- This runs with "security definer" privileges, meaning it uses the permissions of the creator (postgres/admin)
-- preventing the need for the Service Role Key in the client app.

create or replace function delete_user()
returns void
language sql
security definer
as $$
  delete from auth.users where id = auth.uid();
$$;

-- Grant execute permission to authenticated users
grant execute on function delete_user() to authenticated;
