import { supabase } from "./supabase";
import { ensureAlbum, ensureArtist, setSongGenres } from "./catalog";
import type { Song } from "./types";

export interface UploadInput {
  title: string;
  artist: string;
  album?: string;
  /** Release year for the album (creates/updates the album row). */
  year?: number | null;
  /** Genre names to link (created if new). */
  genres?: string[];
  audio: File;
  artwork?: File;
  lyrics?: File;
  /** Inline LRC text. Used when no lyrics file is provided. */
  lyricsText?: string;
  /** Optional second LRC track (e.g. romanized/transliterated lyrics). */
  secondaryLyrics?: File;
  /** Inline LRC text for the secondary track. */
  secondaryLyricsText?: string;
  /** Label shown in the player toggle, e.g. "Romanized". */
  secondaryLyricsLabel?: string;
  uploadedBy: string;
}

export interface UploadResult {
  song?: Song;
  error?: string;
}

function toStorageName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

function contentType(file: File): string {
  return file.type || "application/octet-stream";
}

/**
 * Reads the duration of an audio file in seconds by loading it into a hidden
 * <audio> element. Falls back to null if it can't be determined.
 */
export function readAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const d = audio.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) ? Math.round(d) : null);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    audio.src = url;
  });
}

/**
 * Uploads a song's files to storage and inserts the metadata row. Runs
 * client-side with the anon key.
 */
