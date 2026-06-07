insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-media',
  'complaint-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone can upload complaint media files"
on storage.objects for insert
with check (bucket_id = 'complaint-media');

create policy "Admins can read complaint media files"
on storage.objects for select
using (bucket_id = 'complaint-media' and public.is_admin());

create policy "Super admins can delete complaint media files"
on storage.objects for delete
using (bucket_id = 'complaint-media' and public.current_user_role() = 'SUPER_ADMIN');
