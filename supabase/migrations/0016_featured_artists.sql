-- ViPlay: featured artists.
-- Run `supabase/migrations/0016_featured_artists.sql` in the Supabase SQL editor
-- AFTER the earlier migrations. Idempotent: safe to re-run.
--
-- Songs keep their single primary artist in songs.artist_id / songs.artist.
-- Collaborations can credit any number of extra artists through this join
-- table. Featured artists are ordered (position) so the credit line stays
-- stable, e.g. "Primary Artist feat. Guest One, Guest Two".

create table if not exists public.song_featured_artists (
  song_id uuid not null references public.songs (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,
  position integer not null default 0,
  primary key (song_id, artist_id)
);

create index if not exists idx_song_featured_artists_artist
  on public.song_featured_artists (artist_id);

alter table public.song_featured_artists enable row level security;

drop policy if exists "Song featured artists are publicly readable" on public.song_featured_artists;
create policy "Song featured artists are publicly readable"
  on public.song_featured_artists for select
  to anon, authenticated
  using (true);

-- Featured-artist links belong to a song, so only its uploader (or admin) may
-- change them. Mirrors the song_genres policies from 0013.
drop policy if exists "Song featured artists insert" on public.song_featured_artists;
drop policy if exists "Song featured artists insert own" on public.song_featured_artists;
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

drop policy if exists "Song featured artists delete" on public.song_featured_artists;
drop policy if exists "Song featured artists delete own" on public.song_featured_artists;
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
