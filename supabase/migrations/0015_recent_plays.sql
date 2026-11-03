-- Per-account recently listened history.
-- Run `supabase/migrations/0015_recent_plays.sql` in the Supabase SQL editor
-- AFTER the earlier migrations. Idempotent: safe to re-run.
--
-- Guests keep using localStorage. Signed-in users get a server-side history so
-- the "Recently listened" rail follows them across devices. One row per
-- (account, song): replaying a song moves it to the top instead of creating
-- duplicate rows. The app only reads the newest 40.

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

alter table public.recent_plays enable row level security;

-- Each account can only see and write its own history. The app upserts on
-- (account_id, song_id), so both the insert and update policies are needed.
drop policy if exists "Recent plays read own" on public.recent_plays;
create policy "Recent plays read own"
  on public.recent_plays for select
  to authenticated
  using (account_id = public.current_account_id());

drop policy if exists "Recent plays insert own" on public.recent_plays;
create policy "Recent plays insert own"
  on public.recent_plays for insert
  to authenticated
  with check (account_id = public.current_account_id());

drop policy if exists "Recent plays update own" on public.recent_plays;
create policy "Recent plays update own"
  on public.recent_plays for update
  to authenticated
  using (account_id = public.current_account_id())
  with check (account_id = public.current_account_id());

drop policy if exists "Recent plays delete own" on public.recent_plays;
create policy "Recent plays delete own"
  on public.recent_plays for delete
  to authenticated
  using (account_id = public.current_account_id());
