import { supabase } from "./supabase";
import type { Album, Artist, Genre, Song } from "./types";

export interface Catalog {
  artists: Artist[];
  albums: Album[];
  genres: Genre[];
  /** song id -> genre names */
  songGenres: Map<string, string[]>;
  /** song id -> featured artist names, in credit order */
  songFeaturedArtists: Map<string, string[]>;
  /** song id -> featured artist ids, in credit order */
  songFeaturedArtistIds: Map<string, string[]>;
}

const emptyCatalog: Catalog = {
  artists: [],
  albums: [],
  genres: [],
  songGenres: new Map(),
  songFeaturedArtists: new Map(),
  songFeaturedArtistIds: new Map(),
};

/**
 * Fetches the catalog tables. Tolerant: if the 0011 migration hasn't been
 * run yet (or the network fails), returns empty lists so the app keeps
 * working with free-text artist/album/genre values.
 */
export async function fetchCatalog(): Promise<Catalog> {
  try {
    const [artistsRes, albumsRes, genresRes, linksRes, featuredRes] = await Promise.all([
      supabase.from("artists").select("*").order("name"),
      supabase.from("albums").select("*").order("title"),
      supabase.from("genres").select("*").order("name"),
      supabase.from("song_genres").select("song_id, genre_id"),
      // Optional: tolerant of 0016 not being applied yet.
      supabase.from("song_featured_artists").select("song_id, artist_id, position"),
    ]);
    if (artistsRes.error || albumsRes.error || genresRes.error || linksRes.error) {
      return emptyCatalog;
    }
    const artists: Artist[] = artistsRes.data ?? [];
    const albums: Album[] = albumsRes.data ?? [];
    const genres: Genre[] = genresRes.data ?? [];
    const genreById = new Map(genres.map((g) => [g.id, g.name]));
    const artistById = new Map(artists.map((a) => [a.id, a.name]));
    const songGenres = new Map<string, string[]>();
    for (const link of (linksRes.data ?? []) as Array<{ song_id: string; genre_id: string }>) {
      const name = genreById.get(link.genre_id);
      if (!name) continue;
      const list = songGenres.get(link.song_id) ?? [];
      list.push(name);
      songGenres.set(link.song_id, list);
    }

    const songFeaturedArtists = new Map<string, string[]>();
    const songFeaturedArtistIds = new Map<string, string[]>();
    if (!featuredRes.error) {
      const links = ((featuredRes.data ?? []) as Array<{
        song_id: string;
        artist_id: string;
        position: number;
      }>).sort((a, b) => a.position - b.position);
      for (const link of links) {
        const idList = songFeaturedArtistIds.get(link.song_id) ?? [];
        idList.push(link.artist_id);
        songFeaturedArtistIds.set(link.song_id, idList);

        const name = artistById.get(link.artist_id);
        if (!name) continue;
        const nameList = songFeaturedArtists.get(link.song_id) ?? [];
        nameList.push(name);
        songFeaturedArtists.set(link.song_id, nameList);
      }
    }

    return {
      artists,
      albums,
      genres,
      songGenres,
      songFeaturedArtists,
      songFeaturedArtistIds,
    };
  } catch {
    return emptyCatalog;
  }
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** Lookup of artist id -> name, built once per catalog load. */
export function artistNameMap(artists: Artist[]): Map<string, string> {
  return new Map(artists.map((a) => [a.id, a.name]));
}

/**
 * The name to show for a song's artist. When the song is linked to a catalog
 * artist, the catalog name wins so renames in `artists` propagate to the UI.
 * The free-text `songs.artist` column is only a fallback (rows created before
 * the 0011 migration, or when the linked artist row is missing).
 */
export function artistDisplayName(
  song: Pick<Song, "artist" | "artist_id">,
  names: Map<string, string>,
): string {
  if (!song.artist_id) return song.artist;
  return names.get(song.artist_id) ?? song.artist;
}

/**
 * The full artist credit for a song, e.g. "Artist feat. Guest One, Guest Two".
 * Featured names are attached client-side by fetchCatalog().
 */
export function artistCredit(
  song: Pick<Song, "artist" | "featured_artists">,
): string {
  const featured = (song.featured_artists ?? [])
    .map((name) => name.trim())
    .filter(Boolean);
  return featured.length > 0 ? `${song.artist} feat. ${featured.join(", ")}` : song.artist;
}

/** Finds an existing artist (case-insensitive) or creates it. Null on failure. */
export async function ensureArtist(name: string): Promise<string | null> {
  const clean = name.trim();
  if (!clean) return null;
  try {
    const { data, error } = await supabase.from("artists").select("id, name");
    if (error) return null;
    const existing = (data as Array<{ id: string; name: string }>).find((a) =>
      sameName(a.name, clean),
    );
    if (existing) return existing.id;
    const { data: created, error: insertErr } = await supabase
      .from("artists")
      .insert({ name: clean })
      .select("id")
      .single();
    if (insertErr || !created) return null;
    return (created as { id: string }).id;
  } catch {
    return null;
  }
}

/** Finds an existing album of the artist or creates it. Null on failure. */
export async function ensureAlbum(
  title: string,
  artistId: string,
  year?: number | null,
): Promise<string | null> {
  const clean = title.trim();
  if (!clean) return null;
  try {
    const { data, error } = await supabase
      .from("albums")
      .select("id, title")
      .eq("artist_id", artistId);
    if (error) return null;
    const existing = (data as Array<{ id: string; title: string }>).find((a) =>
      sameName(a.title, clean),
    );
    if (existing) {
      if (year != null) {
        await supabase.from("albums").update({ year }).eq("id", existing.id);
      }
      return existing.id;
    }
    const { data: created, error: insertErr } = await supabase
      .from("albums")
      .insert({ title: clean, artist_id: artistId, year: year ?? null })
      .select("id")
      .single();
    if (insertErr || !created) return null;
    return (created as { id: string }).id;
  } catch {
    return null;
  }
}

/** Finds an existing genre (case-insensitive) or creates it. Null on failure. */
export async function ensureGenre(name: string): Promise<string | null> {
  const clean = name.trim();
  if (!clean) return null;
  try {
    const { data, error } = await supabase.from("genres").select("id, name");
    if (error) return null;
    const existing = (data as Array<{ id: string; name: string }>).find((g) =>
      sameName(g.name, clean),
    );
    if (existing) return existing.id;
    const { data: created, error: insertErr } = await supabase
      .from("genres")
      .insert({ name: clean })
      .select("id")
      .single();
    if (insertErr || !created) return null;
    return (created as { id: string }).id;
  } catch {
    return null;
  }
}

/** Replaces a song's genre links. No-op on failure (never blocks a save). */
export async function setSongGenres(songId: string, names: string[]): Promise<void> {
  try {
    const ids: string[] = [];
    for (const name of names) {
      const id = await ensureGenre(name);
      if (id) ids.push(id);
    }
    const { error: delErr } = await supabase.from("song_genres").delete().eq("song_id", songId);
    if (delErr) return;
    if (ids.length === 0) return;
    await supabase
      .from("song_genres")
      .insert(ids.map((genre_id) => ({ song_id: songId, genre_id })));
  } catch {
    // Catalog is best-effort; the song row itself is already saved.
  }
}

/** Replaces a song's featured-artist links. No-op on failure. */
export async function setSongFeaturedArtists(
  songId: string,
  names: string[],
): Promise<void> {
  try {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const name of names) {
      const clean = name.trim();
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const id = await ensureArtist(clean);
      if (id && !ids.includes(id)) ids.push(id);
    }
    const { error: delErr } = await supabase
      .from("song_featured_artists")
      .delete()
      .eq("song_id", songId);
    if (delErr) return;
    if (ids.length === 0) return;
    await supabase
      .from("song_featured_artists")
      .insert(
        ids.map((artist_id, position) => ({ song_id: songId, artist_id, position })),
      );
  } catch {
    // Catalog links are best-effort; the song row itself is already saved.
  }
}

