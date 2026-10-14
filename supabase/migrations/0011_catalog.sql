-- ViPlay catalog (artists, albums, genres).
-- Run `supabase/migrations/0011_catalog.sql` in the Supabase SQL editor
-- AFTER the earlier migrations. Idempotent: safe to re-run.
--
-- Adds proper catalog tables so songs can be grouped/searched by
-- author/band and album, and filtered by genre:
--   - artists (one row per author/band, unique case-insensitively)
--   - albums (title + artist + optional year)
--   - genres + song_genres (a song can have several genres)
--   - songs.artist_id / songs.album_id (nullable FKs; the free-text
--     songs.artist / songs.album columns stay as display/fallback values)
-- Existing rows are backfilled from the current text columns.

-- ---------------------------------------------------------------------------
-- Artists
-- ---------------------------------------------------------------------------
create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Unique case-insensitively ("YOASOBI" and "yoasobi" are the same artist).
create unique index if not exists idx_artists_lower_name
  on public.artists (lower(name));

alter table public.artists enable row level security;

drop policy if exists "Artists are publicly readable" on public.artists;
create policy "Artists are publicly readable"
  on public.artists for select
  to anon, authenticated
  using (true);

-- In-app uploads resolve/create artists client-side, like songs.
drop policy if exists "Artists insert" on public.artists;
create policy "Artists insert"
  on public.artists for insert
  with check (true);

drop policy if exists "Artists update" on public.artists;
create policy "Artists update"
  on public.artists for update
  using (true);

-- ---------------------------------------------------------------------------
-- Albums
-- ---------------------------------------------------------------------------
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

alter table public.albums enable row level security;

drop policy if exists "Albums are publicly readable" on public.albums;
create policy "Albums are publicly readable"
  on public.albums for select
  to anon, authenticated
  using (true);

drop policy if exists "Albums insert" on public.albums;
create policy "Albums insert"
  on public.albums for insert
  with check (true);

drop policy if exists "Albums update" on public.albums;
create policy "Albums update"
  on public.albums for update
  using (true);

-- ---------------------------------------------------------------------------
-- Songs: link to the catalog (text columns stay as display values)
-- ---------------------------------------------------------------------------
alter table public.songs
  add column if not exists artist_id uuid references public.artists (id) on delete set null;

alter table public.songs
  add column if not exists album_id uuid references public.albums (id) on delete set null;

create index if not exists idx_songs_artist_id on public.songs (artist_id);
create index if not exists idx_songs_album_id on public.songs (album_id);

-- ---------------------------------------------------------------------------
-- Genres (many-to-many: a song can have several genres)
-- ---------------------------------------------------------------------------
create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_genres_lower_name
  on public.genres (lower(name));

alter table public.genres enable row level security;

drop policy if exists "Genres are publicly readable" on public.genres;
create policy "Genres are publicly readable"
  on public.genres for select
  to anon, authenticated
  using (true);

drop policy if exists "Genres insert" on public.genres;
create policy "Genres insert"
  on public.genres for insert
  with check (true);

drop policy if exists "Genres update" on public.genres;
create policy "Genres update"
  on public.genres for update
  using (true);

create table if not exists public.song_genres (
  song_id uuid not null references public.songs (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete cascade,
  primary key (song_id, genre_id)
);

alter table public.song_genres enable row level security;

drop policy if exists "Song genres are publicly readable" on public.song_genres;
create policy "Song genres are publicly readable"
  on public.song_genres for select
  to anon, authenticated
  using (true);

-- Editing a song's genres replaces its links, so insert + delete are open.
drop policy if exists "Song genres insert" on public.song_genres;
create policy "Song genres insert"
  on public.song_genres for insert
  with check (true);

drop policy if exists "Song genres delete" on public.song_genres;
create policy "Song genres delete"
  on public.song_genres for delete
  using (true);

-- ---------------------------------------------------------------------------
-- Backfill from the existing free-text columns
-- ---------------------------------------------------------------------------
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