export async function uploadSong(input: UploadInput): Promise<UploadResult> {
  const title = input.title.trim();
  const artist = input.artist.trim();

  if (!title || !artist) return { error: "Title and artist are required" };
  if (!input.audio) return { error: "An audio file is required" };

  const base = `${toStorageName(artist)}-${toStorageName(title)}-${Date.now()}`;

  const audioName = toStorageName(input.audio.name) || "audio";
  const audioPath = `${base}.${audioName.split(".").pop() || "mp3"}`;

  const { error: audioErr } = await supabase.storage
    .from("audio")
    .upload(audioPath, input.audio, { upsert: false, contentType: contentType(input.audio) });
  if (audioErr) return { error: `Could not upload audio: ${audioErr.message}` };

  let artworkPath: string | null = null;
  if (input.artwork) {
    const ext = (input.artwork.name.split(".").pop() || "jpg").toLowerCase();
    artworkPath = `${base}-art.${ext}`;
    const { error: artErr } = await supabase.storage
      .from("artwork")
      .upload(artworkPath, input.artwork, { upsert: false, contentType: contentType(input.artwork) });
    if (artErr) {
      await supabase.storage.from("audio").remove([audioPath]);
      return { error: `Could not upload artwork: ${artErr.message}` };
    }
  }

  let lyricsPath: string | null = null;
  if (input.lyrics) {
    lyricsPath = `${base}.lrc`;
    const { error: lyrErr } = await supabase.storage
      .from("lyrics")
      .upload(lyricsPath, input.lyrics, { upsert: false, contentType: contentType(input.lyrics) });
    if (lyrErr) {
      await supabase.storage.from("audio").remove([audioPath]);
      if (artworkPath) await supabase.storage.from("artwork").remove([artworkPath]);
      return { error: `Could not upload lyrics: ${lyrErr.message}` };
    }
  } else if (input.lyricsText?.trim()) {
    lyricsPath = `${base}.lrc`;
    const { error: lyrErr } = await supabase.storage
      .from("lyrics")
      .upload(
        lyricsPath,
        new Blob([input.lyricsText], { type: "text/plain" }),
        { upsert: false, contentType: "text/plain" },
      );
    if (lyrErr) {
      await supabase.storage.from("audio").remove([audioPath]);
      if (artworkPath) await supabase.storage.from("artwork").remove([artworkPath]);
      return { error: `Could not save lyrics: ${lyrErr.message}` };
    }
  }

  let secondaryLyricsPath: string | null = null;
  let secondaryLyricsLabel: string | null = null;
  if (input.secondaryLyrics) {
    secondaryLyricsPath = `${base}-alt.lrc`;
    const { error: altErr } = await supabase.storage
      .from("lyrics")
      .upload(secondaryLyricsPath, input.secondaryLyrics, {
        upsert: false,
        contentType: contentType(input.secondaryLyrics),
      });
    if (altErr) {
      await supabase.storage.from("audio").remove([audioPath]);
      if (artworkPath) await supabase.storage.from("artwork").remove([artworkPath]);
      if (lyricsPath) await supabase.storage.from("lyrics").remove([lyricsPath]);
      return { error: `Could not upload secondary lyrics: ${altErr.message}` };
    }
    secondaryLyricsLabel = input.secondaryLyricsLabel?.trim() || "Romanized";
  } else if (input.secondaryLyricsText?.trim()) {
    secondaryLyricsPath = `${base}-alt.lrc`;
    const { error: altErr } = await supabase.storage
      .from("lyrics")
      .upload(
        secondaryLyricsPath,
        new Blob([input.secondaryLyricsText], { type: "text/plain" }),
        { upsert: false, contentType: "text/plain" },
      );
    if (altErr) {
      await supabase.storage.from("audio").remove([audioPath]);
      if (artworkPath) await supabase.storage.from("artwork").remove([artworkPath]);
      if (lyricsPath) await supabase.storage.from("lyrics").remove([lyricsPath]);
      return { error: `Could not save secondary lyrics: ${altErr.message}` };
    }
    secondaryLyricsLabel = input.secondaryLyricsLabel?.trim() || "Romanized";
  }

  const duration = await readAudioDuration(input.audio);

  // Link the song into the catalog (best-effort: a missing 0011 migration
  // just leaves the FKs null, the text columns still save).
  const artistId = await ensureArtist(artist);
  const albumTitle = input.album?.trim() || "";
  const albumId =
    albumTitle && artistId
      ? await ensureAlbum(albumTitle, artistId, input.year ?? null)
      : null;

  const { data, error } = await supabase
    .from("songs")
    .insert({
      title,
      artist,
      album: input.album?.trim() || null,
      // FKs only when resolved: if the 0011 migration hasn't been run,
      // PostgREST rejects unknown columns and the whole insert would fail.
      ...(artistId ? { artist_id: artistId } : {}),
      ...(albumId ? { album_id: albumId } : {}),
      duration,
      audio_path: audioPath,
      artwork_path: artworkPath,
      lyrics_path: lyricsPath,
      secondary_lyrics_path: secondaryLyricsPath,
      secondary_lyrics_label: secondaryLyricsLabel,
      uploaded_by: input.uploadedBy,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from("audio").remove([audioPath]);
    if (artworkPath) await supabase.storage.from("artwork").remove([artworkPath]);
    if (lyricsPath) await supabase.storage.from("lyrics").remove([lyricsPath]);
    if (secondaryLyricsPath) await supabase.storage.from("lyrics").remove([secondaryLyricsPath]);
    return { error: `Could not save song: ${error.message}` };
  }

  if (data && input.genres && input.genres.length > 0) {
    await setSongGenres((data as Song).id, input.genres);
  }

  return { song: data as Song };
}

export interface EditInput {
  title: string;
  artist: string;
  album?: string;
  /** Release year for the album. Undefined leaves it unchanged. */
  year?: number | null;
  /** Genre names to set. Null/undefined leaves them unchanged. */
  genres?: string[] | null;
  artwork?: File;
  lyrics?: File;
  /** Inline LRC text. Empty string clears lyrics; null/undefined leaves them unchanged. */
  lyricsText?: string | null;
  secondaryLyrics?: File;
  /** Inline LRC text for the secondary track. Empty string clears it; null/undefined leaves it unchanged. */
  secondaryLyricsText?: string | null;
  /** Label for the secondary track. Null/undefined leaves it unchanged. */
  secondaryLyricsLabel?: string | null;
}

/**
 * Fetches and returns the text of a song's lyrics file, or null if it can't be
 * read.
 */
export async function fetchLyrics(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("lyrics").download(path);
  if (error || !data) return null;
  return data.text();
}

/**
 * Updates a song's metadata and optionally replaces its artwork/lyrics files.
 * New files are uploaded to storage (overwriting the previous path) and the
 * songs row is updated with the new paths.
 */
export async function updateSong(
  songId: string,
  input: EditInput,
): Promise<{ success?: boolean; error?: string }> {
  const title = input.title.trim();
  const artist = input.artist.trim();
  if (!title || !artist) return { error: "Title and artist are required" };

  const { data: song, error: fetchErr } = await supabase
    .from("songs")
    .select("artwork_path, lyrics_path, secondary_lyrics_path, secondary_lyrics_label")
    .eq("id", songId)
    .maybeSingle();
  if (fetchErr) return { error: `Could not load song: ${fetchErr.message}` };
  if (!song) return { error: "Song not found" };

  const base = `${toStorageName(artist)}-${toStorageName(title)}-${Date.now()}`;

  const oldArtworkPath: string | null = song.artwork_path;
  const oldLyricsPath: string | null = song.lyrics_path;
  const oldSecondaryPath: string | null = song.secondary_lyrics_path ?? null;

  // Paths replaced by a new upload. The old objects are deleted only after
  // the songs row update succeeds, so a DB failure never loses the file.
  const replacedArtwork: { bucket: "artwork"; oldPath: string }[] = [];
  const replacedLyrics: { bucket: "lyrics"; oldPath: string }[] = [];
  // Paths unlinked (cleared). Same rule: delete after DB success.
  const removedLyrics: string[] = [];

  let artworkPath: string | null = song.artwork_path;
  if (input.artwork) {
    const ext = (input.artwork.name.split(".").pop() || "jpg").toLowerCase();
    artworkPath = `${base}-art.${ext}`;
    const { error: artErr } = await supabase.storage
      .from("artwork")
      .upload(artworkPath, input.artwork, { upsert: false, contentType: contentType(input.artwork) });
    if (artErr) return { error: `Could not upload artwork: ${artErr.message}` };
    if (oldArtworkPath && oldArtworkPath !== artworkPath) {
      replacedArtwork.push({ bucket: "artwork", oldPath: oldArtworkPath });
    }
  }

  let lyricsPath: string | null = song.lyrics_path;
  if (input.lyrics) {
    lyricsPath = `${base}.lrc`;
    const { error: lyrErr } = await supabase.storage
      .from("lyrics")
      .upload(lyricsPath, input.lyrics, { upsert: false, contentType: contentType(input.lyrics) });
    if (lyrErr) {
      if (artworkPath && artworkPath !== song.artwork_path) await supabase.storage.from("artwork").remove([artworkPath]);
      return { error: `Could not upload lyrics: ${lyrErr.message}` };
    }
    if (oldLyricsPath && oldLyricsPath !== lyricsPath) {
      replacedLyrics.push({ bucket: "lyrics", oldPath: oldLyricsPath });
    }
  } else if (input.lyricsText != null) {
    if (input.lyricsText.trim() === "") {
      lyricsPath = null;
      if (oldLyricsPath) removedLyrics.push(oldLyricsPath);
    } else if (oldLyricsPath) {
      // Text edit on a song that already has lyrics. Always write to a NEW
      // object instead of overwriting in place: Supabase serves storage
      // objects through a CDN, so overwriting the same path succeeds but
      // subsequent downloads can keep returning the stale cached bytes
      // (save looks fine, no error, but the old text reappears). A fresh
      // timestamped path busts the cache; the old object is deleted after
      // the row update commits.
      const name = `${base}.lrc`;
      const { error: lyrErr } = await supabase.storage
        .from("lyrics")
        .upload(
          name,
          new Blob([input.lyricsText], { type: "text/plain" }),
          { upsert: false, contentType: "text/plain" },
        );
      if (lyrErr) {
        if (artworkPath && artworkPath !== song.artwork_path) await supabase.storage.from("artwork").remove([artworkPath]);
        return { error: `Could not save lyrics: ${lyrErr.message}` };
      }
      lyricsPath = name;
      replacedLyrics.push({ bucket: "lyrics", oldPath: oldLyricsPath });
    } else {
      const name = `${base}.lrc`;
      const { error: lyrErr } = await supabase.storage
        .from("lyrics")
        .upload(
          name,
          new Blob([input.lyricsText], { type: "text/plain" }),
          { upsert: false, contentType: "text/plain" },
        );
      if (lyrErr) {
        if (artworkPath && artworkPath !== song.artwork_path) await supabase.storage.from("artwork").remove([artworkPath]);
        return { error: `Could not save lyrics: ${lyrErr.message}` };
      }
      lyricsPath = name;
    }
  }

  let secondaryPath: string | null = song.secondary_lyrics_path ?? null;
  let secondaryLabel: string | null = song.secondary_lyrics_label ?? null;
  const resolveSecondaryLabel = (explicit: string | null | undefined): string => {
    if (explicit != null) return explicit.trim() || "Romanized";
    return secondaryLabel?.trim() || "Romanized";
  };
  async function uploadSecondaryBlob(text: string): Promise<{ path?: string; error?: string }> {
    // Same CDN-cache rule as primary lyrics: always a fresh timestamped path.
    const name = `${base}-alt.lrc`;
    const { error: altErr } = await supabase.storage
      .from("lyrics")
      .upload(name, new Blob([text], { type: "text/plain" }), {
        upsert: false,
        contentType: "text/plain",
      });
    if (altErr) return { error: `Could not save secondary lyrics: ${altErr.message}` };
    return { path: name };
  }

  if (input.secondaryLyrics) {
    const name = `${base}-alt.lrc`;
    const { error: altErr } = await supabase.storage
      .from("lyrics")
      .upload(name, input.secondaryLyrics, { upsert: false, contentType: contentType(input.secondaryLyrics) });
    if (altErr) {
      if (artworkPath && artworkPath !== song.artwork_path) await supabase.storage.from("artwork").remove([artworkPath]);
      if (lyricsPath && lyricsPath !== song.lyrics_path) await supabase.storage.from("lyrics").remove([lyricsPath]);
      return { error: `Could not upload secondary lyrics: ${altErr.message}` };
    }
    if (oldSecondaryPath && oldSecondaryPath !== name) {
      replacedLyrics.push({ bucket: "lyrics", oldPath: oldSecondaryPath });
    }
    secondaryPath = name;
    secondaryLabel = resolveSecondaryLabel(input.secondaryLyricsLabel);
  } else if (input.secondaryLyricsText != null) {
    if (input.secondaryLyricsText.trim() === "") {
      secondaryPath = null;
      secondaryLabel = null;
      if (oldSecondaryPath) removedLyrics.push(oldSecondaryPath);
    } else {
      const res = await uploadSecondaryBlob(input.secondaryLyricsText);
      if (res.error) {
        if (artworkPath && artworkPath !== song.artwork_path) await supabase.storage.from("artwork").remove([artworkPath]);
        if (lyricsPath && lyricsPath !== song.lyrics_path) await supabase.storage.from("lyrics").remove([lyricsPath]);
        return { error: res.error };
      }
      if (oldSecondaryPath && oldSecondaryPath !== res.path) {
        replacedLyrics.push({ bucket: "lyrics", oldPath: oldSecondaryPath });
      }
      secondaryPath = res.path ?? null;
      secondaryLabel = resolveSecondaryLabel(input.secondaryLyricsLabel);
    }
  } else if (input.secondaryLyricsLabel != null) {
    // Label-only change (no new file/text).
    if (secondaryPath) secondaryLabel = input.secondaryLyricsLabel.trim() || "Romanized";
    else secondaryLabel = null;
  }

  // Keep the catalog links in sync with the edited names (best-effort).
  const artistId = await ensureArtist(artist);
  const albumTitle = input.album?.trim() || "";
  const albumId =
    albumTitle && artistId
      ? await ensureAlbum(albumTitle, artistId, input.year ?? null)
      : null;
  if (albumId && input.year !== undefined) {
    try {
      await supabase.from("albums").update({ year: input.year ?? null }).eq("id", albumId);
    } catch {
      // Non-fatal: the song row update below is what matters.
    }
  }

  const { error: updateErr } = await supabase
    .from("songs")
    .update({
      title,
      artist,
      album: input.album?.trim() || null,
      // Same unknown-column rule as the insert above.
      ...(artistId ? { artist_id: artistId } : {}),
      ...(albumId ? { album_id: albumId } : {}),
      artwork_path: artworkPath,
      lyrics_path: lyricsPath,
      secondary_lyrics_path: secondaryPath,
      secondary_lyrics_label: secondaryPath ? secondaryLabel : null,
    })
    .eq("id", songId);

  if (updateErr) {
    if (artworkPath && artworkPath !== song.artwork_path) await supabase.storage.from("artwork").remove([artworkPath]);
    if (lyricsPath && lyricsPath !== song.lyrics_path) await supabase.storage.from("lyrics").remove([lyricsPath]);
    if (secondaryPath && secondaryPath !== oldSecondaryPath) await supabase.storage.from("lyrics").remove([secondaryPath]);
    return { error: `Could not save song: ${updateErr.message}` };
  }

  if (input.genres != null) {
    await setSongGenres(songId, input.genres);
  }

  // Row now points at the new objects (or no lyrics); old ones are garbage.
  // Best-effort: a cleanup failure must not fail the save.
  for (const r of replacedArtwork) {    const { error } = await supabase.storage.from(r.bucket).remove([r.oldPath]);
    if (error) console.warn(`Could not delete old artwork ${r.oldPath}: ${error.message}`);
  }
  for (const r of replacedLyrics) {
    const { error } = await supabase.storage.from(r.bucket).remove([r.oldPath]);
    if (error) console.warn(`Could not delete old lyrics ${r.oldPath}: ${error.message}`);
  }
  for (const oldPath of removedLyrics) {
    const { error } = await supabase.storage.from("lyrics").remove([oldPath]);
    if (error) console.warn(`Could not delete cleared lyrics ${oldPath}: ${error.message}`);
  }

  return { success: true };
}

/**
 * Deletes a song (row + storage files) via the SECURITY DEFINER RPC. The
 * function verifies the caller from the signed JWT (auth.uid()) and only lets
 * the admin account ("visama396") delete.
 */
export async function deleteSong(
  songId: string,
): Promise<{ success?: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("delete_song", {
    p_song_id: songId,
  });
  if (error) return { error: error.message };
  if (!data) return { error: "You don't have permission to delete songs" };
  return { success: true };
}
