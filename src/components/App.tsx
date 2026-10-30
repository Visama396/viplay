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
import { fetchCatalog, getRecentPlays, recordPlay, recordSongPlay } from "../lib/catalog";
import { addSongToPlaylist, copyPlaylist, isPlaylistOwner } from "../lib/playlists";
import type { Account } from "../lib/auth";
import { getCurrentAccount, logout } from "../lib/auth";
import type { Album, Artist, Playlist, PlaylistSong, PlaylistWithSongs, Song } from "../lib/types";

export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistWithSongs[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>(() => getRecentPlays().map((p) => p.id));
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

  // Track listening history (per-device) and the shared play count
  // (server-side) used by the "Most listened" section.
  useEffect(() => {
    const id = currentSong?.id;
    if (!id) return;
    setRecentIds(recordPlay(id).map((p) => p.id));
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
          supabase.from("songs").select("*").order("created_at"),
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
        const songById = new Map((songsRes.data ?? []).map((s) => [s.id, s]));

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
        setSongs(
          (songsRes.data ?? []).map((s: Song) => ({
            ...s,
            genres: catalog.songGenres.get(s.id) ?? [],
          })),
        );
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

  const handlePlay = useCallback((requested: Song[]) => {
    if (requested.length === 0) return;
    // A single song plays within the full song list as context; a playlist
    // becomes the queue itself.
    if (requested.length === 1) {
      const idx = songs.findIndex((s) => s.id === requested[0].id);
      setActivePlaylist(null);
      switchQueue(songs, idx < 0 ? 0 : idx);
    } else {
      switchQueue(requested, 0);
    }
  }, [songs, switchQueue]);

  const handlePlayPlaylist = useCallback(
    (pl: PlaylistWithSongs) => {
      setActivePlaylist(pl);
      handlePlay(pl.songs);
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
              onClose={closeEdit}
              onSaved={afterEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
