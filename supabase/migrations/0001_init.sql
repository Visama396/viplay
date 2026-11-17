-- ===========================================================================
-- ViPlay schema — consolidated migration
-- ===========================================================================
-- Supersedes the old 0001–0017 migration series. Run this whole file in the
-- Supabase SQL editor on a new project (or re-run it on an existing one): it
-- is idempotent.
--
-- Contents:
--   - accounts linked to Supabase Auth (username + fake email)
--   - songs, playlists and their join table
--   - catalog: artists, albums, genres, featured artists
--   - per-account recently played history and shared play counts
--   - RLS policies, RPCs, storage buckets and storage policies
--
-- Auth uses Supabase Auth with a username-based fake email
-- (`${username}@app.local`). `accounts` links each auth user to its profile
-- through `auth_id`, so RLS can trust `auth.uid()`.

-- ===========================================================================
-- 1. Catalog: artists
-- ===========================================================================
create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Unique case-insensitively ("YOASOBI" and "yoasobi" are the same artist).
create unique index if not exists idx_artists_lower_name
  on public.artists (lower(name));

-- ===========================================================================
-- 2. Catalog: albums
-- ===========================================================================
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_id uuid references public.artists (id) on delete set null,
  year integer,
  created_at timestamptz not null default now()
);

-- Same title by the same artist is one album (case-insensitive).
create unique index if not exists idx_albums_artist_lower_title
  on public.albums (artist_id, lower(title));

-- ===========================================================================
-- 3. Catalog: genres
-- ===========================================================================
create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_genres_lower_name
  on public.genres (lower(name));

-- ===========================================================================
-- 4. Accounts (profile linked to Supabase Auth)
-- ===========================================================================
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null default '',
  display_name text,
  auth_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Older installs may predate these columns.
alter table public.accounts
  add column if not exists password_hash text;
alter table public.accounts
  add column if not exists display_name text;
alter table public.accounts
  add column if not exists auth_id uuid references auth.users (id) on delete cascade;

create unique index if not exists idx_accounts_auth_id
  on public.accounts (auth_id);

-- ===========================================================================
-- 5. Songs
-- ===========================================================================
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
  artist_id uuid references public.artists (id) on delete set null,
  album_id uuid references public.albums (id) on delete set null,
  play_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Columns added by later migrations.
alter table public.songs
  add column if not exists secondary_lyrics_path text;
alter table public.songs
  add column if not exists secondary_lyrics_label text;
alter table public.songs
  add column if not exists uploaded_by uuid references public.accounts (id) on delete set null;
alter table public.songs
  add column if not exists artist_id uuid references public.artists (id) on delete set null;
alter table public.songs
  add column if not exists album_id uuid references public.albums (id) on delete set null;
alter table public.songs
  add column if not exists play_count integer not null default 0;

create index if not exists idx_songs_artist_id
  on public.songs (artist_id);
create index if not exists idx_songs_album_id
  on public.songs (album_id);
create index if not exists idx_songs_play_count
  on public.songs (play_count desc);

comment on table public.songs is
  'Songs with pointers (paths) to files in the audio/artwork/lyrics storage buckets.';

-- ===========================================================================
-- 6. Playlists
-- ===========================================================================
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

comment on table public.playlists is
  'Playlists. Private ones are visible only to their creator (user_id); creator_name is the display name shown in the app.';

-- ===========================================================================
-- 7. Playlist <-> Song join table
-- ===========================================================================
create table if not exists public.playlist_songs (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  song_id uuid not null references public.songs (id) on delete cascade,
  position integer not null default 0,
  unique (playlist_id, song_id)
);

