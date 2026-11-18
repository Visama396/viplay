import { useState } from "react";
import type { Album, Artist, Song } from "../lib/types";
import { Combobox } from "./ui/combobox";
import { useI18n } from "../lib/i18n";

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
  /** Called with an existing cover path when the chosen album already has one. */
  onReuseCover?: (path: string) => void;
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
  onReuseCover,
  value,
  onChange,
  inputClass,
}: MetadataFieldsProps) {
  const { t } = useI18n();
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
  const albumChoices = matchedArtist
    ? albums.filter((al) => al.artist_id === matchedArtist.id)
    : albums;
  const albumOptions = albumChoices.map((al) => ({
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
      ? t("metadata.fromAlbum")
      : artistSongs.length > 0
        ? t("metadata.fromArtist")
        : "";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">
            {t("metadata.artist")}
          </label>
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
            placeholder={t("metadata.artistPlaceholder")}
            searchPlaceholder={t("metadata.searchArtists")}
            createLabel={(q) => t("metadata.newArtist", { name: q })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">
            {t("metadata.album")}
          </label>
          <Combobox
            options={albumOptions}
            value={value.album}
            onChange={(album) => {
              const match = albumChoices.find((al) => sameName(al.title, album));
              set({
                album,
                year: match?.year != null ? String(match.year) : value.year,
              });

              // An album that already has a song uploaded shares its cover too.
              if (!match || !value.artist.trim() || !onReuseCover) return;
              const coverSong = pool.find(
                (s) =>
                  s.artwork_path &&
                  (matchedArtist
                    ? s.artist_id === matchedArtist.id
                    : sameName(s.artist, value.artist)) &&
                  (s.album_id === match.id ||
                    (!!s.album && sameName(s.album, match.title))),
              );
              if (coverSong?.artwork_path) onReuseCover(coverSong.artwork_path);
            }}
            placeholder={t("metadata.albumPlaceholder")}
            searchPlaceholder={t("metadata.searchAlbums")}
            createLabel={(q) => t("metadata.newAlbum", { name: q })}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-400">
          {t("metadata.featured")}{" "}
          <span className="text-zinc-600">{t("metadata.optional")}</span>
        </label>
        <Combobox
          key={value.featuredArtists.join("|")}
          options={featuredOptions}
          value={featuredDraft}
          onChange={(name) => {
            addFeaturedArtist(name);
            setFeaturedDraft("");
          }}
          placeholder={t("metadata.addFeatured")}
          searchPlaceholder={t("metadata.searchArtists")}
          createLabel={(q) => t("metadata.newArtist", { name: q })}
        />
        {value.featuredArtists.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {value.featuredArtists.map((name) => (
              <span
                key={name}
                className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 py-1 pl-3 pr-1.5 text-xs text-zinc-200"
              >
                {t("metadata.feat", { name })}
                <button
                  type="button"
                  onClick={() => removeFeaturedArtist(name)}
                  className="rounded-full p-0.5 text-zinc-500 transition hover:text-white"
                  aria-label={t("metadata.removeFeatured", { name })}
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
          <label className="mb-1 block text-xs text-zinc-400">
            {t("metadata.albumYear")}
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={1900}
            max={2100}
            value={value.year}
            onChange={(e) => set({ year: e.target.value })}
            className={inputClass}
            placeholder={t("metadata.yearPlaceholder")}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">
            {t("metadata.addGenre")}
          </label>
          <Combobox
            key={value.genres.join("|")}
            options={unusedGenres.map((g) => ({ value: g }))}
            value={genreDraft}
            onChange={(g) => {
              addGenre(g);
              setGenreDraft("");
            }}
            placeholder={t("metadata.genrePlaceholder")}
            searchPlaceholder={t("metadata.searchGenres")}
            createLabel={(q) => t("metadata.newGenre", { name: q })}
          />
        </div>
      </div>

      {suggestions.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              {t("metadata.suggested")}{" "}
              <span className="text-zinc-600">({suggestionSource})</span>
            </p>
            {suggestions.length > 1 && (
              <button
                type="button"
                onClick={() => addGenres(suggestions.map((g) => g.name))}
                className="shrink-0 text-xs text-rose-400 transition hover:text-rose-300"
              >
                {t("metadata.addAll")}
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
                aria-label={t("metadata.removeGenre", { name: g })}
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