// ---------------------------------------------------------------------------
// Play counts (server-side, shared across devices)
// ---------------------------------------------------------------------------

/**
 * Increments a song's play count atomically. Best-effort: returns the new
 * total, or null when the 0012 migration hasn't been applied or the call
 * fails (playback is never blocked by counting).
 */
export async function recordSongPlay(songId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc("record_song_play", {
      p_song_id: songId,
    });
    if (error) return null;
    return typeof data === "number" ? data : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Recently played
//
// Guests keep a per-device list in localStorage. Signed-in users get a
// server-side history (`recent_plays`) so the rail follows them across
// devices. localStorage is only written while logged out, so one account's
// history is never merged into another account on a shared device.
// ---------------------------------------------------------------------------

export interface RecentPlay {
  id: string;
  at: number;
}

const RECENT_KEY = "viplay:recently-played";
export const RECENT_LIMIT = 40;

/** This browser's guest history (works logged out). */
export function getLocalRecentPlays(): RecentPlay[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentPlay[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => typeof p?.id === "string").slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

/** Records a guest play locally and returns the updated list (newest first). */
export function recordLocalPlay(songId: string): RecentPlay[] {
  const next = [
    { id: songId, at: Date.now() },
    ...getLocalRecentPlays().filter((p) => p.id !== songId),
  ].slice(0, RECENT_LIMIT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage full/blocked: listening history just won't persist.
  }
  return next;
}

/**
 * Fetches the signed-in account's history from the server (newest first).
 * Returns null when the 0015 migration hasn't been applied or the call fails,
 * so the caller can keep showing the local fallback.
 */
export async function fetchRecentPlays(): Promise<RecentPlay[] | null> {
  try {
    const { data, error } = await supabase
      .from("recent_plays")
      .select("song_id, played_at")
      .order("played_at", { ascending: false })
      .limit(RECENT_LIMIT);
    if (error) return null;
    return ((data ?? []) as Array<{ song_id: string; played_at: string }>).map(
      (row) => ({
        id: row.song_id,
        at: new Date(row.played_at).getTime(),
      }),
    );
  } catch {
    return null;
  }
}

/** Records a play for the signed-in account. Best-effort. */
export async function recordRemotePlay(accountId: string, songId: string): Promise<void> {
  try {
    await supabase.from("recent_plays").upsert(
      {
        account_id: accountId,
        song_id: songId,
        played_at: new Date().toISOString(),
      },
      { onConflict: "account_id,song_id" },
    );
  } catch {
    // Playback is never blocked by history persistence.
  }
}

/**
 * Copies this device's guest history into the account on sign-in. Existing
 * server rows win, so a song played on another device keeps its timestamp.
 * Returns true when the local plays were successfully handed over (or there
 * were none), so the caller can clear them from this device.
 */
export async function mergeLocalRecentPlays(accountId: string): Promise<boolean> {
  const local = getLocalRecentPlays();
  if (local.length === 0) return true;
  try {
    // Skip entries whose song was deleted, otherwise the foreign key would
    // reject the whole batch.
    const { data: existing, error: songsError } = await supabase
      .from("songs")
      .select("id")
      .in("id", local.map((p) => p.id));
    if (songsError) return false;
    const validIds = new Set(
      ((existing ?? []) as Array<{ id: string }>).map((row) => row.id),
    );
    const toMerge = local.filter((p) => validIds.has(p.id));

    if (toMerge.length > 0) {
      const { error } = await supabase.from("recent_plays").upsert(
        toMerge.map((p) => ({
          account_id: accountId,
          song_id: p.id,
          played_at: new Date(p.at).toISOString(),
        })),
        { onConflict: "account_id,song_id", ignoreDuplicates: true },
      );
      if (error) return false;
    }
    return true;
  } catch {
    // Best effort: sync still works for plays recorded after sign-in.
    return false;
  }
}

/** Drops this browser's guest history after it has been merged into an account. */
export function clearLocalRecentPlays(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // Ignore storage errors.
  }
}
