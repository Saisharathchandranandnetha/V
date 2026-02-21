-- Add role column to users table
alter table users 
add column if not exists role text default 'user' check (role in ('user', 'team_only', 'admin'));

-- Update existing users to have 'user' role if null
update users set role = 'user' where role is null;

-- Update the handle_new_user function to include role
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;
