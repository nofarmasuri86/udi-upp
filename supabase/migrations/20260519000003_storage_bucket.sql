-- ────────────────────────────────────────────────────────────────
-- Storage bucket for gallery images
-- הרץ את זה ב-Supabase SQL Editor (פעם אחת בלבד)
-- ────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  true,
  10485760,  -- 10 MB
  array['image/jpeg','image/png','image/webp','image/heic']
)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "gallery_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to view images (public bucket)
create policy "gallery_read"
  on storage.objects for select
  using (bucket_id = 'gallery');

-- Allow users to delete their own images
create policy "gallery_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
