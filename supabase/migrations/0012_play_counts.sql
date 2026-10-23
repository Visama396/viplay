-- Song play counts (Most listened).
-- Run `supabase/migrations/0012_play_counts.sql` in the Supabase SQL editor
-- AFTER the earlier migrations. Idempotent: safe to re-run.
--
-- Every time a song starts playing, the app calls record_song_play(), which
-- atomically increments songs.play_count. Guests count too (playback is open
-- in this app, same trust model as uploads).

alter table public.songs
  add column if not exists play_count integer not null default 0;

-- Newest/highest counts are what the home rail needs.
create index if not exists idx_songs_play_count
  on public.songs (play_count desc);

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

revoke all on function public.record_song_play(uuid) from public;
grant execute on function public.record_song_play(uuid) to anon, authenticated;
