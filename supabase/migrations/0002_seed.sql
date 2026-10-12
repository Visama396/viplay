-- ViPlay seed data (optional)
-- Run this in the Supabase SQL editor after 0001_init.sql.
--
-- This only inserts metadata rows. The actual audio / artwork / lyrics files
-- must be uploaded to the 'audio', 'artwork' and 'lyrics' storage buckets first
-- (see scripts/seed.mjs which uploads files from a local folder and inserts rows).

insert into public.songs (title, artist, album, duration, audio_path, artwork_path, lyrics_path)
values
  ('Example Song One',   'Artist A', 'Album 1', 214, 'example-one.mp3',     'example-one.jpg', 'example-one.lrc'),
  ('Example Song Two',   'Artist B', 'Album 1', 182, 'example-two.mp3',     'example-two.jpg', 'example-two.lrc'),
  ('Example Song Three', 'Artist A', 'Album 2', 247, 'example-three.mp3',   'example-three.jpg', null);

-- NOTE: the "Chill Mix" example playlist was removed (migration 0009 deletes
-- the ownerless row). Seed songs above are kept; create playlists in the app.
