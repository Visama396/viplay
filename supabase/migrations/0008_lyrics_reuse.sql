-- Reuse the same lyrics/artwork objects on edit (free-plan space).
-- Text edits overwrite the existing lyrics object in place (upsert) and file
-- replacements upload the new object first, then delete the old one after the
-- songs row is updated. Both flows need UPDATE + DELETE on the lyrics and
-- artwork buckets, in addition to the existing INSERT policies. Audio stays
-- insert-only (audio files are never replaced by updateSong).

drop policy if exists "Anyone can update lyrics" on storage.objects;
create policy "Anyone can update lyrics"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'lyrics')
  with check (bucket_id = 'lyrics');

drop policy if exists "Anyone can delete lyrics" on storage.objects;
create policy "Anyone can delete lyrics"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'lyrics');

drop policy if exists "Anyone can update artwork" on storage.objects;
create policy "Anyone can update artwork"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'artwork')
  with check (bucket_id = 'artwork');

drop policy if exists "Anyone can delete artwork" on storage.objects;
create policy "Anyone can delete artwork"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'artwork');
