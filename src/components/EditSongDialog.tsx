import { useEffect, useState } from "react";
import { fetchLyrics, updateSong } from "../lib/upload";
import type { Song } from "../lib/types";

interface EditSongDialogProps {
  song: Song;
  onClose: () => void;
  onSaved: () => void;
}

type LyricsMode = "text" | "file";

export default function EditSongDialog({ song, onClose, onSaved }: EditSongDialogProps) {
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [album, setAlbum] = useState(song.album ?? "");
  const [artwork, setArtwork] = useState<File | null>(null);
  const [lyricsMode, setLyricsMode] = useState<LyricsMode>("text");
  const [lyricsText, setLyricsText] = useState("");
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [lyricsLoaded, setLyricsLoaded] = useState(false);
  const [secondaryMode, setSecondaryMode] = useState<LyricsMode>("text");
  const [secondaryText, setSecondaryText] = useState("");
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [secondaryLabel, setSecondaryLabel] = useState("Romanized");
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
    setSecondaryLabel(song.secondary_lyrics_label?.trim() || "Romanized");
    return () => {
      cancelled = true;
    };
  }, [song.lyrics_path, song.secondary_lyrics_path, song.secondary_lyrics_label]);

  const canSubmit = title.trim() && artist.trim() && lyricsLoaded && secondaryLoaded;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const result = await updateSong(song.id, {
      title,
      artist,
      album,
      artwork: artwork || undefined,
      lyrics: lyricsMode === "file" ? lyricsFile || undefined : undefined,
      lyricsText: lyricsMode === "text" ? lyricsText : undefined,
      secondaryLyrics: secondaryMode === "file" ? secondaryFile || undefined : undefined,
      secondaryLyricsText: secondaryMode === "text" ? secondaryText : undefined,
      secondaryLyricsLabel: secondaryLabel,
    });

    setSaving(false);
    if (result.error) {
      setError(result.error);
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
        <h2 className="text-xl font-bold text-white">Edit song</h2>
        <button
          onClick={onClose}
          className="text-zinc-500 transition hover:text-white"
          aria-label="Close"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              required
              maxLength={120}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Artist *</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className={inputClass}
              required
              maxLength={120}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Album</label>
          <input
            type="text"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            className={inputClass}
            maxLength={120}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Artwork (replace)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setArtwork(e.target.files?.[0] ?? null)}
            className={fileClass}
          />
          {song.artwork_path && !artwork && (
            <p className="mt-1 text-xs text-zinc-500">Current artwork will be kept.</p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs text-zinc-400">Lyrics</label>
            <div className="flex rounded-lg bg-zinc-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLyricsMode("text")}
                className={`rounded-md px-3 py-1 transition ${
                  lyricsMode === "text" ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setLyricsMode("file")}
                className={`rounded-md px-3 py-1 transition ${
                  lyricsMode === "file" ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                File
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
                placeholder={"[mm:ss.xx]Line 1\n[mm:ss.xx]Line 2"}
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-xs leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-rose-500"
              />
              <p className="mt-1 text-xs text-zinc-500">
                LRC format — one line per timestamp, e.g. <span className="font-mono">[00:12.50]Hello</span>.
                Empty clears lyrics.
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
                <p className="mt-1 text-xs text-zinc-500">Current lyrics will be kept.</p>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs text-zinc-400">
              Secondary lyrics{" "}
              <span className="text-zinc-600">(romanized / transliteration)</span>
            </label>
            <div className="flex rounded-lg bg-zinc-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSecondaryMode("text")}
                className={`rounded-md px-3 py-1 transition ${
                  secondaryMode === "text" ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setSecondaryMode("file")}
                className={`rounded-md px-3 py-1 transition ${
                  secondaryMode === "file" ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                File
              </button>
            </div>
          </div>

          <div className="mb-2">
            <label className="mb-1 block text-xs text-zinc-400">Button label</label>
            <input
              type="text"
              value={secondaryLabel}
              onChange={(e) => setSecondaryLabel(e.target.value)}
              className={inputClass}
              maxLength={24}
              placeholder="Romanized"
            />
          </div>

          {secondaryMode === "text" ? (
            <div>
              <textarea
                value={secondaryText}
                onChange={(e) => setSecondaryText(e.target.value)}
                spellCheck={false}
                rows={8}
                placeholder={"[mm:ss.xx]Romaji line 1\n[mm:ss.xx]Romaji line 2"}
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-xs leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-rose-500"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Same timestamps as the original, alternate script. Empty clears
                secondary lyrics.
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
                <p className="mt-1 text-xs text-zinc-500">Current secondary lyrics will be kept.</p>
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
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
