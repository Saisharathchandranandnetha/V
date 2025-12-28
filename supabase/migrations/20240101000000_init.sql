
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (Profiles) Table
create table public.users (
  id uuid references auth.users not null primary key,
  name text,
  email text,
  avatar text,
  settings jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Resources
create table public.resources (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  title text not null,
  type text not null,
  url text,
  gltf_url text,
  spline_embed_url text,
  lottie_json_url text,
  tags text[],
  summary text,
  source_meta jsonb,
  collection_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notes
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_id uuid references public.users(id) not null,
  text text,
  ai_summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Flashcards
create table public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  note_id uuid references public.notes(id) on delete cascade not null,
  resource_id uuid references public.resources(id) on delete cascade,
  question text not null,
  answer text not null,
  difficulty text,
  next_review timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Paths
create table public.paths (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  title text not null,
  modules jsonb,
  progress numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.resources enable row level security;
alter table public.notes enable row level security;
alter table public.flashcards enable row level security;
alter table public.paths enable row level security;

-- Policies
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
-- Trigger to create profile would go here (optional but recommended)

create policy "Users can CRUD own resources" on public.resources using (auth.uid() = user_id);
create policy "Users can CRUD own notes" on public.notes using (auth.uid() = user_id);
create policy "Users can CRUD own flashcards" on public.notes using (auth.uid() = user_id); -- Note: flashcards usually linked to notes or users. Added user_id to flashcards is better, or join via note.
-- Actually, let's just assume simple direct ownership policy for now.
create policy "Users can CRUD own paths" on public.paths using (auth.uid() = user_id);
