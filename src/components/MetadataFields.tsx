import { useState } from "react";
import type { Album, Artist, Song } from "../lib/types";
import { Combobox } from "./ui/combobox";

export interface MetadataValue {
  artist: string;
  album: string;
  year: string;
  genres: string[];
  /** Extra artists credited alongside the primary artist ("feat."). */
  featuredArtists: string[];
}

interface MetadataFieldsProps {
  artists: Artist[];
  albums: Album[];
  allGenres: string[];
  /** Existing catalog songs, used to suggest genres for the selected artist/album. */
  songs?: Song[];
  /** Song being edited, excluded from its own genre suggestions. */
  excludeSongId?: string;
  value: MetadataValue;
  onChange: (value: MetadataValue) => void;
  inputClass: string;
}

/**
 * Artist / album / year / genre / featured-artist inputs shared by the upload
 * and edit dialogs. Artist and album use autocomplete comboboxes fed by the
 * catalog tables, so reusing an existing author/band or album is one click
 * while new names are created inline on save.
 */
export function MetadataFields({
  artists = [],
  albums = [],
  allGenres = [],
  songs = [],
  excludeSongId,
  value,
  onChange,
  inputClass,
}: MetadataFieldsProps) {
  const [genreDraft, setGenreDraft] = useState("");
  const [featuredDraft, setFeaturedDraft] = useState("");

  const set = (patch: Partial<MetadataValue>) => onChange({ ...value, ...patch });

  const sameName = (a: string, b: string) =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

  function addFeaturedArtist(name: string) {
    const clean = name.trim();
    if (!clean || sameName(clean, value.artist)) return;
    if (value.featuredArtists.some((f) => sameName(f, clean))) return;
    set({ featuredArtists: [...value.featuredArtists, clean] });
  }

  function removeFeaturedArtist(name: string) {
    set({ featuredArtists: value.featuredArtists.filter((f) => f !== name) });
  }

  // The primary artist can't also be featured, and each guest appears once.
  const featuredOptions = artists
    .filter((a) => !sameName(a.name, value.artist))
    .filter(
      (a) => !value.featuredArtists.some((f) => sameName(f, a.name)),
    )
    .map((a) => ({ value: a.name }));

  // Album suggestions narrow to the selected artist when it matches a known one.
  const matchedArtist = artists.find(
    (a) => a.name.trim().toLowerCase() === value.artist.trim().toLowerCase(),
  );
  const albumOptions = (matchedArtist
    ? albums.filter((al) => al.artist_id === matchedArtist.id)
    : albums
  ).map((al) => ({
    value: al.title,
    hint: al.year != null ? String(al.year) : undefined,
  }));

  const unusedGenres = allGenres.filter(
    (g) => !value.genres.some((v) => v.toLowerCase() === g.toLowerCase()),
  );

  function addGenre(name: string) {
    const clean = name.trim();
    if (!clean) return;
    if (value.genres.some((g) => g.toLowerCase() === clean.toLowerCase())) return;
    set({ genres: [...value.genres, clean] });
  }

  function addGenres(names: string[]) {
    const next = [...value.genres];
    for (const name of names) {
      const clean = name.trim();
      if (!clean) continue;
      if (next.some((g) => g.toLowerCase() === clean.toLowerCase())) continue;
      next.push(clean);
    }
    set({ genres: next });
  }

  function removeGenre(name: string) {
    set({ genres: value.genres.filter((g) => g !== name) });
  }

  // Genres already used by this artist's catalog songs. Album matches are
  // ranked above the artist's other releases, and every suggestion is added
  // only when the user clicks it (unlike the album year, which is exact).
  const pool = songs.filter((s) => s.id !== excludeSongId);
  const artistSongs = value.artist.trim()
    ? pool.filter(
        (s) =>
          (matchedArtist ? s.artist_id === matchedArtist.id : false) ||
          sameName(s.artist, value.artist),
      )
    : [];
  const albumSongIds = new Set(
    value.album.trim()
      ? artistSongs
          .filter((s) => s.album && sameName(s.album, value.album))
          .map((s) => s.id)
      : [],
  );

  const genreScores = new Map<
    string,
    { name: string; albumCount: number; artistCount: number }
  >();
  for (const song of artistSongs) {
    const inAlbum = albumSongIds.has(song.id);
    for (const genre of song.genres ?? []) {
      const clean = genre.trim();
      if (!clean) continue;
      const key = clean.toLowerCase();
      const entry = genreScores.get(key) ?? {
        name: clean,
        albumCount: 0,
        artistCount: 0,
      };
      entry.artistCount += 1;
      if (inAlbum) entry.albumCount += 1;
      genreScores.set(key, entry);
    }
  }

  const suggestions = [...genreScores.values()]
    .filter((g) => !value.genres.some((v) => v.toLowerCase() === g.name.toLowerCase()))
    .sort(
      (a, b) =>
        b.albumCount - a.albumCount ||
        b.artistCount - a.artistCount ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 8);

  const suggestionSource =
    albumSongIds.size > 0
      ? "from other songs in this album"
      : artistSongs.length > 0
        ? "from this artist's songs"
        : "";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Artist *</label>
          <Combobox
            options={artists.map((a) => ({ value: a.name }))}
            value={value.artist}
            onChange={(artist) =>
              onChange({
                ...value,
                artist,
                featuredArtists: value.featuredArtists.filter(
                  (f) => !sameName(f, artist),
                ),
              })
            }
            placeholder="Artist name"
            searchPlaceholder="Search artists..."
            createLabel={(q) => `New artist "${q}"`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Album</label>
          <Combobox
            options={albumOptions}
            value={value.album}
            onChange={(album) => {
              const match = albums.find(
                (al) => al.title.toLowerCase() === album.trim().toLowerCase(),
              );
              set({
                album,
                year: match?.year != null ? String(match.year) : value.year,
              });
            }}
            placeholder="Album (optional)"
            searchPlaceholder="Search albums..."
            createLabel={(q) => `New album "${q}"`}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-400">
          Featured artists <span className="text-zinc-600">(optional)</span>
        </label>
        <Combobox
          key={value.featuredArtists.join("|")}
          options={featuredOptions}
          value={featuredDraft}
          onChange={(name) => {
            addFeaturedArtist(name);
            setFeaturedDraft("");
          }}
          placeholder="Add a featured artist..."
          searchPlaceholder="Search artists..."
          createLabel={(q) => `New artist "${q}"`}
        />
        {value.featuredArtists.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {value.featuredArtists.map((name) => (
              <span
                key={name}
                className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 py-1 pl-3 pr-1.5 text-xs text-zinc-200"
              >
                feat. {name}
                <button
                  type="button"
                  onClick={() => removeFeaturedArtist(name)}
                  className="rounded-full p-0.5 text-zinc-500 transition hover:text-white"
                  aria-label={`Remove featured artist ${name}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Album year</label>
          <input
            type="number"
            inputMode="numeric"
            min={1900}
            max={2100}
            value={value.year}
            onChange={(e) => set({ year: e.target.value })}
            className={inputClass}
            placeholder="e.g. 2024"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Add genre</label>
          <Combobox
            key={value.genres.join("|")}
            options={unusedGenres.map((g) => ({ value: g }))}
            value={genreDraft}
            onChange={(g) => {
              addGenre(g);
              setGenreDraft("");
            }}
            placeholder="Type or pick a genre..."
            searchPlaceholder="Search genres..."
            createLabel={(q) => `New genre "${q}"`}
          />
        </div>
      </div>

      {suggestions.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              Suggested genres{" "}
              <span className="text-zinc-600">({suggestionSource})</span>
            </p>
            {suggestions.length > 1 && (
              <button
                type="button"
                onClick={() => addGenres(suggestions.map((g) => g.name))}
                className="shrink-0 text-xs text-rose-400 transition hover:text-rose-300"
              >
                Add all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((g) => (
              <button
                key={g.name}
                type="button"
                onClick={() => addGenre(g.name)}
                className="group flex items-center gap-1 rounded-full border border-dashed border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-rose-500/60 hover:text-white"
              >
                <span className="text-zinc-500 transition group-hover:text-rose-400">
                  +
                </span>
                {g.name}
                {g.artistCount > 1 && (
                  <span className="text-[10px] text-zinc-500">
                    {g.artistCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {value.genres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.genres.map((g) => (
            <span
              key={g}
              className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 py-1 pl-3 pr-1.5 text-xs text-zinc-200"
            >
              {g}
              <button
                type="button"
                onClick={() => removeGenre(g)}
                className="rounded-full p-0.5 text-zinc-500 transition hover:text-white"
                aria-label={`Remove genre ${g}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
