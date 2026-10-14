import { supabase } from "./supabase";
import type { Album, Artist, Genre } from "./types";

export interface Catalog {
  artists: Artist[];
  albums: Album[];
  genres: Genre[];
  /** song id -> genre names */
  songGenres: Map<string, string[]>;
}

const emptyCatalog: Catalog = {
  artists: [],
  albums: [],
  genres: [],
  songGenres: new Map(),
};

/**
 * Fetches the catalog tables. Tolerant: if the 0011 migration hasn't been
 * run yet (or the network fails), returns empty lists so the app keeps
 * working with free-text artist/album/genre values.
 */
export async function fetchCatalog(): Promise<Catalog> {
  try {
    const [artistsRes, albumsRes, genresRes, linksRes] = await Promise.all([
      supabase.from("artists").select("*").order("name"),
      supabase.from("albums").select("*").order("title"),
      supabase.from("genres").select("*").order("name"),
      supabase.from("song_genres").select("song_id, genre_id"),
    ]);
    if (artistsRes.error || albumsRes.error || genresRes.error || linksRes.error) {
      return emptyCatalog;
    }
    const artists: Artist[] = artistsRes.data ?? [];
    const albums: Album[] = albumsRes.data ?? [];
    const genres: Genre[] = genresRes.data ?? [];
    const genreById = new Map(genres.map((g) => [g.id, g.name]));
    const songGenres = new Map<string, string[]>();
    for (const link of (linksRes.data ?? []) as Array<{ song_id: string; genre_id: string }>) {
      const name = genreById.get(link.genre_id);
      if (!name) continue;
      const list = songGenres.get(link.song_id) ?? [];
      list.push(name);
      songGenres.set(link.song_id, list);
    }
    return { artists, albums, genres, songGenres };
  } catch {
    return emptyCatalog;
  }
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
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

// ---------------------------------------------------------------------------
// Recently played (per-device, localStorage — works logged out)
// ---------------------------------------------------------------------------

export interface RecentPlay {
  id: string;
  at: number;
}

const RECENT_KEY = "viplay:recently-played";
const RECENT_LIMIT = 40;

export function getRecentPlays(): RecentPlay[] {
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

/** Records a play and returns the updated ordered list (most recent first). */
export function recordPlay(songId: string): RecentPlay[] {
  const next = [
    { id: songId, at: Date.now() },
    ...getRecentPlays().filter((p) => p.id !== songId),
  ].slice(0, RECENT_LIMIT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage full/blocked: listening history just won't persist.
  }
  return next;
}