-- ===========================================================================
-- 8. Song <-> Genre join table
-- ===========================================================================
create table if not exists public.song_genres (
  song_id uuid not null references public.songs (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete cascade,
  primary key (song_id, genre_id)
);

-- ===========================================================================
-- 9. Featured artists (collaborations)
-- ===========================================================================
create table if not exists public.song_featured_artists (
  song_id uuid not null references public.songs (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,
  position integer not null default 0,
  primary key (song_id, artist_id)
);

create index if not exists idx_song_featured_artists_artist
  on public.song_featured_artists (artist_id);

-- ===========================================================================
-- 10. Recently played history (signed-in users)
-- ===========================================================================
create table if not exists public.recent_plays (
  account_id uuid not null references public.accounts (id) on delete cascade,
  song_id uuid not null references public.songs (id) on delete cascade,
  played_at timestamptz not null default now(),
  primary key (account_id, song_id)
);

create index if not exists idx_recent_plays_account_played_at
  on public.recent_plays (account_id, played_at desc);

-- Speeds up the cascade when a song is deleted.
create index if not exists idx_recent_plays_song
  on public.recent_plays (song_id);

-- ===========================================================================
-- 11. Helper functions
-- ===========================================================================
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

-- ===========================================================================
-- 12. Account RPCs
-- ===========================================================================
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

-- Safe username availability check for registration (accounts is RLS-protected,
-- so anonymous visitors cannot query it directly).
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

-- ===========================================================================
-- 13. Play counts RPC
-- ===========================================================================
-- Atomic increment so concurrent plays across devices don't lose counts.
-- Returns the new total, or null when the song no longer exists.
create or replace function public.record_song_play(p_song_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.songs
  set play_count = play_count + 1
  where id = p_song_id
  returning play_count into v_count;

  return v_count;
end;
$$;

-- ===========================================================================
-- 14. Admin-only song deletion (row + storage files)
-- ===========================================================================
-- Identity comes from the signed JWT (auth.uid()); only "visama396" may call.
-- Newer Supabase blocks direct DELETE on storage.objects unless the Storage API
-- session flags are set, hence the set_config calls below. Covers can be shared
-- by several songs, so artwork is only removed when no other row references it.
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

  -- Shared covers are kept while any other song references the same object.
  if v_song.artwork_path is not null
     and not exists (
       select 1
       from public.songs s
       where s.artwork_path = v_song.artwork_path
         and s.id <> p_song_id
     )
  then
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

  if v_song.secondary_lyrics_path is not null then
    begin
      delete from storage.objects
      where bucket_id = 'lyrics' and name = v_song.secondary_lyrics_path;
    exception when others then null;
    end;
  end if;

  delete from public.songs where id = p_song_id;

  return found;
end;
$$;

-- ===========================================================================
-- 15. Function grants
-- ===========================================================================
-- Supabase grants EXECUTE on new functions to anon/authenticated by default,
-- so revoke from both `public` and `anon` where the function must stay private.
-- After this, anonymous callers can only reach record_song_play() and
-- username_taken().

-- Remove legacy signatures/RPCs from older migrations.
drop function if exists public.delete_song(uuid, uuid);
drop function if exists public.change_password(uuid, text, text);

revoke all on function public.current_account_id() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.current_account_id() to authenticated;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.ensure_account_link(text, text) from public, anon;
grant execute on function public.ensure_account_link(text, text) to authenticated;

revoke all on function public.delete_song(uuid) from public, anon;
grant execute on function public.delete_song(uuid) to authenticated;

-- Intentionally anonymous.
revoke all on function public.record_song_play(uuid) from public;
grant execute on function public.record_song_play(uuid) to anon, authenticated;

revoke all on function public.username_taken(text) from public;
grant execute on function public.username_taken(text) to anon, authenticated;

-- ===========================================================================
-- 16. Accounts RLS
-- ===========================================================================
alter table public.accounts enable row level security;

drop policy if exists "Accounts readable" on public.accounts;
drop policy if exists "Accounts read own" on public.accounts;
create policy "Accounts read own"
  on public.accounts for select
  to authenticated
  using (auth_id = auth.uid());

-- ===========================================================================
-- 17. Songs RLS
-- ===========================================================================
alter table public.songs enable row level security;

drop policy if exists "Songs are publicly readable" on public.songs;
create policy "Songs are publicly readable"
  on public.songs for select
  to anon, authenticated
  using (true);

-- Authenticated users may insert and edit only their own rows; admins may edit
-- any song. Deleting goes through the delete_song RPC (no DELETE policy).
drop policy if exists "Songs insert" on public.songs;
drop policy if exists "Songs insert own" on public.songs;
create policy "Songs insert own"
  on public.songs for insert
  to authenticated
  with check (uploaded_by = public.current_account_id());

drop policy if exists "Songs update" on public.songs;
drop policy if exists "Songs update own" on public.songs;
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

drop policy if exists "Songs delete" on public.songs;

-- ===========================================================================
-- 18. Playlists RLS
-- ===========================================================================
alter table public.playlists enable row level security;

drop policy if exists "Playlists readable" on public.playlists;
drop policy if exists "Playlists insert" on public.playlists;
drop policy if exists "Playlists insert own" on public.playlists;
drop policy if exists "Playlists update" on public.playlists;
drop policy if exists "Playlists update own" on public.playlists;
drop policy if exists "Playlists delete" on public.playlists;
drop policy if exists "Playlists delete own" on public.playlists;

-- Reads stay public, but private playlists are visible only to their owner.
create policy "Playlists readable"
  on public.playlists for select
  to anon, authenticated
  using (
    is_public = true
    or user_id is null
    or user_id in (select id from public.accounts where auth_id = auth.uid())
  );

-- Writes are restricted to the owning account resolved from the verified JWT.
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

-- ===========================================================================
-- 19. Playlist songs RLS
-- ===========================================================================
alter table public.playlist_songs enable row level security;

drop policy if exists "Playlist songs readable" on public.playlist_songs;
drop policy if exists "Playlist songs insert" on public.playlist_songs;
drop policy if exists "Playlist songs insert own" on public.playlist_songs;
drop policy if exists "Playlist songs delete" on public.playlist_songs;
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

-- ===========================================================================
-- 20. Catalog RLS
-- ===========================================================================
alter table public.artists enable row level security;

drop policy if exists "Artists are publicly readable" on public.artists;
drop policy if exists "Artists insert" on public.artists;
drop policy if exists "Artists update" on public.artists;

create policy "Artists are publicly readable"
  on public.artists for select
  to anon, authenticated
  using (true);

-- In-app uploads resolve/create artists client-side, like songs.
create policy "Artists insert"
  on public.artists for insert
  to authenticated
  with check (true);

alter table public.albums enable row level security;

drop policy if exists "Albums are publicly readable" on public.albums;
drop policy if exists "Albums insert" on public.albums;
drop policy if exists "Albums update" on public.albums;

create policy "Albums are publicly readable"
  on public.albums for select
  to anon, authenticated
  using (true);

create policy "Albums insert"
  on public.albums for insert
  to authenticated
  with check (true);

-- Albums need updating for the optional year.
create policy "Albums update"
  on public.albums for update
  to authenticated
  using (true)
  with check (true);

alter table public.genres enable row level security;

drop policy if exists "Genres are publicly readable" on public.genres;
drop policy if exists "Genres insert" on public.genres;
drop policy if exists "Genres update" on public.genres;

create policy "Genres are publicly readable"
  on public.genres for select
  to anon, authenticated
  using (true);

create policy "Genres insert"
  on public.genres for insert
  to authenticated
  with check (true);

-- The app never renames artists or genres, so those stay unmodifiable.

-- ===========================================================================
-- 21. Song genres RLS
-- ===========================================================================
alter table public.song_genres enable row level security;

drop policy if exists "Song genres are publicly readable" on public.song_genres;
drop policy if exists "Song genres insert" on public.song_genres;
drop policy if exists "Song genres insert own" on public.song_genres;
drop policy if exists "Song genres delete" on public.song_genres;
drop policy if exists "Song genres delete own" on public.song_genres;

create policy "Song genres are publicly readable"
  on public.song_genres for select
  to anon, authenticated
  using (true);

-- Genre links belong to a song, so only its uploader (or admin) may change them.
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

-- ===========================================================================
-- 22. Featured artists RLS
-- ===========================================================================
alter table public.song_featured_artists enable row level security;

drop policy if exists "Song featured artists are publicly readable" on public.song_featured_artists;
drop policy if exists "Song featured artists insert" on public.song_featured_artists;
drop policy if exists "Song featured artists insert own" on public.song_featured_artists;
drop policy if exists "Song featured artists delete" on public.song_featured_artists;
drop policy if exists "Song featured artists delete own" on public.song_featured_artists;

create policy "Song featured artists are publicly readable"
  on public.song_featured_artists for select
  to anon, authenticated
  using (true);

-- Featured-artist links belong to a song, so only its uploader (or admin) may
-- change them. Mirrors the song_genres policies.
create policy "Song featured artists insert own"
  on public.song_featured_artists for insert
  to authenticated
  with check (
    exists (
      select 1 from public.songs s
      where s.id = song_id
        and (s.uploaded_by = public.current_account_id() or public.is_admin())
    )
  );

create policy "Song featured artists delete own"
  on public.song_featured_artists for delete
  to authenticated
  using (
    exists (
      select 1 from public.songs s
      where s.id = song_id
        and (s.uploaded_by = public.current_account_id() or public.is_admin())
    )
  );

-- ===========================================================================
-- 23. Recently played RLS
-- ===========================================================================
alter table public.recent_plays enable row level security;

drop policy if exists "Recent plays read own" on public.recent_plays;
drop policy if exists "Recent plays insert own" on public.recent_plays;
drop policy if exists "Recent plays update own" on public.recent_plays;
drop policy if exists "Recent plays delete own" on public.recent_plays;

-- Each account can only see and write its own history. The app upserts on
-- (account_id, song_id), so both the insert and update policies are needed.
create policy "Recent plays read own"
  on public.recent_plays for select
  to authenticated
  using (account_id = public.current_account_id());

create policy "Recent plays insert own"
  on public.recent_plays for insert
  to authenticated
  with check (account_id = public.current_account_id());

create policy "Recent plays update own"
  on public.recent_plays for update
  to authenticated
  using (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());

create policy "Recent plays delete own"
  on public.recent_plays for delete
  to authenticated
  using (account_id = public.current_account_id());

-- ===========================================================================
-- 24. Storage buckets
-- ===========================================================================
insert into storage.buckets (id, name, public)
values
  ('audio', 'audio', true),
  ('artwork', 'artwork', true),
  ('lyrics', 'lyrics', true)
on conflict (id) do nothing;

drop policy if exists "Public read audio" on storage.objects;
drop policy if exists "Public read artwork" on storage.objects;
drop policy if exists "Public read lyrics" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Anyone can upload audio" on storage.objects;
drop policy if exists "Anyone can upload artwork" on storage.objects;
drop policy if exists "Anyone can upload lyrics" on storage.objects;
drop policy if exists "Authenticated can upload audio" on storage.objects;
drop policy if exists "Authenticated can upload artwork" on storage.objects;
drop policy if exists "Authenticated can upload lyrics" on storage.objects;
drop policy if exists "Anyone can update lyrics" on storage.objects;
drop policy if exists "Anyone can delete lyrics" on storage.objects;
drop policy if exists "Anyone can update artwork" on storage.objects;
drop policy if exists "Anyone can delete artwork" on storage.objects;
drop policy if exists "Owners can update lyrics" on storage.objects;
drop policy if exists "Owners can delete lyrics" on storage.objects;
drop policy if exists "Owners can update artwork" on storage.objects;
drop policy if exists "Owners can delete artwork" on storage.objects;

-- Public read access to all three buckets (artwork and audio are public assets;
-- lyrics are fetched client-side so they must be publicly readable).
create policy "Public read audio"
  on storage.objects for select
  using (bucket_id = 'audio');

create policy "Public read artwork"
  on storage.objects for select
  using (bucket_id = 'artwork');

create policy "Public read lyrics"
  on storage.objects for select
  using (bucket_id = 'lyrics');

-- Uploads require login.
create policy "Authenticated can upload audio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'audio');

create policy "Authenticated can upload artwork"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'artwork');

create policy "Authenticated can upload lyrics"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lyrics');

-- In-place lyric/artwork edits (upsert to the same object) and old-file cleanup
-- require owning the object (or being admin). Audio stays insert-only and is
-- deleted through the delete_song RPC.
create policy "Owners can update lyrics"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'lyrics' and (owner = auth.uid() or public.is_admin()))
  with check (bucket_id = 'lyrics' and (owner = auth.uid() or public.is_admin()));

create policy "Owners can delete lyrics"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lyrics' and (owner = auth.uid() or public.is_admin()));

create policy "Owners can update artwork"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'artwork' and (owner = auth.uid() or public.is_admin()))
  with check (bucket_id = 'artwork' and (owner = auth.uid() or public.is_admin()));

