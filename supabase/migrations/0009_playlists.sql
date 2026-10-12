-- Playlist management: public/private visibility, creator attribution, and
-- owner-only writes (creation requires login; only the creator can edit).
--
-- Reads stay public but private playlists are visible only to their owner.
-- Writes are restricted to the owning account resolved from the verified JWT
-- (accounts.auth_id = auth.uid()), so ownership cannot be spoofed.

-- Remove the ownerless "Chill Mix" seed playlist (songs cascade via FK).
-- It belongs to no one, so it should not be listed.
delete from public.playlists
where name = 'Chill Mix'
  and user_id is null;

alter table public.playlists
  add column if not exists is_public boolean not null default true;

alter table public.playlists
  add column if not exists creator_name text;

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

-- ---------------------------------------------------------------------------
-- Playlists: reads (public playlists + own private ones)
-- ---------------------------------------------------------------------------
drop policy if exists "Playlists readable" on public.playlists;
create policy "Playlists readable"
  on public.playlists for select
  to anon, authenticated
  using (
    is_public = true
    or user_id is null
    or user_id in (select id from public.accounts where auth_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Playlists: writes (owner only, login required)
-- ---------------------------------------------------------------------------
drop policy if exists "Playlists insert" on public.playlists;
create policy "Playlists insert own"
  on public.playlists for insert
  to authenticated
  with check (
    user_id is not null
    and user_id in (select id from public.accounts where auth_id = auth.uid())
  );

drop policy if exists "Playlists update" on public.playlists;
create policy "Playlists update own"
  on public.playlists for update
  to authenticated
  using (user_id in (select id from public.accounts where auth_id = auth.uid()))
  with check (
    user_id is not null
    and user_id in (select id from public.accounts where auth_id = auth.uid())
  );

drop policy if exists "Playlists delete" on public.playlists;
create policy "Playlists delete own"
  on public.playlists for delete
  to authenticated
  using (user_id in (select id from public.accounts where auth_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Playlist songs: reads follow parent visibility
-- ---------------------------------------------------------------------------
drop policy if exists "Playlist songs readable" on public.playlist_songs;
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

-- ---------------------------------------------------------------------------
-- Playlist songs: writes follow parent ownership (only the creator edits)
-- ---------------------------------------------------------------------------
drop policy if exists "Playlist songs insert" on public.playlist_songs;
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

drop policy if exists "Playlist songs delete" on public.playlist_songs;
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
