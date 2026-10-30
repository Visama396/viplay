import { useState } from "react";
import type { PlaylistWithSongs, Song } from "../lib/types";

interface PlaylistViewDialogProps {
  playlist: PlaylistWithSongs;
  onPlay: (songs: Song[]) => void;
  onOpenChange: (open: boolean) => void;
  currentSongId?: string | null;
  isPlaying?: boolean;
}

export default function PlaylistViewDialog({
  playlist,
  onPlay,
  onOpenChange,
  currentSongId,
  isPlaying = false,
}: PlaylistViewDialogProps) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const songs = q
    ? playlist.songs.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          (s.album ?? "").toLowerCase().includes(q) ||
          (s.genres ?? []).some((g) => g.toLowerCase().includes(q)),
      )
    : playlist.songs;

  const isCurrentSong = (id: string) => id === currentSongId;

  return (
    <div className="flex max-h-80 flex-col rounded-2xl bg-zinc-950 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-white">{playlist.name}</h2>
          <p className="truncate text-xs text-zinc-400">
            by {playlist.creator_name ?? "Unknown"}
          </p>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="shrink-0 text-zinc-500 transition hover:text-white"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search songs..."
        className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-rose-500"
      />

      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Songs ({songs.length})</h3>
        {songs.length > 0 && (
          <button
            onClick={() => onPlay(playlist.songs)}
            className="text-xs font-medium text-rose-400 transition hover:text-rose-300"
          >
            Play all
          </button>
        )}
      </div>

      {songs.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">No songs found.</p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {songs.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-zinc-800/60"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-zinc-200">{s.title}</div>
                <div className="truncate text-xs text-zinc-500">{s.artist}</div>
              </div>
              <button
                onClick={() => onPlay([s])}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-200 transition hover:bg-rose-500 hover:text-white"
                aria-label={isCurrentSong(s.id) ? `Now playing ${s.title}` : `Play ${s.title}`}
              >
                {isCurrentSong(s.id) && isPlaying ? (
                  <span
                    className="flex h-3.5 items-center gap-0.5"
                    aria-hidden="true"
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="w-0.5 rounded-full bg-current"
                        style={{
                          height: "60%",
                          animation: "viplay-eq 0.8s ease-in-out infinite",
                          animationDelay: `${i * 0.13}s`,
                        }}
                      />
                    ))}
                  </span>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
