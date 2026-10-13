-- Secondary/alternate lyrics track (e.g. romanized/transliterated LRC).
-- Each song can carry one extra LRC file plus a short label shown in the
-- player toggle ("Romanized", "Translit", "Translation", ...).
-- Apply in the Supabase SQL editor (idempotent).

alter table public.songs
  add column if not exists secondary_lyrics_path text;
alter table public.songs
  add column if not exists secondary_lyrics_label text;

-- Admin-only deletion must also remove the secondary lyrics object.
-- Keeps the storage.allow_delete_query flags from 0001_init (newer Supabase
-- blocks direct DELETE on storage.objects without them).
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

revoke all on function public.delete_song(uuid) from public;
grant execute on function public.delete_song(uuid) to anon, authenticated;
