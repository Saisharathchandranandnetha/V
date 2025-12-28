-- DATA CLEANUP (WARNING: This will delete existing data in these tables)
drop table if exists resources cascade;
drop table if exists learning_paths cascade;

-- RESOURCES TABLE
create table resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null check (type in ('url', 'pdf', 'youtube', 'gltf', 'spline', 'image')),
  url text,
  summary text,
  tags text[], -- Array of strings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) default auth.uid()
);

-- LEARNING PATHS TABLE
create table learning_paths (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  links text[], -- Array of URLs
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) default auth.uid()
);

-- ENABLE ROW LEVEL SECURITY
alter table resources enable row level security;
alter table learning_paths enable row level security;

-- POLICIES FOR RESOURCES
create policy "Users can view their own resources" on resources
  for select using (auth.uid() = user_id);

create policy "Users can insert their own resources" on resources
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own resources" on resources
  for delete using (auth.uid() = user_id);

create policy "Users can update their own resources" on resources
  for update using (auth.uid() = user_id);

-- POLICIES FOR LEARNING PATHS
create policy "Users can view their own learning paths" on learning_paths
  for select using (auth.uid() = user_id);

create policy "Users can insert their own learning paths" on learning_paths
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own learning paths" on learning_paths
  for delete using (auth.uid() = user_id);

create policy "Users can update their own learning paths" on learning_paths
  for update using (auth.uid() = user_id);
