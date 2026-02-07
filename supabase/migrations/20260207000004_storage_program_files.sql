-- Create storage bucket for program files
insert into storage.buckets (id, name, public)
values ('program-files', 'program-files', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload files
create policy "Authenticated users can upload program files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'program-files');

-- Allow authenticated users to view files
create policy "Authenticated users can view program files"
on storage.objects for select
to authenticated
using (bucket_id = 'program-files');

-- Allow authenticated users to delete their own uploads or based on RLS
create policy "Authenticated users can delete program files"
on storage.objects for delete
to authenticated
using (bucket_id = 'program-files');
