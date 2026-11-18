import { useEffect, useState } from "react";
import { getPublicUrl } from "../lib/supabase";
import type { ArtworkOption } from "../lib/types";
import { useI18n } from "../lib/i18n";

interface ArtworkFieldProps {
  /** Covers already uploaded by any song, deduped by path. */
  covers: ArtworkOption[];
  /** Newly selected file, if the user chose to upload one. */
  file: File | null;
  onFileChange: (file: File | null) => void;
  /** Existing cover path chosen for reuse, if any. */
  selectedPath: string | null;
  onSelectPath: (path: string | null) => void;
  /** Artwork currently saved on the song (edit dialog). */
  currentPath?: string | null;
  /** Current artist, used to only offer covers from this artist's songs. */
  artist?: string;
  /** Current metadata, used to surface covers from the same album first. */
  album?: string;
  label?: string;
  inputClass: string;
  fileClass: string;
}

type ArtworkMode = "upload" | "existing";

/**
 * Artwork input shared by the upload and edit dialogs. Songs from the same
 * album usually share a cover, so besides uploading a file this lets the user
 * reuse a cover already in storage from the same artist. Reusing a path does
 * not copy the file.
 */
export function ArtworkField({
  covers = [],
  file,
  onFileChange,
  selectedPath,
  onSelectPath,
  currentPath,
  artist = "",
  album = "",
  label,
  inputClass,
  fileClass,
}: ArtworkFieldProps) {
  const { t } = useI18n();
  const fieldLabel = label?.trim() || t("artwork.label");
  const [mode, setMode] = useState<ArtworkMode>(
    selectedPath ? "existing" : "upload",
  );
  const [query, setQuery] = useState("");

  function switchMode(next: ArtworkMode) {
    setMode(next);
    // The two choices are mutually exclusive: picking one clears the other.
    if (next === "upload") onSelectPath(null);
    else onFileChange(null);
  }

  // Only covers belonging to the song's artist are valid reuse candidates: a
  // different artist's cover would be wrong for this song.
  const normalizedArtist = artist.trim().toLowerCase();
  const artistCovers = normalizedArtist
    ? covers.filter((c) => c.artist.trim().toLowerCase() === normalizedArtist)
    : [];
  const canReuse = artistCovers.length > 0;
  const activeMode: ArtworkMode = canReuse ? mode : "upload";
  const selectedAvailable =
    !selectedPath || artistCovers.some((c) => c.path === selectedPath);

  // A cover selected elsewhere (e.g. reused automatically when picking an
  // album) should be reflected in the UI.
  useEffect(() => {
    if (canReuse && selectedPath && !file) setMode("existing");
  }, [canReuse, selectedPath, file]);

  // Changing the artist can invalidate the current selection.
  useEffect(() => {
    if (!selectedAvailable) onSelectPath(null);
  }, [selectedAvailable, onSelectPath]);

  const normalizedAlbum = album.trim().toLowerCase();
  const sortedCovers = [...artistCovers].sort((a, b) => {
    if (normalizedAlbum) {
      const aMatch = a.album?.trim().toLowerCase() === normalizedAlbum;
      const bMatch = b.album?.trim().toLowerCase() === normalizedAlbum;
      if (aMatch !== bMatch) return aMatch ? -1 : 1;
    }
    return (
      (a.album ?? "").localeCompare(b.album ?? "") ||
      a.artist.localeCompare(b.artist) ||
      a.title.localeCompare(b.title)
    );
  });

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sortedCovers.filter(
        (cover) =>
          cover.title.toLowerCase().includes(q) ||
          cover.artist.toLowerCase().includes(q) ||
          (cover.album ?? "").toLowerCase().includes(q),
      )
    : sortedCovers;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-xs text-zinc-400">{fieldLabel}</label>
        {canReuse && (
          <div className="flex rounded-lg bg-zinc-900 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => switchMode("upload")}
              className={`rounded-md px-3 py-1 transition ${
                activeMode === "upload"
                  ? "bg-rose-500 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t("artwork.upload")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("existing")}
              className={`rounded-md px-3 py-1 transition ${
                activeMode === "existing"
                  ? "bg-rose-500 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t("artwork.useExisting")}
            </button>
          </div>
        )}
      </div>

      {activeMode === "upload" ? (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className={fileClass}
          />
          {currentPath && !file && (
            <p className="mt-1 text-xs text-zinc-500">
              {t("artwork.currentKept")}
            </p>
          )}
        </div>
      ) : (
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("artwork.searchPlaceholder")}
            className={`${inputClass} mb-2`}
          />
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-700 px-4 py-4 text-center text-xs text-zinc-500">
              {t("artwork.noMatches")}
            </p>
          ) : (
            <div className="grid max-h-44 grid-cols-4 gap-2 overflow-y-auto rounded-xl border border-zinc-800 p-2 sm:grid-cols-5">
              {filtered.map((cover) => {
                const selected = selectedPath === cover.path;
                const credit = `${cover.title} — ${cover.artist}${
                  cover.album ? ` (${cover.album})` : ""
                }`;
                return (
                  <button
                    type="button"
                    key={cover.path}
                    onClick={() => onSelectPath(cover.path)}
                    title={credit}
                    aria-label={t("artwork.useCoverAria", { credit })}
                    aria-pressed={selected}
                    className={`relative overflow-hidden rounded-lg ring-2 transition ${
                      selected
                        ? "ring-rose-500"
                        : "ring-transparent hover:ring-zinc-500"
                    }`}
                  >
                    <img
                      src={getPublicUrl("artwork", cover.path)}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                    {selected && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {selectedPath && (
            <p className="mt-1 text-xs text-zinc-500">
              {t("artwork.reused")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