create policy "Owners can delete artwork"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'artwork' and (owner = auth.uid() or public.is_admin()));

-- ===========================================================================
-- 25. Data migrations for databases created with the old series
-- ===========================================================================
-- Kept so re-running this file on an existing project converges to the same
-- state. They are no-ops on a fresh database.

-- Backfill creator display names where possible.
update public.playlists p
set creator_name = a.display_name
from public.accounts a
where p.user_id = a.id
  and p.creator_name is null;

update public.playlists
set creator_name = 'ViPlay'
where user_id is null
  and creator_name is null;

-- Backfill the catalog from the free-text columns.
insert into public.artists (name)
select distinct s.artist
from public.songs s
where s.artist is not null and btrim(s.artist) <> ''
on conflict do nothing;

insert into public.albums (title, artist_id)
select distinct btrim(s.album), a.id
from public.songs s
join public.artists a on lower(a.name) = lower(s.artist)
where s.album is not null and btrim(s.album) <> ''
on conflict do nothing;

update public.songs s
set artist_id = a.id
from public.artists a
where s.artist_id is null
  and lower(a.name) = lower(s.artist);

update public.songs s
set album_id = al.id
from public.albums al
join public.artists a on a.id = al.artist_id
where s.album_id is null
  and s.album is not null
  and lower(al.title) = lower(s.album)
  and lower(a.name) = lower(s.artist);

