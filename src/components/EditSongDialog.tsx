import { useEffect, useState } from "react";
import { fetchLyrics, updateSong } from "../lib/upload";
import type { Album, Artist, ArtworkOption, Song } from "../lib/types";
import { ArtworkField } from "./ArtworkField";
import { MetadataFields, type MetadataValue } from "./MetadataFields";
import { useI18n } from "../lib/i18n";

interface EditSongDialogProps {
  song: Song;
  artists: Artist[];
  albums: Album[];
  allGenres: string[];
  /** Existing songs, used to suggest genres for the chosen artist/album. */
  songs?: Song[];
  /** Uploaded covers available for reuse. */
  covers?: ArtworkOption[];
  onClose: () => void;
  onSaved: () => void;
}

type LyricsMode = "text" | "file";

export default function EditSongDialog({ song, artists = [], albums = [], allGenres = [], songs = [], covers = [], onClose, onSaved }: EditSongDialogProps) {
  const { t, errorText } = useI18n();
  const [title, setTitle] = useState(song.title);
  const [meta, setMeta] = useState<MetadataValue>({
    artist: song.artist,
    album: song.album ?? "",
    year:
      song.album_id != null
        ? (albums.find((a) => a.id === song.album_id)?.year?.toString() ?? "")
        : "",
    genres: song.genres ?? [],
    featuredArtists: song.featured_artists ?? [],
  });
  const [artwork, setArtwork] = useState<File | null>(null);
  const [artworkPath, setArtworkPath] = useState<string | null>(null);
  const [lyricsMode, setLyricsMode] = useState<LyricsMode>("text");
  const [lyricsText, setLyricsText] = useState("");
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [lyricsLoaded, setLyricsLoaded] = useState(false);
  const [secondaryMode, setSecondaryMode] = useState<LyricsMode>("text");
  const [secondaryText, setSecondaryText] = useState("");
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [secondaryLabel, setSecondaryLabel] = useState(() =>
    t("edit.romanizedPlaceholder"),
  );
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (song.lyrics_path) {
      fetchLyrics(song.lyrics_path).then((text) => {
        if (cancelled) return;
        setLyricsText(text ?? "");
        setLyricsLoaded(true);
      });
    } else {
      setLyricsLoaded(true);
    }
    if (song.secondary_lyrics_path) {
      fetchLyrics(song.secondary_lyrics_path).then((text) => {
        if (cancelled) return;
        setSecondaryText(text ?? "");
        setSecondaryLoaded(true);
      });
    } else {
      setSecondaryText("");
      setSecondaryLoaded(true);
    }
    setSecondaryLabel(
      song.secondary_lyrics_label?.trim() || t("edit.romanizedPlaceholder"),
    );
    return () => {
      cancelled = true;
    };
  }, [song.lyrics_path, song.secondary_lyrics_path, song.secondary_lyrics_label, t]);

  const canSubmit = title.trim() && meta.artist.trim() && lyricsLoaded && secondaryLoaded;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const parsedYear = parseInt(meta.year, 10);

    const result = await updateSong(song.id, {
      title,
      artist: meta.artist,
      album: meta.album,
      year: meta.year.trim() === "" ? null : Number.isFinite(parsedYear) ? parsedYear : null,
      genres: meta.genres,
      featuredArtists: meta.featuredArtists,
      artwork: artwork || undefined,
      artworkPath: artworkPath || undefined,
      lyrics: lyricsMode === "file" ? lyricsFile || undefined : undefined,
      lyricsText: lyricsMode === "text" ? lyricsText : undefined,
      secondaryLyrics: secondaryMode === "file" ? secondaryFile || undefined : undefined,
      secondaryLyricsText: secondaryMode === "text" ? secondaryText : undefined,
      secondaryLyricsLabel: secondaryLabel,
    });

    setSaving(false);
    if (result.error) {
      setError(errorText(result.error));
      return;
    }

    onSaved();
    onClose();
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-rose-500";
  const fileClass =
    inputClass +
    " file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:text-zinc-200 file:transition file:hover:bg-zinc-700";

  return (
    <div className="flex flex-col rounded-2xl bg-zinc-950 p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{t("edit.title")}</h2>
        <button
          onClick={onClose}
          className="text-zinc-500 transition hover:text-white"
          aria-label={t("common.close")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">
            {t("upload.titleLabel")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            required
            maxLength={120}
          />
        </div>

        <MetadataFields
          artists={artists}
          albums={albums}
          allGenres={allGenres}
          songs={songs}
          excludeSongId={song.id}
          value={meta}
          onChange={setMeta}
          onReuseCover={setArtworkPath}
          inputClass={inputClass}
        />

        <ArtworkField
          covers={covers}
          file={artwork}
          onFileChange={setArtwork}
          selectedPath={artworkPath}
          onSelectPath={setArtworkPath}
          currentPath={song.artwork_path}
          artist={meta.artist}
          album={meta.album}
          label={t("edit.artworkReplace")}
          inputClass={inputClass}
          fileClass={fileClass}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs text-zinc-400">
              {t("edit.lyricsLabel")}
            </label>
            <div className="flex rounded-lg bg-zinc-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLyricsMode("text")}
                className={`rounded-md px-3 py-1 transition ${
                  lyricsMode === "text" ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {t("common.edit")}
              </button>
              <button
                type="button"
                onClick={() => setLyricsMode("file")}
                className={`rounded-md px-3 py-1 transition ${
                  lyricsMode === "file" ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {t("common.file")}
              </button>
            </div>
          </div>

          {lyricsMode === "text" ? (
            <div>
              <textarea
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                spellCheck={false}
                rows={8}
                placeholder={t("edit.lrcPlaceholder")}
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-xs leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-rose-500"
              />
              <p className="mt-1 text-xs text-zinc-500">
                {t("edit.lrcHelp")}
              </p>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept=".lrc,.txt,text/plain"
                onChange={(e) => setLyricsFile(e.target.files?.[0] ?? null)}
                className={fileClass}
              />
              {song.lyrics_path && !lyricsFile && (
                <p className="mt-1 text-xs text-zinc-500">
                  {t("edit.currentKept")}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs text-zinc-400">
              {t("edit.secondary")}{" "}
              <span className="text-zinc-600">{t("edit.secondaryHint")}</span>
            </label>
            <div className="flex rounded-lg bg-zinc-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSecondaryMode("text")}
                className={`rounded-md px-3 py-1 transition ${
                  secondaryMode === "text" ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {t("common.edit")}
              </button>
              <button
                type="button"
                onClick={() => setSecondaryMode("file")}
                className={`rounded-md px-3 py-1 transition ${
                  secondaryMode === "file" ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {t("common.file")}
              </button>
            </div>
          </div>

          <div className="mb-2">
            <label className="mb-1 block text-xs text-zinc-400">
              {t("edit.buttonLabel")}
            </label>
            <input
              type="text"
              value={secondaryLabel}
              onChange={(e) => setSecondaryLabel(e.target.value)}
              className={inputClass}
              maxLength={24}
              placeholder={t("edit.romanizedPlaceholder")}
            />
          </div>

          {secondaryMode === "text" ? (
            <div>
              <textarea
                value={secondaryText}
                onChange={(e) => setSecondaryText(e.target.value)}
                spellCheck={false}
                rows={8}
                placeholder={t("edit.secondaryPlaceholder")}
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-xs leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-rose-500"
              />
              <p className="mt-1 text-xs text-zinc-500">
                {t("edit.secondaryHelp")}
              </p>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept=".lrc,.txt,text/plain"
                onChange={(e) => setSecondaryFile(e.target.files?.[0] ?? null)}
                className={fileClass}
              />
              {song.secondary_lyrics_path && !secondaryFile && (
                <p className="mt-1 text-xs text-zinc-500">
                  {t("edit.currentSecondaryKept")}
                </p>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="w-full rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:opacity-50"
        >
          {saving ? t("common.saving") : t("edit.saveChanges")}
        </button>
      </form>
    </div>
  );
}
