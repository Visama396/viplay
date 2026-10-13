-- ViPlay schema (consolidated single migration).
-- Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor.
-- Idempotent: safe to re-run on an existing database.
--
-- Songs, playlists and their relationship, plus storage buckets for
-- audio, artwork and lyrics (LRC format) files. Auth is Supabase Auth with a
-- username-based fake email (`${username}@app.local`); the `accounts` table
-- links each auth user to its profile via `auth_id`, and RLS trusts
-- `auth.uid()`. Only playlist creators can edit their playlists; song
-- deletion is admin-only via the `delete_song` RPC.

-- ---------------------------------------------------------------------------
-- Accounts (profile linked to Supabase Auth)
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null default '',
  display_name text,
  auth_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.accounts
  add column if not exists password_hash text;
alter table public.accounts
  add column if not exists display_name text;
alter table public.accounts
  add column if not exists auth_id uuid references auth.users (id) on delete cascade;

create unique index if not exists idx_accounts_auth_id on public.accounts (auth_id);

-- ---------------------------------------------------------------------------
-- Songs
-- ---------------------------------------------------------------------------
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  album text,
  duration integer,
  audio_path text not null,
  artwork_path text,
  lyrics_path text,
  secondary_lyrics_path text,
  secondary_lyrics_label text,
  uploaded_by uuid references public.accounts (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.songs
  add column if not exists uploaded_by uuid references public.accounts (id) on delete set null;

comment on table public.songs is 'Songs with pointers (paths) to files in the audio/artwork/lyrics storage buckets.';

alter table public.songs enable row level security;

drop policy if exists "Songs are publicly readable" on public.songs;
create policy "Songs are publicly readable"
  on public.songs for select
  to anon, authenticated
  using (true);

-- In-app uploads run client-side, so inserts/updates are open; song deletion
-- is admin-only via the delete_song RPC (no delete policy).
drop policy if exists "Songs insert" on public.songs;
create policy "Songs insert"
  on public.songs for insert
  with check (true);

drop policy if exists "Songs update" on public.songs;
create policy "Songs update"
  on public.songs for update
  using (true);

drop policy if exists "Songs delete" on public.songs;

-- ---------------------------------------------------------------------------
-- Playlists (public/private, creator attribution, owner-only writes)
-- ---------------------------------------------------------------------------
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  user_id uuid references public.accounts (id) on delete set null,
  is_public boolean not null default true,
  creator_name text,
  created_at timestamptz not null default now()
);

alter table public.playlists
  add column if not exists is_public boolean not null default true;
alter table public.playlists
  add column if not exists creator_name text;

comment on table public.playlists is 'Playlists. Private ones are visible only to their creator (user_id); creator_name is the display name shown in the app.';

alter table public.playlists enable row level security;

drop policy if exists "Playlists readable" on public.playlists;
drop policy if exists "Playlists insert" on public.playlists;
drop policy if exists "Playlists update" on public.playlists;
drop policy if exists "Playlists delete" on public.playlists;
drop policy if exists "Playlists insert own" on public.playlists;
drop policy if exists "Playlists update own" on public.playlists;
drop policy if exists "Playlists delete own" on public.playlists;

create policy "Playlists readable"
  on public.playlists for select
  to anon, authenticated
  using (
    is_public = true
    or user_id is null
    or user_id in (select id from public.accounts where auth_id = auth.uid())
  );

create policy "Playlists insert own"
  on public.playlists for insert
  to authenticated
  with check (
    user_id is not null
    and user_id in (select id from public.accounts where auth_id = auth.uid())
  );

create policy "Playlists update own"
  on public.playlists for update
  to authenticated
  using (user_id in (select id from public.accounts where auth_id = auth.uid()))
  with check (
    user_id is not null
    and user_id in (select id from public.accounts where auth_id = auth.uid())
  );

create policy "Playlists delete own"
  on public.playlists for delete
  to authenticated
  using (user_id in (select id from public.accounts where auth_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Playlist <-> Song join table
-- ---------------------------------------------------------------------------
create table if not exists public.playlist_songs (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  song_id uuid not null references public.songs (id) on delete cascade,
  position integer not null default 0,
  unique (playlist_id, song_id)
);

alter table public.playlist_songs enable row level security;

drop policy if exists "Playlist songs readable" on public.playlist_songs;
drop policy if exists "Playlist songs insert" on public.playlist_songs;
drop policy if exists "Playlist songs delete" on public.playlist_songs;
drop policy if exists "Playlist songs insert own" on public.playlist_songs;
drop policy if exists "Playlist songs delete own" on public.playlist_songs;

-- Reads follow parent playlist visibility.
create policy "Playlist songs readable"
  on public.playlist_songs for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id
        and (
          p.is_public = true
          or p.user_id is null
          or p.user_id in (select id from public.accounts where auth_id = auth.uid())
        )
    )
  );

-- Writes follow parent ownership (only the creator edits).
create policy "Playlist songs insert own"
  on public.playlist_songs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id
        and p.user_id in (select id from public.accounts where auth_id = auth.uid())
    )
  );

