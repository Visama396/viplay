import { useState } from "react";
import { getPublicUrl } from "../lib/supabase";
import type { Account } from "../lib/auth";
import type { PlaylistWithSongs, Song } from "../lib/types";
import { isPlaylistOwner } from "../lib/playlists";

export interface HomeProps {
  songs: Song[];
  playlists: PlaylistWithSongs[];
  currentId: string | null;
  onPlay: (songs: Song[]) => void;
  account: Account | null;
  onLogin: () => void;
  onLogout: () => void;
  onUpload: () => void;
  onChangePassword: () => void;
  onEdit: (song: Song) => void;
  onDelete: (songId: string) => void;
  onCreatePlaylist: () => void;
  onManagePlaylist: (playlist: PlaylistWithSongs) => void;
  onCopyPlaylist: (playlist: PlaylistWithSongs) => void;
  onQuickAdd: (songId: string, playlist: PlaylistWithSongs) => void;
}

export default function Home({
  songs,
  playlists,
  currentId,
  onPlay,
  account,
  onLogin,
  onLogout,
  onUpload,
  onChangePassword,
  onEdit,
  onDelete,
  onCreatePlaylist,
  onManagePlaylist,
  onCopyPlaylist,
  onQuickAdd,
}: HomeProps) {
  const [query, setQuery] = useState("");
  const [addMenuSongId, setAddMenuSongId] = useState<string | null>(null);

  const filtered = songs.filter(
    (s) =>
      !query ||
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.artist.toLowerCase().includes(query.toLowerCase()),
  );

  const myPlaylists = playlists.filter((pl) => isPlaylistOwner(pl, account));

  return (
    <div className="flex h-full">
      <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-zinc-800 p-4 sm:block">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Playlists
          </h2>
          <button
            onClick={onCreatePlaylist}
            className="rounded-full px-2 py-0.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            aria-label="New playlist"
            title="New playlist"
          >
            +
          </button>
        </div>
        <div className="space-y-1">
          {playlists.map((pl) => {
            const owner = isPlaylistOwner(pl, account);
            return (
              <div
                key={pl.id}
                className="group/pl flex w-full items-center gap-1 rounded-lg transition hover:bg-zinc-800/60"
              >
                <button
                  onClick={() => onPlay(pl.songs)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2 text-left"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 truncate text-sm text-zinc-200">
                      {!pl.is_public && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-zinc-500">
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      )}
                      <span className="truncate">{pl.name}</span>
                    </span>
                    <span className="block truncate text-[11px] text-zinc-500">
                      by {pl.creator_name ?? "Unknown"}
                    </span>
                  </span>
                  <span className="ml-2 shrink-0 text-xs text-zinc-500">
                    {pl.songs.length}
                  </span>
                </button>
                {owner && (
                  <button
                    onClick={() => onManagePlaylist(pl)}
                    className="shrink-0 rounded-full p-1.5 text-zinc-500 opacity-0 transition hover:bg-zinc-700 hover:text-white group-hover/pl:opacity-100"
                    aria-label={`Edit ${pl.name}`}
                    title="Edit playlist"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                {account && !owner && (
                  <button
                    onClick={() => onCopyPlaylist(pl)}
                    className="shrink-0 rounded-full p-1.5 text-zinc-500 opacity-0 transition hover:bg-zinc-700 hover:text-white group-hover/pl:opacity-100"
                    aria-label={`Copy ${pl.name}`}
                    title="Make a copy"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
          {playlists.length === 0 && (
            <p className="px-3 text-sm text-zinc-600">No playlists yet</p>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-2xl font-bold text-white">ViPlay</h1>
            <p className="text-sm text-zinc-400">Browse songs and playlists</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs..."
              className="w-full max-w-xs rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-rose-500"
            />
            {account ? (
              <>
                <button
                  onClick={onUpload}
                  className="rounded-full bg-rose-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-rose-400"
                >
                  Upload
                </button>
                <span className="hidden text-sm font-medium text-zinc-300 sm:block">
                  {account.display_name}
                </span>
                <button
                  onClick={onChangePassword}
                  className="hidden rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white sm:block"
                >
                  Password
                </button>
                <button
                  onClick={onLogout}
                  className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="rounded-full bg-rose-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-rose-400"
              >
                Login
              </button>
            )}
          </div>
        </div>

        <div className="px-6 pb-2 sm:hidden">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Playlists
            </h2>
            <button
              onClick={onCreatePlaylist}
              className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              + New
            </button>
          </div>
          {playlists.length === 0 ? (
            <p className="py-2 text-sm text-zinc-600">No playlists yet</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {playlists.map((pl) => {
                const owner = isPlaylistOwner(pl, account);
                return (
                  <div
                    key={pl.id}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 py-1 pl-3 pr-1"
                  >
                    <button
                      onClick={() => onPlay(pl.songs)}
                      className="flex items-center gap-1.5 text-left"
                    >
                      {!pl.is_public && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-zinc-500">
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      )}
                      <span className="max-w-32 truncate text-xs text-zinc-200">
                        {pl.name}
                      </span>
                      <span className="text-[11px] text-zinc-500">{pl.songs.length}</span>
                    </button>
                    {owner ? (
                      <button
                        onClick={() => onManagePlaylist(pl)}
                        className="rounded-full p-1.5 text-zinc-500 transition hover:text-white"
                        aria-label={`Edit ${pl.name}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    ) : (
                      account && (
                        <button
                          onClick={() => onCopyPlaylist(pl)}
                          className="rounded-full p-1.5 text-zinc-500 transition hover:text-white"
                          aria-label={`Copy ${pl.name}`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((song) => {
              const isCurrent = song.id === currentId;
              const isAdmin = account?.username === "visama396";
              const isOwner = account != null && song.uploaded_by === account.id;
              const canEdit = isAdmin || isOwner;
              const menuOpen = addMenuSongId === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => onPlay([song])}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onPlay([song]);
                  }}
                  role="button"
                  tabIndex={0}
                  className={`group relative cursor-pointer overflow-hidden rounded-xl bg-zinc-900 p-3 transition hover:bg-zinc-800 ${
                    isCurrent ? "ring-2 ring-rose-500" : ""
                  }`}
                >
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(song.id);
                      }}
                      className="absolute right-2 top-2 z-10 rounded-full bg-zinc-900/90 p-1.5 text-zinc-300 opacity-0 transition hover:bg-red-600 hover:text-white group-hover:opacity-100"
                      aria-label={`Delete ${song.title}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4h8v2m1 0v14a2 2 0 01-2 2H9a2 2 0 01-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(song);
                      }}
                      className="absolute right-9 top-2 z-10 rounded-full bg-zinc-900/90 p-1.5 text-zinc-300 opacity-0 transition hover:bg-zinc-700 hover:text-white group-hover:opacity-100"
                      aria-label={`Edit ${song.title}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                  {song.artwork_path && (
                    <img
                      src={getPublicUrl("artwork", song.artwork_path)}
                      alt={`${song.title} artwork`}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  )}
                  <div className="mt-3">
                    <div className="truncate text-sm font-semibold text-zinc-100">
                      {song.title}
                    </div>
                    <div className="truncate text-xs text-zinc-400">{song.artist}</div>
                  </div>
                  <div className="relative mt-2 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay([song]);
                      }}
                      className="rounded-full bg-rose-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-rose-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                      aria-label="Play"
                    >
                      Play
                    </button>
                    {account && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddMenuSongId(menuOpen ? null : song.id);
                        }}
                        className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                        aria-label={`Add ${song.title} to playlist`}
                        title="Add to playlist"
                      >
                        +
                      </button>
                    )}
                    {menuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddMenuSongId(null);
                          }}
                        />
                        <div
                          className="absolute bottom-8 left-0 z-30 w-52 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="border-b border-zinc-800 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                            Add to playlist
                          </div>
                          <div className="max-h-48 overflow-y-auto py-1">
                            {myPlaylists.length === 0 && (
                              <p className="px-3 py-2 text-xs text-zinc-500">
                                No playlists yet
                              </p>
                            )}
                            {myPlaylists.map((pl) => (
                              <button
                                key={pl.id}
                                onClick={() => {
                                  onQuickAdd(song.id, pl);
                                  setAddMenuSongId(null);
                                }}
                                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs text-zinc-200 transition hover:bg-zinc-800"
                              >
                                <span className="truncate">{pl.name}</span>
                                <span className="shrink-0 text-[11px] text-zinc-500">
                                  {pl.songs.length}
                                </span>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              setAddMenuSongId(null);
                              onCreatePlaylist();
                            }}
                            className="w-full border-t border-zinc-800 px-3 py-2 text-left text-xs font-medium text-rose-400 transition hover:bg-zinc-800"
                          >
                            + New playlist
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full py-16 text-center text-zinc-500">
                No songs found
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
