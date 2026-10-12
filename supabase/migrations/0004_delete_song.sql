-- ViPlay: restrict song deletion to the admin account "visama".
--
-- The app runs on the anon key (custom accounts, no JWT), so RLS alone cannot
-- tell which account is calling. Instead we expose a SECURITY DEFINER RPC that
-- receives the caller's account id (from their login session) and only deletes
-- for the designated admin username. All other callers are denied.

-- Revoke the permissive delete policy added in 0003_uploads.sql.
drop policy if exists "Songs delete" on public.songs;

-- Admin username. Change this to the account you want to grant delete rights to.
create or replace function public.delete_song(
  p_song_id uuid,
  p_account_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_song public.songs%rowtype;
begin
  select username into v_username
  from public.accounts
  where id = p_account_id;

  -- Only the designated admin may delete songs.
  if v_username is distinct from 'visama' then
    return false;
  end if;

  select * into v_song
  from public.songs
  where id = p_song_id;

  if not found then
    return false;
  end if;

  -- Remove the associated files from storage (ignoring missing objects).
  if v_song.audio_path is not null then
    delete from storage.objects
    where bucket_id = 'audio' and name = v_song.audio_path;
  end if;
  if v_song.artwork_path is not null then
    delete from storage.objects
    where bucket_id = 'artwork' and name = v_song.artwork_path;
  end if;
  if v_song.lyrics_path is not null then
    delete from storage.objects
    where bucket_id = 'lyrics' and name = v_song.lyrics_path;
  end if;

  delete from public.songs where id = p_song_id;

  return found;
end;
$$;

-- Allow the anon role (used by the app) to call it; the function itself guards
-- the admin check.
revoke all on function public.delete_song(uuid, uuid) from public;
grant execute on function public.delete_song(uuid, uuid) to anon, authenticated;
