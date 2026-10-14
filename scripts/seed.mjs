/**
 * ViPlay seeding script.
 *
 * Uploads audio / artwork / lyrics files from ./seed-assets/<song-folder> into
 * Supabase Storage and inserts the corresponding rows in the `songs` table.
 *
 * Requires the service role key, NOT the publishable anon key:
 *   SUPABASE_URL=https://<project>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
 *   bun run scripts/seed.mjs
 *
 * Expected folder layout under ./seed-assets:
 *   seed-assets/
 *     my-first-song/
 *       audio.mp3
 *       artwork.jpg
 *       lyrics.lrc
 *     my-second-song/
 *       audio.mp3
 *       lyrics.lrc
 *
 * File names are normalized into storage paths like "my-first-song/audio.mp3".
 */
import { createClient } from "@supabase/supabase-js";
import { readdir, stat, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ASSETS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "seed-assets",
);

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const BUCKETS = { audio: "audio", artwork: "artwork", lyrics: "lyrics" };

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function upload(bucket, storagePath, filePath) {
  const data = await readFile(filePath);
  const { error } = await supabase.storage.from(bucket).upload(storagePath, data, {
    upsert: true,
    contentType: getContentType(filePath),
  });
  return error;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".ogg") return "audio/ogg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".m4a") return "audio/mp4";
  if (ext === ".flac") return "audio/flac";
  if (ext === ".lrc") return "text/plain";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

async function readMeta(folderPath) {
  try {
    const raw = await readFile(path.join(folderPath, "meta.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const folders = (await readdir(ASSETS_DIR, { withFileTypes: true })).filter((d) =>
  d.isDirectory(),
);

if (folders.length === 0) {
  console.error(`No song folders found in ${ASSETS_DIR}.`);
  process.exit(0);
}

let inserted = 0;
for (const folder of folders) {
  const dirPath = path.join(ASSETS_DIR, folder.name);
  const meta = await readMeta(dirPath);
  const files = (await readdir(dirPath, { withFileTypes: true }))
    .filter((f) => f.isFile())
    .map((f) => f.name);

  const audio = files.find((f) => /\.(mp3|ogg|wav|m4a|flac)$/i.test(f));
  const artwork = files.find((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
  const lyrics = files.find((f) => /\.lrc$/i.test(f));

  if (!audio) {
    console.warn(`  skip "${folder.name}": no audio file found`);
    continue;
  }

  const base = slugify(folder.name);
  const audioPath = `${base}/${audio}`;
  const artworkPath = artwork ? `${base}/${artwork}` : null;
  const lyricsPath = lyrics ? `${base}/${lyrics}` : null;

  console.log(`Seeding "${folder.name}"...`);

  if ((await upload("audio", audioPath, path.join(dirPath, audio))) != null) {
    console.error(`  failed to upload audio: ${audio}`);
    continue;
  }
  if (artwork) {
    const err = await upload("artwork", artworkPath, path.join(dirPath, artwork));
    if (err) console.warn(`  artwork upload failed: ${err.message}`);
  }
  if (lyrics) {
    const err = await upload("lyrics", lyricsPath, path.join(dirPath, lyrics));
    if (err) console.warn(`  lyrics upload failed: ${err.message}`);
  }

  const audioStat = await stat(path.join(dirPath, audio));
  const durationSec = Math.round(audioStat.size / 1000); // crude fallback if no duration known

  const { data, error } = await supabase
    .from("songs")
    .insert({
      title: meta.title || folder.name,
      artist: meta.artist || "Unknown Artist",
      album: meta.album || null,
      duration: meta.duration || durationSec,
      audio_path: audioPath,
      artwork_path: artworkPath,
      lyrics_path: lyricsPath,
    })
    .select()
    .single();

  if (error) {
    console.error(`  failed to insert song row: ${error.message}`);
    continue;
  }
  console.log(`  inserted song "${data.title}" (${data.id})`);

  // Link into the catalog tables (artists/albums/genres). Best-effort, so
  // seeding keeps working if migration 0011 hasn't been applied yet.
  // meta.json may set: genre ("Rock") or genres (["Rock", "Pop"]),
  // album_year (or year) for the album.
  try {
    const artistName = String(meta.artist || "Unknown Artist").trim();
    const { data: knownArtists } = await supabase.from("artists").select("id, name");
    let artistRow = (knownArtists ?? []).find(
      (a) => a.name.trim().toLowerCase() === artistName.toLowerCase(),
    );
    if (!artistRow) {
      const { data: created } = await supabase
        .from("artists")
        .insert({ name: artistName })
        .select("id, name")
        .single();
      artistRow = created;
    }

    let albumId = null;
    const albumTitle = meta.album ? String(meta.album).trim() : "";
    if (albumTitle && artistRow) {
      const albumYear = meta.album_year ?? meta.year ?? null;
      const { data: knownAlbums } = await supabase
        .from("albums")
        .select("id, title")
        .eq("artist_id", artistRow.id);
      let albumRow = (knownAlbums ?? []).find(
        (a) => a.title.trim().toLowerCase() === albumTitle.toLowerCase(),
      );
      if (!albumRow) {
        const { data: created } = await supabase
          .from("albums")
          .insert({ title: albumTitle, artist_id: artistRow.id, year: albumYear })
          .select("id, title")
          .single();
        albumRow = created;
      }
      albumId = albumRow?.id ?? null;
    }

    await supabase
      .from("songs")
      .update({ artist_id: artistRow?.id ?? null, album_id: albumId })
      .eq("id", data.id);

    const genreNames = [
      ...(Array.isArray(meta.genres) ? meta.genres : []),
      ...(meta.genre ? [meta.genre] : []),
    ]
      .map((g) => String(g).trim())
      .filter(Boolean);
    if (genreNames.length > 0) {
      const { data: knownGenres } = await supabase.from("genres").select("id, name");
      const genreIds = [];
      for (const name of genreNames) {
        let row = (knownGenres ?? []).find(
          (g) => g.name.trim().toLowerCase() === name.toLowerCase(),
        );
        if (!row) {
          const { data: created } = await supabase
            .from("genres")
            .insert({ name })
            .select("id, name")
            .single();
          row = created;
          if (row) knownGenres.push(row);
        }
        if (row) genreIds.push(row.id);
      }
      if (genreIds.length > 0) {
        await supabase
          .from("song_genres")
          .insert(genreIds.map((genre_id) => ({ song_id: data.id, genre_id })));
      }
    }
  } catch (e) {
    console.warn(`  catalog link skipped: ${e.message}`);
  }

  inserted++;
}

console.log(`Done. ${inserted} song(s) seeded.`);
