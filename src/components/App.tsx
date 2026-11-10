import { useCallback, useEffect, useState } from "react";
import Home from "./Home";
import Player from "./Player";
import AuthScreen from "./AuthScreen";
import UploadDialog from "./UploadDialog";
import PlaylistDialog from "./PlaylistDialog";
import AccountDialog from "./AccountDialog";
import EditSongDialog from "./EditSongDialog";
import { supabase } from "../lib/supabase";
import { deleteSong } from "../lib/upload";
import {
  artistDisplayName,
  artistNameMap,
  clearLocalRecentPlays,
  fetchCatalog,
  fetchRecentPlays,
  getLocalRecentPlays,
  mergeLocalRecentPlays,
  recordLocalPlay,
  recordRemotePlay,
  recordSongPlay,
  RECENT_LIMIT,
} from "../lib/catalog";
import { addSongToPlaylist, copyPlaylist, isPlaylistOwner } from "../lib/playlists";
import type { Account } from "../lib/auth";
import { getCurrentAccount, logout } from "../lib/auth";
import type {
  Album,
  Artist,
  ArtworkOption,
  Playlist,
  PlaylistSong,
  PlaylistWithSongs,
  Song,
} from "../lib/types";

export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistWithSongs[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    getLocalRecentPlays().map((p) => p.id),
  );
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [account, setAccount] = useState<Account | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [editSong, setEditSong] = useState<Song | null>(null);
  const [playlistDialog, setPlaylistDialog] = useState<
    { kind: "create" } | { kind: "manage"; id: string } | null
  >(null);
  const [view, setView] = useState<"browse" | "player">("browse");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activePlaylist, setActivePlaylist] = useState<PlaylistWithSongs | null>(null);
  const [playlistViewOpen, setPlaylistViewOpen] = useState(false);

  const currentSong = queue[currentIndex];

  // Track listening history (server-side per account, localStorage for guests)
  // and the shared play count used by the "Most listened" section.
  useEffect(() => {
    const id = currentSong?.id;
    if (!id) return;
    if (account) {
      setRecentIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, RECENT_LIMIT));
      recordRemotePlay(account.id, id);
    } else {
      setRecentIds(recordLocalPlay(id).map((p) => p.id));
    }
    recordSongPlay(id).then((count) => {
      if (count == null) return;
      setSongs((prev) =>
        prev.map((s) => (s.id === id ? { ...s, play_count: count } : s)),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id]);

  // Restore any existing Supabase Auth session on load.
  useEffect(() => {
    getCurrentAccount()
      .then((acc) => setAccount(acc))
      .catch(() => setAccount(null));
  }, []);

  // When signed in, load the account's history (merging this device's guest
  // plays first). When signed out, fall back to the per-device guest list.
  useEffect(() => {
    if (!account) {
      setRecentIds(getLocalRecentPlays().map((p) => p.id));
      return;
    }

    let cancelled = false;
    const guestIds = new Set(getLocalRecentPlays().map((p) => p.id));
    (async () => {
      const merged = await mergeLocalRecentPlays(account.id);
      if (cancelled) return;
      // Guest plays now belong to the account; don't let a different account
      // on this shared device claim them later.
      if (merged) clearLocalRecentPlays();
      const plays = await fetchRecentPlays();
      // null means the 0015 migration isn't applied or the request failed;
      // keep showing the local list instead of wiping the rail.
      if (cancelled || !plays) return;
      setRecentIds((prev) => {
        const fetched = plays.map((p) => p.id);
        // Keep plays recorded while the request was in flight, but let the
        // server decide which old guest plays made the cut.
        const pending = prev.filter((id) => !fetched.includes(id) && !guestIds.has(id));
        return [...pending, ...fetched].slice(0, RECENT_LIMIT);
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id]);

  const handleAuth = useCallback((acc: Account) => {
    setAccount(acc);
    setAuthOpen(false);
  }, []);

  const handleAccountUpdated = useCallback((acc: Account) => {
    setAccount(acc);
  }, []);

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    setAccount(null);
    setQueue([]);
    setCurrentIndex(-1);
    setView("browse");
  }, []);

  const openLogin = useCallback(() => setAuthOpen(true), []);
  const closeLogin = useCallback(() => setAuthOpen(false), []);
  const openUpload = useCallback(() => setUploadOpen(true), []);
  const closeUpload = useCallback(() => setUploadOpen(false), []);
  const openAccount = useCallback(() => setAccountOpen(true), []);
  const closeAccount = useCallback(() => setAccountOpen(false), []);

  const afterUpload = useCallback(() => {
    setView("browse");
    setRefreshKey((k) => k + 1);
  }, []);

  const handleDelete = useCallback(async (songId: string) => {
    const res = await deleteSong(songId);
    if (res.success) setRefreshKey((k) => k + 1);
    else if (res.error) alert(res.error);
  }, []);

  const openEdit = useCallback((song: Song) => setEditSong(song), []);
  const closeEdit = useCallback(() => setEditSong(null), []);
  const afterEdit = useCallback(() => setRefreshKey((k) => k + 1), []);

  const openCreatePlaylist = useCallback(() => {
    if (!account) {
      setAuthOpen(true);
      return;
    }
    setPlaylistDialog({ kind: "create" });
  }, [account]);

  const openManagePlaylist = useCallback(
    (pl: PlaylistWithSongs) => {
      if (!isPlaylistOwner(pl, account)) return;
      setPlaylistDialog({ kind: "manage", id: pl.id });
    },
    [account],
  );

  const closePlaylistDialog = useCallback(() => setPlaylistDialog(null), []);

  const handlePlaylistChanged = useCallback((manageId?: string) => {
    setRefreshKey((k) => k + 1);
    if (manageId) setPlaylistDialog({ kind: "manage", id: manageId });
  }, []);

  const handleCopyPlaylist = useCallback(
    async (pl: PlaylistWithSongs) => {
      if (!account) {
        setAuthOpen(true);
        return;
      }
      const res = await copyPlaylist(pl, account);
      if (res.error || !res.id) {
        alert(res.error ?? "Could not copy playlist");
        return;
      }
      setRefreshKey((k) => k + 1);
      setPlaylistDialog({ kind: "manage", id: res.id });
    },
    [account],
  );

  const handleQuickAdd = useCallback(
    async (songId: string, pl: PlaylistWithSongs) => {
      if (!account) {
        setAuthOpen(true);
        return;
      }
      const res = await addSongToPlaylist(pl, songId, account);
      if (res.error) alert(res.error);
      else setRefreshKey((k) => k + 1);
    },
    [account],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [songsRes, playlistsRes, catalog] = await Promise.all([
          supabase.from("songs").select("*").order("created_at", { ascending: false }),
          supabase.from("playlists").select("*").order("created_at"),
          fetchCatalog(),
        ]);

        if (cancelled) return;
        if (songsRes.error) throw songsRes.error;
        if (playlistsRes.error) throw playlistsRes.error;

        const playlistSongsRes = await supabase
          .from("playlist_songs")
          .select("*")
          .order("position");
        if (cancelled) return;
        if (playlistSongsRes.error) throw playlistSongsRes.error;

        const ps: PlaylistSong[] = playlistSongsRes.data ?? [];

        // The catalog is the source of truth for artist names: resolve each
        // song's display name from artists.name, falling back to the free-text
        // songs.artist column for rows without a catalog link.
        const artistNames = artistNameMap(catalog.artists);
        const resolvedSongs: Song[] = (songsRes.data ?? []).map((s: Song) => ({
          ...s,
          artist: artistDisplayName(s, artistNames),
          genres: catalog.songGenres.get(s.id) ?? [],
          featured_artists: catalog.songFeaturedArtists.get(s.id) ?? [],
          featured_artist_ids: catalog.songFeaturedArtistIds.get(s.id) ?? [],
        }));
        const songById = new Map(resolvedSongs.map((s) => [s.id, s]));

        const enriched: PlaylistWithSongs[] = (playlistsRes.data ?? []).map(
          (pl: Playlist) => ({
            ...pl,
            songs: ps
              .filter((p) => p.playlist_id === pl.id)
              .map((p) => songById.get(p.song_id))
              .filter((s): s is Song => Boolean(s)),
          }),
        );

        setPlaylists(enriched);
        setArtists(catalog.artists);
        setAlbums(catalog.albums);
        setAllGenres(catalog.genres.map((g) => g.name));
        if (cancelled) return;
        setSongs(resolvedSongs);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const switchQueue = useCallback((next: Song[], startIndex = 0) => {
    if (next.length === 0) return;
    setQueue(next);
    setCurrentIndex(startIndex);
    setView("player");
  }, []);

  const goToBrowse = useCallback(() => setView("browse"), []);
  const goToPlayer = useCallback(() => setView("player"), []);

  // A playlist is the only multi-song queue. Any individual song click plays
  // just that song. `playlist` is passed when starting from a playlist view,
  // so playback stays within that playlist instead of the whole library.
  const handlePlay = useCallback(
    (requested: Song[], playlist?: PlaylistWithSongs | null) => {
      if (requested.length === 0) return;
      if (playlist) {
        setActivePlaylist(playlist);
        const idx = playlist.songs.findIndex((s) => s.id === requested[0].id);
        switchQueue(playlist.songs, idx < 0 ? 0 : idx);
        return;
      }
      if (requested.length === 1) setActivePlaylist(null);
      switchQueue(requested, 0);
    },
    [switchQueue],
  );

  const handlePlayPlaylist = useCallback(
    (pl: PlaylistWithSongs) => {
      handlePlay(pl.songs, pl);
    },
    [handlePlay],
  );

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => (i >= queue.length - 1 ? queue.length - 1 : i + 1));
  }, [queue.length]);

  const handleRestart = useCallback(() => setCurrentIndex(0), []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => (i <= 0 ? 0 : i - 1));
  }, []);

  const handleEnded = useCallback(() => {
    if (currentIndex >= queue.length - 1) return;
    setCurrentIndex((i) => i + 1);
  }, [currentIndex, queue.length]);

  const playerOpen = view === "player" && queue.length > 0 && currentIndex >= 0;

  // Deduped covers available for reuse (several songs often share one album
  // cover). Sorted so covers from the same album sit together.
  const coverOptions: ArtworkOption[] = (() => {
    const seen = new Set<string>();
    const options: ArtworkOption[] = [];
    for (const s of songs) {
      if (!s.artwork_path || seen.has(s.artwork_path)) continue;
      seen.add(s.artwork_path);
      options.push({
        path: s.artwork_path,
        title: s.title,
        artist: s.artist,
        album: s.album,
      });
    }
    return options.sort(
      (a, b) =>
        (a.album ?? "").localeCompare(b.album ?? "") ||
        a.artist.localeCompare(b.artist) ||
        a.title.localeCompare(b.title),
    );
  })();

  return (
    <div className="flex h-screen supports-[height:100dvh]:h-[100dvh] flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {!playerOpen && (
        <div className="flex flex-1 overflow-hidden">
          <Home
            songs={songs}
            playlists={playlists}
            artists={artists}
            allGenres={allGenres}
            recentIds={recentIds}
            loading={loading}
            currentId={currentSong?.id ?? null}
            onPlay={handlePlay}
            account={account}
            onLogin={openLogin}
            onLogout={handleLogout}
            onUpload={openUpload}
            onAccount={openAccount}
            onEdit={openEdit}
            onDelete={handleDelete}
            onCreatePlaylist={openCreatePlaylist}
            onManagePlaylist={openManagePlaylist}
            onCopyPlaylist={handleCopyPlaylist}
            onQuickAdd={handleQuickAdd}
            onPlayPlaylist={handlePlayPlaylist}
          />
        </div>
      )}
      {queue.length > 0 && currentIndex >= 0 && (
        <Player
          queue={queue}
          currentIndex={currentIndex}
          onEnded={handleEnded}
          onPrev={handlePrev}
          onNext={handleNext}
          onBack={goToBrowse}
          onExpand={goToPlayer}
          compact={!playerOpen}
          account={account}
          onEdit={openEdit}
          onDelete={handleDelete}
          playlist={activePlaylist}
          playlistOpen={playlistViewOpen}
          onPlaylistOpenChange={setPlaylistViewOpen}
          onPlay={handlePlay}
          onRestart={handleRestart}
        />
      )}
      {authOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeLogin}
        >
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <AuthScreen onAuth={handleAuth} />
          </div>
        </div>
      )}
      {uploadOpen && account && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
          onClick={closeUpload}
        >
          <div className="my-auto w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <UploadDialog
              account={account}
              artists={artists}
              albums={albums}
              allGenres={allGenres}
              covers={coverOptions}
              onClose={closeUpload}
              onUploaded={afterUpload}
            />
          </div>
        </div>
      )}
      {accountOpen && account && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
          onClick={closeAccount}
        >
          <div className="my-auto w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <AccountDialog
              account={account}
              onClose={closeAccount}
              onAccountUpdated={handleAccountUpdated}
            />
          </div>
        </div>
      )}
      {playlistDialog && account && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
          onClick={closePlaylistDialog}
        >
          <div className="my-auto w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <PlaylistDialog
              creating={playlistDialog.kind === "create"}
              playlist={
                playlistDialog.kind === "manage"
                  ? (playlists.find((p) => p.id === playlistDialog.id) ?? null)
                  : null
              }
              songs={songs}
              account={account}
              onClose={closePlaylistDialog}
              onChanged={handlePlaylistChanged}
              onPlay={(songs) => {
                const manageId = playlistDialog.kind === "manage" ? playlistDialog.id : null;
                const pl = manageId ? playlists.find((p) => p.id === manageId) : undefined;
                setActivePlaylist(pl ?? null);
                handlePlay(songs);
              }}
            />
          </div>
        </div>
      )}
      {editSong && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
          onClick={closeEdit}
        >
          <div className="my-auto w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <EditSongDialog
              song={editSong}
              artists={artists}
              albums={albums}
              allGenres={allGenres}
              covers={coverOptions}
              onClose={closeEdit}
              onSaved={afterEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
