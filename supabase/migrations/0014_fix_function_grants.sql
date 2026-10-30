-- ViPlay: fix function execute grants.
-- Run `supabase/migrations/0014_fix_function_grants.sql` in the Supabase SQL
-- editor AFTER 0013. Idempotent: safe to re-run.
--
-- Supabase's default privileges grant EXECUTE on newly created functions
-- directly to anon/authenticated (on top of PostgreSQL's default PUBLIC grant),
-- so revoking from `anon` alone leaves the PUBLIC grant in place. 0013 created
-- ensure_account_link/current_account_id()/is_admin() before this was
-- accounted for, which left them callable anonymously.
--
-- After this migration, the only functions anon may execute are:
--   - record_song_play(uuid)  (increments songs.play_count)
--   - username_taken(text)    (registration availability check)

revoke all on function public.ensure_account_link(text, text) from public, anon;
grant execute on function public.ensure_account_link(text, text) to authenticated;

revoke all on function public.current_account_id() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.current_account_id() to authenticated;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.delete_song(uuid) from public, anon;
grant execute on function public.delete_song(uuid) to authenticated;

-- Intentionally anonymous.
revoke all on function public.record_song_play(uuid) from public;
grant execute on function public.record_song_play(uuid) to anon, authenticated;

revoke all on function public.username_taken(text) from public;
grant execute on function public.username_taken(text) to anon, authenticated;