create policy "Playlist songs delete own"
  on public.playlist_songs for delete
  to authenticated
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id
        and p.user_id in (select id from public.accounts where auth_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Account RPCs
-- ---------------------------------------------------------------------------
-- Links the Supabase Auth user to its accounts row (creating it on first
-- login/register), so the app can derive Account from the verified token.
create or replace function public.ensure_account_link(
  p_username text,
  p_display_name text
) returns public.accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.accounts;
begin
  select * into v_account
  from public.accounts
  where auth_id = auth.uid();

  if v_account.id is null then
    insert into public.accounts (username, password_hash, display_name, auth_id)
    values (p_username, '', p_display_name, auth.uid())
    returning * into v_account;
  else
    update public.accounts
    set username = p_username,
        display_name = coalesce(nullif(p_display_name, ''), display_name)
    where id = v_account.id
    returning * into v_account;
  end if;

  return v_account;
end;
$$;

revoke all on function public.ensure_account_link(text, text) from public;
grant execute on function public.ensure_account_link(text, text) to anon, authenticated;

-- Legacy password-change RPC (kept for compatibility; the app now changes
-- passwords through Supabase Auth instead).
create or replace function public.change_password(
  p_account_id uuid,
  p_current_password_hash text,
  p_new_password_hash text
) returns boolean
language plpgsql
security definer
as $$
begin
  update public.accounts
  set password_hash = p_new_password_hash
  where id = p_account_id
    and password_hash = p_current_password_hash;

  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin-only song deletion (row + storage files).
-- Identity comes from the signed JWT (auth.uid()); only "visama396" may call.
-- Newer Supabase blocks direct DELETE on storage.objects unless the Storage
-- API session flags are set, hence the set_config calls below.
-- ---------------------------------------------------------------------------
create or replace function public.delete_song(p_song_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_username text;
  v_song public.songs%rowtype;
begin
  select a.username into v_username
  from public.accounts a
  where a.auth_id = auth.uid();

  if v_username is distinct from 'visama396' then
    return false;
  end if;

  select * into v_song
  from public.songs
  where id = p_song_id;

  if not found then
    return false;
  end if;

  -- Allow the Storage API-compatible direct delete from this definer context.
  perform set_config('storage.allow_delete_query', 'true', true);
  perform set_config('storage.can_delete', 'true', true);

  if v_song.audio_path is not null then
    begin
      delete from storage.objects
      where bucket_id = 'audio' and name = v_song.audio_path;
    exception when others then null;
    end;
  end if;

  if v_song.artwork_path is not null then
    begin
      delete from storage.objects
      where bucket_id = 'artwork' and name = v_song.artwork_path;
    exception when others then null;
    end;
  end if;

  if v_song.lyrics_path is not null then
    begin
      delete from storage.objects
      where bucket_id = 'lyrics' and name = v_song.lyrics_path;
    exception when others then null;
    end;
  end if;

  delete from public.songs where id = p_song_id;

  return found;
end;
$$;

revoke all on function public.delete_song(uuid) from public;
grant execute on function public.delete_song(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('audio', 'audio', true),
  ('artwork', 'artwork', true),
  ('lyrics', 'lyrics', true)
on conflict (id) do nothing;

-- Public read access to all three buckets (artwork and audio are public assets;
-- lyrics are fetched client-side so they must be publicly readable).
drop policy if exists "Public read audio" on storage.objects;
create policy "Public read audio"
  on storage.objects for select
  using (bucket_id = 'audio');

drop policy if exists "Public read artwork" on storage.objects;
create policy "Public read artwork"
  on storage.objects for select
  using (bucket_id = 'artwork');

drop policy if exists "Public read lyrics" on storage.objects;
create policy "Public read lyrics"
  on storage.objects for select
  using (bucket_id = 'lyrics');

-- In-app uploads run client-side with the anon key.
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Anyone can upload audio" on storage.objects;
create policy "Anyone can upload audio"
  on storage.objects for insert
  with check (bucket_id = 'audio');

drop policy if exists "Anyone can upload artwork" on storage.objects;
create policy "Anyone can upload artwork"
  on storage.objects for insert
  with check (bucket_id = 'artwork');

drop policy if exists "Anyone can upload lyrics" on storage.objects;
create policy "Anyone can upload lyrics"
  on storage.objects for insert
  with check (bucket_id = 'lyrics');

-- In-place lyric/artwork edits (upsert to the same object) and old-file
-- cleanup after replacements. Audio stays insert-only (deleted via RPC).
drop policy if exists "Anyone can update lyrics" on storage.objects;
create policy "Anyone can update lyrics"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'lyrics')
  with check (bucket_id = 'lyrics');

drop policy if exists "Anyone can delete lyrics" on storage.objects;
create policy "Anyone can delete lyrics"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'lyrics');

drop policy if exists "Anyone can update artwork" on storage.objects;
create policy "Anyone can update artwork"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'artwork')
  with check (bucket_id = 'artwork');

drop policy if exists "Anyone can delete artwork" on storage.objects;
create policy "Anyone can delete artwork"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'artwork');
