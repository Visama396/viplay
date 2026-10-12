-- ViPlay: move to Supabase Auth with a username-based fake email.
--
-- Users register/log in through Supabase Auth using a generated email
-- `${username}@app.local` (no real email needed), which gives us signed JWTs
-- and lets RLS trust auth.uid(). Each row in the existing `accounts` table is
-- linked to its Supabase Auth user via the new `auth_id` column.

-- Link accounts to their Supabase Auth user.
alter table public.accounts
  add column if not exists auth_id uuid references auth.users (id) on delete cascade;

create unique index if not exists idx_accounts_auth_id on public.accounts (auth_id);

-- A user is authenticated to Supabase Auth at this point. Ensure an
-- accounts row exists (or links up) for the current auth.uid(), so the app's
-- Account (id, username, display_name) can be derived from the verified token.
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

-- Admin-only song deletion, now backed by the verified JWT (auth.uid()).
-- Replaces the client-supplied p_account_id variant from 0004, so the caller's
-- identity can no longer be spoofed by passing a different account id.
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
  -- Only the designated admin may delete songs. Identity comes from the token.
  select a.username into v_username
  from public.accounts a
  where a.auth_id = auth.uid();

  if v_username is distinct from 'visama' then
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
grant execute on function public.ensure_account_link(text, text) to anon, authenticated;
