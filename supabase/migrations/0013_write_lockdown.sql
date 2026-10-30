-- ViPlay: write lockdown.
-- Run `supabase/migrations/0013_write_lockdown.sql` in the Supabase SQL editor
-- AFTER the earlier migrations. Idempotent: safe to re-run.
--
-- Target model:
--   - anon: read-only. The only write it can cause is record_song_play(),
--     which increments songs.play_count (SECURITY DEFINER RPC).
--   - authenticated: may upload songs and edit their own songs. Catalog
--     (artists/albums/genres) and genre links are writable by authenticated
--     users because uploads resolve them client-side. Playlists stay
--     owner-only (already enforced in 0009).
--   - admin ("visama396") keeps the existing moderation ability to edit/delete
--     any song; deletion still goes through the delete_song RPC.
--
-- This closes the wide-open INSERT/UPDATE policies from 0001/0003/0011 and the
-- anonymous storage uploads, and enables RLS on accounts (which had none).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.current_account_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.accounts where auth_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.accounts
    where auth_id = auth.uid()
      and username = 'visama396'
  );
$$;

revoke all on function public.current_account_id() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.current_account_id() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Accounts: RLS was never enabled. Readable by its owner only; writes go
-- through the SECURITY DEFINER ensure_account_link RPC.
-- ---------------------------------------------------------------------------
alter table public.accounts enable row level security;

drop policy if exists "Accounts readable" on public.accounts;
drop policy if exists "Accounts read own" on public.accounts;
create policy "Accounts read own"
  on public.accounts for select
  to authenticated
  using (auth_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Songs: authenticated users may insert and edit only their own rows.
-- Anonymous visitors keep read access (and the play-count RPC).
-- ---------------------------------------------------------------------------
drop policy if exists "Songs insert" on public.songs;
drop policy if exists "Songs update" on public.songs;
drop policy if exists "Songs delete" on public.songs;

create policy "Songs insert own"
  on public.songs for insert
  to authenticated
  with check (uploaded_by = public.current_account_id());

create policy "Songs update own"
  on public.songs for update
  to authenticated
  using (
    uploaded_by = public.current_account_id()
    or public.is_admin()
  )
  with check (
    uploaded_by = public.current_account_id()
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Catalog: uploads/edit resolve artists/albums/genres client-side, so
-- authenticated users need insert/update. Anonymous users get no writes.
-- ---------------------------------------------------------------------------
drop policy if exists "Artists insert" on public.artists;
create policy "Artists insert"
  on public.artists for insert
  to authenticated
  with check (true);

-- The app never renames artists or genres, so keep those unmodifiable.
drop policy if exists "Artists update" on public.artists;
drop policy if exists "Genres update" on public.genres;

drop policy if exists "Albums insert" on public.albums;
create policy "Albums insert"
  on public.albums for insert
  to authenticated
  with check (true);

-- Albums need updating for the optional year.
drop policy if exists "Albums update" on public.albums;
create policy "Albums update"
  on public.albums for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Genres insert" on public.genres;
create policy "Genres insert"
  on public.genres for insert
  to authenticated
  with check (true);

-- Genre links belong to a song, so only its uploader (or admin) may change
-- them.
drop policy if exists "Song genres insert" on public.song_genres;
create policy "Song genres insert own"
  on public.song_genres for insert
  to authenticated
  with check (
    exists (
      select 1 from public.songs s
      where s.id = song_id
        and (s.uploaded_by = public.current_account_id() or public.is_admin())
    )
  );

drop policy if exists "Song genres delete" on public.song_genres;
create policy "Song genres delete own"
  on public.song_genres for delete
  to authenticated
  using (
    exists (
      select 1 from public.songs s
      where s.id = song_id
        and (s.uploaded_by = public.current_account_id() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: uploads require login; in-place edits/cleanup of lyrics and
-- artwork require owning the object (or being admin).
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can upload audio" on storage.objects;
create policy "Authenticated can upload audio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'audio');

drop policy if exists "Anyone can upload artwork" on storage.objects;
create policy "Authenticated can upload artwork"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'artwork');

drop policy if exists "Anyone can upload lyrics" on storage.objects;
create policy "Authenticated can upload lyrics"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lyrics');

drop policy if exists "Anyone can update lyrics" on storage.objects;
create policy "Owners can update lyrics"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'lyrics' and (owner = auth.uid() or public.is_admin()))
  with check (bucket_id = 'lyrics' and (owner = auth.uid() or public.is_admin()));

drop policy if exists "Anyone can delete lyrics" on storage.objects;
create policy "Owners can delete lyrics"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lyrics' and (owner = auth.uid() or public.is_admin()));

drop policy if exists "Anyone can update artwork" on storage.objects;
create policy "Owners can update artwork"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'artwork' and (owner = auth.uid() or public.is_admin()))
  with check (bucket_id = 'artwork' and (owner = auth.uid() or public.is_admin()));

drop policy if exists "Anyone can delete artwork" on storage.objects;
create policy "Owners can delete artwork"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'artwork' and (owner = auth.uid() or public.is_admin()));

-- ---------------------------------------------------------------------------
-- Functions: anonymous callers may only reach record_song_play().
-- ---------------------------------------------------------------------------
revoke all on function public.ensure_account_link(text, text) from public, anon;
grant execute on function public.ensure_account_link(text, text) to authenticated;

revoke all on function public.delete_song(uuid) from public, anon;
grant execute on function public.delete_song(uuid) to authenticated;

-- Remove the legacy client-supplied-identity overload and the unused
-- password-change RPC.
drop function if exists public.delete_song(uuid, uuid);
drop function if exists public.change_password(uuid, text, text);

-- Safe username availability check for registration (the app used to read the
-- accounts table before being signed in, which RLS now prevents).
create or replace function public.username_taken(p_username text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.accounts
    where lower(username) = lower(btrim(p_username))
  );
$$;

revoke all on function public.username_taken(text) from public;
grant execute on function public.username_taken(text) to anon, authenticated;
