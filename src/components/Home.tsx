import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { getPublicUrl } from "../lib/supabase";
import { artistCredit } from "../lib/catalog";
import type { Account } from "../lib/auth";
import type { Artist, PlaylistWithSongs, Song } from "../lib/types";
import { isPlaylistOwner } from "../lib/playlists";
import { Skeleton } from "./ui/skeleton";
import TiltedCard from "./TiltedCard.jsx";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar";

export interface HomeProps {
  songs: Song[];
  playlists: PlaylistWithSongs[];
  artists: Artist[];
  allGenres: string[];
  recentIds: string[];
  loading?: boolean;
  currentId: string | null;
  onPlay: (songs: Song[]) => void;
  account: Account | null;
  onLogin: () => void;
  onLogout: () => void;
  onUpload: () => void;
  onAccount: () => void;
  onEdit: (song: Song) => void;
  onDelete: (songId: string) => void;
  onCreatePlaylist: () => void;
  onManagePlaylist: (playlist: PlaylistWithSongs) => void;
  onCopyPlaylist: (playlist: PlaylistWithSongs) => void;
  onQuickAdd: (songId: string, playlist: PlaylistWithSongs) => void;
  onPlayPlaylist: (playlist: PlaylistWithSongs) => void;
}

export default function Home({
  songs,
  playlists,
  artists = [],
  allGenres = [],
  recentIds = [],
  loading = false,
  currentId,
  onPlay,
  account,
  onLogin,
  onLogout,
  onUpload,
  onAccount,
  onEdit,
  onDelete,
  onCreatePlaylist,
  onManagePlaylist,
  onCopyPlaylist,
  onQuickAdd,
  onPlayPlaylist,
}: HomeProps) {
  const [query, setQuery] = useState("");
  const [addMenuSongId, setAddMenuSongId] = useState<string | null>(null);
  const [genre, setGenre] = useState<string | null>(null);
  const [artistKey, setArtistKey] = useState<string | null>(null);

  const primaryArtistKey = (s: Song) =>
    s.artist_id ? `id:${s.artist_id}` : `text:${s.artist.trim().toLowerCase()}`;

  // Every artist credited on a song (primary + featured), so clicking any of
  // them shows collaborations too.
  const songArtistKeys = (s: Song) => {
    const keys = [primaryArtistKey(s)];
    const featuredIds = s.featured_artist_ids ?? [];
    if (featuredIds.length > 0) {
      for (const id of featuredIds) keys.push(`id:${id}`);
    } else {
      for (const name of s.featured_artists ?? []) {
        if (name.trim()) keys.push(`text:${name.trim().toLowerCase()}`);
      }
    }
    return [...new Set(keys)];
  };

  // Unified artist list: catalog artists plus any free-text artist on songs
  // without a catalog row yet (e.g. before the 0011 migration is run).
  const artistEntries = (() => {
    const artistById = new Map(artists.map((a) => [a.id, a.name]));
    const previewByKey = new Map<string, string>();
    for (const s of songs) {
      previewByKey.set(primaryArtistKey(s), s.artist);
      for (const name of s.featured_artists ?? []) {
        if (name.trim()) previewByKey.set(`text:${name.trim().toLowerCase()}`, name);
      }
      for (const id of s.featured_artist_ids ?? []) {
        previewByKey.set(`id:${id}`, artistById.get(id) ?? "");
      }
    }

    const counts = new Map<string, { name: string; count: number }>();
    for (const s of songs) {
      for (const key of songArtistKeys(s)) {
        const fallback = previewByKey.get(key) ?? s.artist;
        const name = key.startsWith("id:")
          ? (artistById.get(key.slice(3)) ?? fallback)
          : fallback;
        const entry = counts.get(key) ?? { name, count: 0 };
        entry.count += 1;
        entry.name = name;
        counts.set(key, entry);
      }
    }
    return [...counts.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  })();

  const activeArtist = artistEntries.find((a) => a.key === artistKey) ?? null;

  const filtered = songs.filter((s) => {
    if (
      genre &&
      !(s.genres ?? []).some((g) => g.toLowerCase() === genre.toLowerCase())
    ) {
      return false;
    }
    if (artistKey && !songArtistKeys(s).includes(artistKey)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      (s.featured_artists ?? []).some((a) => a.toLowerCase().includes(q)) ||
      (s.album ?? "").toLowerCase().includes(q) ||
      (s.genres ?? []).some((g) => g.toLowerCase().includes(q))
    );
  });

  const isBrowsing = !query && !genre && !artistKey;

  const lastAdded = [...songs]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 10);

  // Most listened (server-side counts; empty until the first play, in which
  // case the rail falls back to Last Added).
  const mostListened = [...songs]
    .filter((s) => (s.play_count ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.play_count ?? 0) - (a.play_count ?? 0) ||
        +new Date(b.created_at) - +new Date(a.created_at),
    )
    .slice(0, 10);

  const songById = new Map(songs.map((s) => [s.id, s]));
  const recentSongs = recentIds
    .map((id) => songById.get(id))
    .filter((s): s is Song => Boolean(s));

  const myPlaylists = playlists.filter((pl) => isPlaylistOwner(pl, account));

  return (
    <SidebarProvider
      className="relative h-full min-h-0 w-full"
      style={{ "--sidebar-width": "18rem" } as CSSProperties}
    >
      <LibrarySidebar
        allGenres={allGenres}
        genre={genre}
        onGenreChange={setGenre}
        playlists={playlists}
        loading={loading}
        account={account}
        onLogin={onLogin}
        onLogout={onLogout}
        onAccount={onAccount}
        onCreatePlaylist={onCreatePlaylist}
        onPlayPlaylist={onPlayPlaylist}
        onManagePlaylist={onManagePlaylist}
        onCopyPlaylist={onCopyPlaylist}
        artistEntries={artistEntries}
        artistKey={artistKey}
        onSelectArtist={setArtistKey}
      />

      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 p-4 sm:flex-nowrap sm:gap-4 sm:p-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SidebarTrigger className="shrink-0 text-zinc-400 hover:bg-zinc-800 hover:text-white" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white">ViPlay</h1>
              <p className="text-sm text-zinc-400">Browse songs and playlists</p>
            </div>
          </div>
          {account && (
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                onClick={onUpload}
                className="shrink-0 rounded-full bg-rose-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-rose-400"
              >
                Upload
              </button>
            </div>
          )}
        </div>

        <div className="px-6 pb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs..."
            className="w-full rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-rose-500 sm:max-w-md"
          />
        </div>

        {activeArtist && (
          <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
            <span className="flex items-center gap-1.5 rounded-full bg-rose-500/15 py-1 pl-3 pr-1.5 text-xs font-medium text-rose-300">
              {activeArtist.name}
              <button
                onClick={() => setArtistKey(null)}
                className="rounded-full p-0.5 text-rose-300/70 transition hover:text-white"
                aria-label="Clear artist filter"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </span>
            <span className="text-[11px] text-zinc-500">
              {filtered.length} song{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
        )}

        <div className="px-6 pb-6">
          {isBrowsing && !loading && recentSongs.length > 0 && (
            <Section title="Recently listened" padded>
              {recentSongs.map((song) => (
                <RailCard key={song.id} song={song} onPlay={onPlay} tilt />
              ))}
            </Section>
          )}
          {isBrowsing && !loading && mostListened.length > 0 && (
            <Section title="Most listened" padded>
              {mostListened.map((song) => (
                <RailCard
                  key={song.id}
                  song={song}
                  plays={song.play_count}
                  onPlay={onPlay}
                  tilt
                />
              ))}
            </Section>
          )}
          {isBrowsing && !loading && mostListened.length === 0 && lastAdded.length > 0 && (
            <Section title="Last Added">
              {lastAdded.map((song) => (
                <RailCard key={song.id} song={song} onPlay={onPlay} />
              ))}
            </Section>
          )}
          {isBrowsing && !loading && (
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              All songs
            </h2>
          )}
          <div className="flex max-h-[35rem] flex-col overflow-y-auto pr-1">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-2 py-2"
                    aria-label="Loading song"
                  >
                    <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="mt-1.5 h-3 w-1/2" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-8 rounded-full" />
                    </div>
                  </div>
                ))
              : filtered.map((song) => {
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
                  className={`group relative flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-zinc-800/60 ${isCurrent ? "bg-zinc-800/60" : ""}`}
                >
                  {song.artwork_path ? (
                    <img
                      src={getPublicUrl("artwork", song.artwork_path)}
                      alt={`${song.title} artwork`}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-600">
                      {song.title.trim().charAt(0).toUpperCase() || "♪"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-zinc-100">
                      {song.title}
                    </div>
                    <div className="truncate text-xs text-zinc-400">{artistCredit(song)}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(song.id);
                        }}
                        className="rounded-full bg-zinc-900/90 p-1.5 text-zinc-300 opacity-0 transition hover:bg-red-600 hover:text-white group-hover:opacity-100"
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
                        className="rounded-full bg-zinc-900/90 p-1.5 text-zinc-300 opacity-0 transition hover:bg-zinc-700 hover:text-white group-hover:opacity-100"
                        aria-label={`Edit ${song.title}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay([song]);
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-200 transition hover:bg-rose-500 hover:text-white"
                      aria-label="Play"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
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
            {!loading && filtered.length === 0 && (
              <p className="py-16 text-center text-zinc-500">
                No songs found
              </p>
            )}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}

function LibrarySidebar({
  allGenres,
  genre,
  onGenreChange,
  playlists,
  loading,
  account,
  onLogin,
  onLogout,
  onAccount,
  onCreatePlaylist,
  onPlayPlaylist,
  onManagePlaylist,
  onCopyPlaylist,
  artistEntries,
  artistKey,
  onSelectArtist,
}: {
  allGenres: string[];
  genre: string | null;
  onGenreChange: (genre: string | null) => void;
  playlists: PlaylistWithSongs[];
  loading: boolean;
  account: Account | null;
  onLogin: () => void;
  onLogout: () => void;
  onAccount: () => void;
  onCreatePlaylist: () => void;
  onPlayPlaylist: (playlist: PlaylistWithSongs) => void;
  onManagePlaylist: (playlist: PlaylistWithSongs) => void;
  onCopyPlaylist: (playlist: PlaylistWithSongs) => void;
  artistEntries: Array<{ key: string; name: string; count: number }>;
  artistKey: string | null;
  onSelectArtist: (key: string | null) => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar className="absolute h-full border-zinc-800">
      <SidebarHeader className="shrink-0 flex-row items-center justify-end p-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpenMobile(false)}
          className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          aria-label="Close sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </SidebarHeader>

      <SidebarContent className="gap-5 overflow-hidden px-4 pt-4 pb-4">
        {allGenres.length > 0 && (
          <SidebarGroup className="min-h-0 flex-1 basis-0 flex-col p-0">
            <SidebarGroupLabel className="mb-3 h-auto shrink-0 px-0 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Genres
            </SidebarGroupLabel>
            <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto pr-1">
              <GenreFilter
                genres={allGenres}
                genre={genre}
                onChange={(next) => {
                  onGenreChange(next);
                  closeOnMobile();
                }}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="min-h-0 flex-1 basis-0 flex-col p-0">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <SidebarGroupLabel className="h-auto px-0 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Playlists
            </SidebarGroupLabel>
            <button
              onClick={() => {
                onCreatePlaylist();
                closeOnMobile();
              }}
              className="rounded-full px-2 py-0.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              aria-label="New playlist"
              title="New playlist"
            >
              +
            </button>
          </div>
          <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto pr-1">
            <SidebarMenu>
              {loading ? (
                <li className="space-y-1" aria-label="Loading playlists">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="mt-1.5 h-3 w-1/2" />
                      </div>
                      <Skeleton className="ml-2 h-4 w-4 shrink-0" />
                    </div>
                  ))}
                </li>
              ) : (
                playlists.map((pl) => {
                  const owner = isPlaylistOwner(pl, account);
                  return (
                    <SidebarMenuItem key={pl.id}>
                      <div className="group/pl flex w-full items-center gap-1 rounded-lg transition hover:bg-zinc-800/60">
                        <button
                          onClick={() => {
                            onPlayPlaylist(pl);
                            closeOnMobile();
                          }}
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
                            onClick={() => {
                              onManagePlaylist(pl);
                              closeOnMobile();
                            }}
                            className="shrink-0 rounded-full p-1.5 text-zinc-500 opacity-0 transition hover:bg-zinc-700 hover:text-white group-hover/pl:opacity-100 [@media(hover:none)]:opacity-100"
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
                            onClick={() => {
                              onCopyPlaylist(pl);
                              closeOnMobile();
                            }}
                            className="shrink-0 rounded-full p-1.5 text-zinc-500 opacity-0 transition hover:bg-zinc-700 hover:text-white group-hover/pl:opacity-100 [@media(hover:none)]:opacity-100"
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
                    </SidebarMenuItem>
                  );
                })
              )}
              {!loading && playlists.length === 0 && (
                <li className="px-3 text-sm text-zinc-600">No playlists yet</li>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!loading && artistEntries.length > 0 && (
          <SidebarGroup className="min-h-0 flex-1 basis-0 flex-col p-0">
            <SidebarGroupLabel className="mb-3 h-auto shrink-0 px-0 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Songs by artist
            </SidebarGroupLabel>
            <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto pr-1">
              <SidebarMenu>
                {artistEntries.map((a) => {
                  const active = a.key === artistKey;
                  return (
                    <SidebarMenuItem key={a.key}>
                      <button
                        onClick={() => {
                          onSelectArtist(active ? null : a.key);
                          closeOnMobile();
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
                          active
                            ? "bg-rose-500/15 text-rose-200"
                            : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                            active
                              ? "bg-rose-500/30 text-rose-200"
                              : "bg-rose-500/15 text-rose-300"
                          }`}
                        >
                          {a.name.trim().charAt(0).toUpperCase() || "?"}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">{a.name}</span>
                        <span className="shrink-0 text-[11px] tabular-nums text-zinc-500">
                          {a.count}
                        </span>
                      </button>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="shrink-0 border-t border-zinc-800 p-4">
        {account ? (
          <div className="flex flex-col gap-2">
            <span className="truncate text-sm font-medium text-zinc-300">
              {account.display_name}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onAccount();
                  closeOnMobile();
                }}
                className="flex-1 rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                Account
              </button>
              <button
                onClick={() => {
                  onLogout();
                  closeOnMobile();
                }}
                className="flex-1 rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              onLogin();
              closeOnMobile();
            }}
            className="w-full rounded-full bg-rose-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-rose-400"
          >
            Login
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function HorizontalRail({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft < max - 1);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [sync]);

  // Cards can change (data loaded, images sized) without the rail resizing,
  // so re-check the arrow state after every render.
  useEffect(() => {
    sync();
  });

  // A vertical mouse wheel scrolls the rail horizontally. Once the rail is at
  // either end the event is left alone, so the page keeps scrolling instead
  // of trapping the user inside the rail. React's wheel handler is passive,
  // hence the native listener.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const el = scrollerRef.current;
    if (!wrapper || !el) return;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return; // pinch-zoom
      // Leave native horizontal gestures (trackpads, tilt wheels) alone.
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

      const delta = event.deltaY;
      if (delta === 0) return;

      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) return;

      const atStart = el.scrollLeft <= 1;
      const atEnd = el.scrollLeft >= max - 1;
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return;

      event.preventDefault();
      el.scrollLeft = Math.max(0, Math.min(max, el.scrollLeft + delta));
    };

    wrapper.addEventListener("wheel", onWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", onWheel);
  }, []);

  const nudge = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrowClasses = (visible: boolean, side: "left" | "right") =>
    [
      "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700",
      "bg-zinc-900/90 text-zinc-200 shadow-lg backdrop-blur transition hover:bg-zinc-800 hover:text-white",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
      side === "left" ? "left-1" : "right-1",
      visible
        ? "opacity-0 group-hover/rail:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        : "pointer-events-none opacity-0",
    ].join(" ");

  return (
    <div ref={wrapperRef} className="group/rail relative">
      <div
        ref={scrollerRef}
        onScroll={sync}
        aria-label={label}
        className={`overflow-x-auto ${className}`}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => nudge(-1)}
        disabled={!canLeft}
        aria-label="Scroll left"
        className={arrowClasses(canLeft, "left")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        disabled={!canRight}
        aria-label="Scroll right"
        className={arrowClasses(canRight, "right")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function GenreFilter({
  genres,
  genre,
  onChange,
}: {
  genres: string[];
  genre: string | null;
  onChange: (genre: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
          genre === null
            ? "bg-rose-500 text-white"
            : "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
        }`}
      >
        All
      </button>
      {genres.map((g) => (
        <button
          key={g}
          onClick={() => onChange(genre === g ? null : g)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
            genre === g
              ? "bg-rose-500 text-white"
              : "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
  padded = false,
}: {
  title: string;
  children: ReactNode;
  /** Extra horizontal gutter so tilted rail cards are not clipped. */
  padded?: boolean;
}) {
  return (
    <div className="mb-6">
      <h2
        className={`mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400 ${
          padded ? "px-4" : ""
        }`}
      >
        {title}
      </h2>
      <HorizontalRail
        className={`flex gap-4 pt-2 pb-3 ${padded ? "px-4" : ""}`}
      >
        {children}
      </HorizontalRail>
    </div>
  );
}

function RailCard({
  song,
  plays,
  onPlay,
  tilt = false,
}: {
  song: Song;
  plays?: number;
  onPlay: (songs: Song[]) => void;
  /** Enables the React Bits tilt + glare effect (Recently / Most listened). */
  tilt?: boolean;
}) {
  const content = (
    <>
      {song.artwork_path ? (
        <img
          src={getPublicUrl("artwork", song.artwork_path)}
          alt={`${song.title} artwork`}
          className="aspect-square w-full rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-zinc-800 text-2xl font-bold text-zinc-600">
          {song.title.trim().charAt(0).toUpperCase() || "♪"}
        </div>
      )}
      <div className="mt-2 truncate text-sm font-semibold text-zinc-100">
        {song.title}
      </div>
      <div className="truncate text-xs text-zinc-400">{artistCredit(song)}</div>
      {plays != null && plays > 0 && (
        <div className="truncate text-[11px] text-zinc-500">
          {plays} play{plays === 1 ? "" : "s"}
        </div>
      )}
    </>
  );

  if (!tilt) {
    return (
      <div
        onClick={() => onPlay([song])}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onPlay([song]);
        }}
        role="button"
        tabIndex={0}
        className="w-36 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-zinc-900 p-3 transition hover:bg-zinc-800 sm:w-44"
      >
        {content}
      </div>
    );
  }

  return (
    <div className="w-36 shrink-0 sm:w-44">
      <TiltedCard
        className="tilted-card--auto-height"
        containerWidth="100%"
        containerHeight="auto"
        imageWidth="100%"
        imageHeight="auto"
        rotateAmplitude={9}
        scaleOnHover={1.03}
        glare={0.45}
        shadow={0}
        radius={12}
        intro={false}
        gyroscope={false}
        showTooltip={false}
        altText={`${song.title} — ${artistCredit(song)}`}
        onClick={() => onPlay([song])}
      >
        <div className="w-full cursor-pointer rounded-xl bg-zinc-900 p-3 text-left">
          {content}
        </div>
      </TiltedCard>
    </div>
  );
}
