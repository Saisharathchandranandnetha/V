-- Create a public bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload files to 'avatars' bucket
create policy "Authenticated users can upload avatars"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' and auth.uid() = owner );

-- Allow authenticated users to update their own avatars
create policy "Users can update their own avatars"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars' and auth.uid() = owner );

-- Allow public access to view avatars
create policy "Public can view avatars"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );

-- Allow users to delete their own avatars
create policy "Users can delete their own avatars"
on storage.objects for delete
to authenticated
using ( bucket_id = 'avatars' and auth.uid() = owner );
