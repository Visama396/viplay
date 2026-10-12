import { useState } from "react";
import type { Account } from "../lib/auth";
import { uploadSong } from "../lib/upload";

interface UploadDialogProps {
  account: Account;
  onClose: () => void;
  onUploaded: () => void;
}

export default function UploadDialog({ account, onClose, onUploaded }: UploadDialogProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [artwork, setArtwork] = useState<File | null>(null);
  const [lyricsMode, setLyricsMode] = useState<"text" | "file">("text");
  const [lyricsText, setLyricsText] = useState("");
  const [lyrics, setLyrics] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const canSubmit = title.trim() && artist.trim() && audio;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audio) return;
    setUploading(true);
    setError("");
    setProgress("Uploading files...");

    const result = await uploadSong({
      title,
      artist,
      album,
      audio,
      artwork: artwork || undefined,
      lyrics: lyricsMode === "file" ? lyrics || undefined : undefined,
      lyricsText: lyricsMode === "text" ? lyricsText || undefined : undefined,
      uploadedBy: account.id,
    });

    setUploading(false);
    if (result.error) {
      setError(result.error);
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
        <h2 className="text-xl font-bold text-white">Upload a song</h2>
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
              placeholder="Song title"
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
              placeholder="Artist name"
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
            placeholder="Album (optional)"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Audio file *</label>
          <input
            type="file"
            accept="audio/*,.mp3,.ogg,.wav,.m4a,.flac"
            onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
            className={fileClass}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Artwork</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setArtwork(e.target.files?.[0] ?? null)}
            className={fileClass}
          />
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
                Write
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
                rows={5}
                placeholder={"[00:12.50]Hello"}
                className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-xs leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-rose-500"
              />
              <p className="mt-1 text-xs text-zinc-500">
                LRC format, e.g. <span className="font-mono">[00:12.50]Hello</span>.
                Leave empty for no lyrics.
              </p>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Lyrics (.lrc)</label>
              <input
                type="file"
                accept=".lrc,.txt,text/plain"
                onChange={(e) => setLyrics(e.target.files?.[0] ?? null)}
                className={fileClass}
              />
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
          {uploading ? "Uploading..." : "Upload song"}
        </button>
      </form>
    </div>
  );
}
