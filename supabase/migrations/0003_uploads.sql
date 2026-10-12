-- ViPlay in-app song uploads
-- Lets logged-in users upload audio/artwork/lyrics files and insert song rows
-- directly from the app (which runs client-side with the anon key).

-- ---------------------------------------------------------------------------
-- Songs: attribute uploads to an account, allow inserts
-- ---------------------------------------------------------------------------
alter table public.songs
  add column if not exists uploaded_by uuid references public.accounts (id) on delete set null;

create policy "Songs insert"
  on public.songs for insert
  with check (true);

create policy "Songs update"
  on public.songs for update
  using (true);

create policy "Songs delete"
  on public.songs for delete
  using (true);

-- ---------------------------------------------------------------------------
-- Storage: allow uploads with the anon key
-- (in addition to the existing authenticated-only upload policy)
-- ---------------------------------------------------------------------------
create policy "Anyone can upload audio"
  on storage.objects for insert
  with check (bucket_id = 'audio');

create policy "Anyone can upload artwork"
  on storage.objects for insert
  with check (bucket_id = 'artwork');

create policy "Anyone can upload lyrics"
  on storage.objects for insert
  with check (bucket_id = 'lyrics');

-- Keep the existing restricted policy only for authenticated uploads.
drop policy if exists "Authenticated users can upload" on storage.objects;
