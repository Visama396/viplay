-- Align the admin username used by delete_song with the real account.
-- The existing DB account is "visama396" (there is no "visama" row).
create or replace function public.delete_song(p_song_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
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

revoke all on function public.delete_song(uuid) from public;
grant execute on function public.delete_song(uuid) to anon, authenticated;
