import { useState } from "react";
import type { Account } from "../lib/auth";
import type { Album, Artist, ArtworkOption, Song } from "../lib/types";
import { uploadSong } from "../lib/upload";
import { ArtworkField } from "./ArtworkField";
import { MetadataFields, type MetadataValue } from "./MetadataFields";
import { useI18n } from "../lib/i18n";

interface UploadDialogProps {
  account: Account;
  artists: Artist[];
  albums: Album[];
  allGenres: string[];
  /** Existing songs, used to suggest genres for the chosen artist/album. */
  songs?: Song[];
  /** Uploaded covers available for reuse. */
  covers?: ArtworkOption[];
  onClose: () => void;
  onUploaded: () => void;
}

const emptyMetadata: MetadataValue = {
  artist: "",
  album: "",
  year: "",
  genres: [],
  featuredArtists: [],
};

export default function UploadDialog({ account, artists = [], albums = [], allGenres = [], songs = [], covers = [], onClose, onUploaded }: UploadDialogProps) {
  const { t, errorText } = useI18n();
  const [title, setTitle] = useState("");
  const [meta, setMeta] = useState<MetadataValue>(emptyMetadata);
  const [audio, setAudio] = useState<File | null>(null);
  const [artwork, setArtwork] = useState<File | null>(null);
  const [artworkPath, setArtworkPath] = useState<string | null>(null);
  const [lyricsMode, setLyricsMode] = useState<"text" | "file">("text");
  const [lyricsText, setLyricsText] = useState("");
  const [lyrics, setLyrics] = useState<File | null>(null);
  const [secondaryMode, setSecondaryMode] = useState<"text" | "file">("text");
  const [secondaryLabel, setSecondaryLabel] = useState(() =>
    t("upload.romanizedPlaceholder"),
  );
  const [secondaryText, setSecondaryText] = useState("");
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [showSecondary, setShowSecondary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const canSubmit = title.trim() && meta.artist.trim() && audio;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audio) return;
    setUploading(true);
    setError("");
    setProgress(t("upload.uploadingFiles"));

    const parsedYear = parseInt(meta.year, 10);

    const result = await uploadSong({
      title,
      artist: meta.artist,
      album: meta.album,
      year: Number.isFinite(parsedYear) ? parsedYear : null,
      genres: meta.genres,
      featuredArtists: meta.featuredArtists,
      audio,
      artwork: artwork || undefined,
      artworkPath: artworkPath || undefined,
      lyrics: lyricsMode === "file" ? lyrics || undefined : undefined,
      lyricsText: lyricsMode === "text" ? lyricsText || undefined : undefined,
      secondaryLyrics:
        showSecondary && secondaryMode === "file" ? secondaryFile || undefined : undefined,
      secondaryLyricsText:
        showSecondary && secondaryMode === "text" ? secondaryText || undefined : undefined,
      secondaryLyricsLabel: showSecondary ? secondaryLabel || undefined : undefined,
      uploadedBy: account.id,
    });

    setUploading(false);
    if (result.error) {
      setError(errorText(result.error));
      setProgress("");
      return;
    }

    setProgress("");
    onUploaded();
    onClose();
  }

  const inputClass =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-rose-500";
  const fileClass = inputClass + " file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-sm file:text-zinc-200 file:transition file:hover:bg-zinc-700";

  return (
    <div className="flex flex-col rounded-2xl bg-zinc-950 p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{t("upload.title")}</h2>
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
            placeholder={t("upload.songTitlePlaceholder")}
          />
        </div>

        <MetadataFields
          artists={artists}
          albums={albums}
          allGenres={allGenres}
          songs={songs}
          value={meta}
          onChange={setMeta}
          onReuseCover={setArtworkPath}
          inputClass={inputClass}
        />

        <div>
          <label className="mb-1 block text-xs text-zinc-400">
            {t("upload.audioFile")}
          </label>
          <input
            type="file"
            accept="audio/*,.mp3,.ogg,.wav,.m4a,.flac"
            onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
            className={fileClass}
            required
          />
        </div>

        <ArtworkField
          covers={covers}
          file={artwork}
          onFileChange={setArtwork}
          selectedPath={artworkPath}
          onSelectPath={setArtworkPath}
          artist={meta.artist}
          album={meta.album}
          inputClass={inputClass}
          fileClass={fileClass}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs text-zinc-400">
              {t("upload.lyricsLabel")}
            </label>
            <div className="flex rounded-lg bg-zinc-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLyricsMode("text")}
                className={`rounded-md px-3 py-1 transition ${
                  lyricsMode === "text" ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {t("common.write")}
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
                rows={5}
                placeholder={t("upload.lrcPlaceholder")}
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-xs leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-rose-500"
              />
              <p className="mt-1 text-xs text-zinc-500">
                {t("upload.lrcHelp")}
              </p>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                {t("upload.lyricsFile")}
              </label>
              <input
                type="file"
                accept=".lrc,.txt,text/plain"
                onChange={(e) => setLyrics(e.target.files?.[0] ?? null)}
                className={fileClass}
              />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setShowSecondary((s) => !s)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs text-zinc-400 transition hover:text-white"
            aria-expanded={showSecondary}
          >
            <span>
              {t("upload.secondary")}{" "}
              <span className="text-zinc-600">{t("upload.secondaryHint")}</span>
            </span>
            <span className="text-lg leading-none">{showSecondary ? "−" : "+"}</span>
          </button>
          {showSecondary && (
            <div className="space-y-3 border-t border-zinc-800 p-4">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">
                  {t("upload.buttonLabel")}
                </label>
                <input
                  type="text"
                  value={secondaryLabel}
                  onChange={(e) => setSecondaryLabel(e.target.value)}
                  className={inputClass}
                  maxLength={24}
                  placeholder={t("upload.romanizedPlaceholder")}
                />
              </div>
              <div className="flex rounded-lg bg-zinc-900 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSecondaryMode("text")}
                  className={`rounded-md px-3 py-1 transition ${
                    secondaryMode === "text" ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {t("common.write")}
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
              {secondaryMode === "text" ? (
                <textarea
                  value={secondaryText}
                  onChange={(e) => setSecondaryText(e.target.value)}
                  spellCheck={false}
                  rows={5}
                  placeholder={t("upload.secondaryPlaceholder")}
                  className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-xs leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-rose-500"
                />
              ) : (
                <input
                  type="file"
                  accept=".lrc,.txt,text/plain"
                  onChange={(e) => setSecondaryFile(e.target.files?.[0] ?? null)}
                  className={fileClass}
                />
              )}
              <p className="text-xs text-zinc-500">
                {t("upload.secondaryHelp")}
              </p>
            </div>
          )}
        </div>

        {(error || progress) && (
          <p className={`text-center text-sm ${error ? "text-red-400" : "text-zinc-400"}`}>
            {error || progress}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading || !canSubmit}
          className="w-full rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-400 disabled:opacity-50"
        >
          {uploading ? t("upload.uploading") : t("upload.submit")}
        </button>
      </form>
    </div>
  );
}
