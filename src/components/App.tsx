import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Home from "./Home";
import Player from "./Player";
import LibrarySidebar from "./LibrarySidebar";
import { SidebarProvider } from "./ui/sidebar";
import AuthScreen from "./AuthScreen";
import UploadDialog from "./UploadDialog";
import PlaylistDialog from "./PlaylistDialog";
import AccountDialog from "./AccountDialog";
import EditSongDialog from "./EditSongDialog";
import { supabase } from "../lib/supabase";
import { resumeAudioContext } from "../lib/audio";
import { deleteSong } from "../lib/upload";
import {
  artistDisplayName,
  artistNameMap,
  buildArtistEntries,
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
import { shuffleAvoidingFirst, shuffleItems } from "../lib/shuffle";
import type { Account } from "../lib/auth";
import { getCurrentAccount, logout } from "../lib/auth";
import {
  DEFAULT_LANGUAGE,
  readStoredLanguage,
  storeLanguage,
  type Language,
} from "../lib/language";
import { I18nProvider, translate, translateError } from "../lib/i18n";
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
  /** Shuffle is a per-playlist mode; it resets when a non-playlist queue starts. */
  const [shuffle, setShuffle] = useState(false);
  /** Sidebar filters are owned here so they survive view switches. */
  const [genre, setGenre] = useState<string | null>(null);
  const [artistKey, setArtistKey] = useState<string | null>(null);
  /** UI language: Spanish by default, replaced by the browser's last choice
   * and then by the account preference. Starting from the default on both the
   * server and the first client render avoids hydration mismatches; the stored
   * choice is applied in an effect below. */
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

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

  // Apply this browser's last language choice after mount (reading it during
  // render would differ between SSR and hydration). A signed-in account's
  // preference, loaded below, takes precedence.
  useEffect(() => {
    setLanguage(readStoredLanguage());
  }, []);

  // Restore any existing Supabase Auth session on load.
  useEffect(() => {
    getCurrentAccount()
      .then((acc) => {
        setAccount(acc);
        if (acc) setLanguage(acc.language);
      })
      .catch(() => setAccount(null));
  }, []);

  // The chosen language is also mirrored to the html element and localStorage:
  // guests keep it on this browser, accounts sync it through their profile.
  useEffect(() => {
    document.documentElement.lang = language;
    storeLanguage(language);
  }, [language]);

  // Unlock the shared AudioContext during a user gesture. Capture phase runs
  // before the song/card click handlers, so the context is running before the
  // player mounts and routes the <audio> element through the analyser.
  useEffect(() => {
    const unlock = () => resumeAudioContext();
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
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
    setLanguage(acc.language);
    setAuthOpen(false);
  }, []);

  const handleAccountUpdated = useCallback((acc: Account) => {
    setAccount(acc);
    setLanguage(acc.language);
  }, []);

  const handleLogout = useCallback(() => {
    logout().catch(() => {});
    setAccount(null);
    setQueue([]);
    setCurrentIndex(-1);
    setActivePlaylist(null);
    setShuffle(false);
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

  const handleDelete = useCallback(
    async (songId: string) => {
      const res = await deleteSong(songId);
      if (res.success) setRefreshKey((k) => k + 1);
      else if (res.error) alert(translateError(language, res.error));
    },
    [language],
  );

  const openEdit = useCallback((song: Song) => setEditSong(song), []);
  const closeEdit = useCallback(() => setEditSong(null), []);
  const afterEdit = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Lyrics saved from the player's inline editor get a new storage path.
  // Patch every list that may still hold the old Song object so playback and
  // the next page load don't keep pointing at the deleted lyrics file.
  const handleLyricsSaved = useCallback((songId: string, lyricsPath: string | null) => {
    const patch = (s: Song) =>
      s.id === songId ? { ...s, lyrics_path: lyricsPath } : s;
    setSongs((prev) => prev.map(patch));
    setQueue((prev) => prev.map(patch));
    setPlaylists((prev) =>
      prev.map((pl) => ({ ...pl, songs: pl.songs.map(patch) })),
    );
    setActivePlaylist((prev) =>
      prev ? { ...prev, songs: prev.songs.map(patch) } : prev,
    );
  }, []);

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
        alert(
          translateError(
            language,
            res.error ?? translate(language, "errors.copyPlaylist"),
          ),
        );
        return;
      }
      setRefreshKey((k) => k + 1);
      setPlaylistDialog({ kind: "manage", id: res.id });
    },
    [account, language],
  );

  const handleQuickAdd = useCallback(
    async (songId: string, pl: PlaylistWithSongs) => {
      if (!account) {
        setAuthOpen(true);
        return;
      }
      const res = await addSongToPlaylist(pl, songId, account);
      if (res.error) alert(translateError(language, res.error));
      else setRefreshKey((k) => k + 1);
    },
    [account, language],
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

  // Sidebar data/state is shared by the browse and song views.
  const artistEntries = useMemo(
    () => buildArtistEntries(songs, artists),
    [songs, artists],
  );

  // Filters only make sense while browsing, so picking one leaves the player.
  const handleGenreChange = useCallback((next: string | null) => {
    setGenre(next);
    setView("browse");
  }, []);
  const handleSelectArtist = useCallback((key: string | null) => {
    setArtistKey(key);
    setView("browse");
  }, []);

  // A playlist is the only multi-song queue. Any individual song click plays
  // just that song. `playlist` is passed when starting from a playlist view,
  // so playback stays within that playlist instead of the whole library.
  const handlePlay = useCallback(
    (requested: Song[], playlist?: PlaylistWithSongs | null) => {
      if (requested.length === 0) return;
      if (playlist) {
        setActivePlaylist(playlist);
        const idx = playlist.songs.findIndex((s) => s.id === requested[0].id);
        const start = idx < 0 ? 0 : idx;
        if (shuffle) {
          // Keep the picked song playing and randomize the rest.
          const first = playlist.songs[start];
          const rest = playlist.songs.filter((s) => s.id !== first.id);
          switchQueue([first, ...shuffleItems(rest)], 0);
        } else {
          switchQueue(playlist.songs, start);
        }
        return;
      }
      // Shuffle only applies to playlist playback.
      setActivePlaylist(null);
      setShuffle(false);
      switchQueue(requested, 0);
    },
    [switchQueue, shuffle],
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

  const handleRestart = useCallback(() => {
    if (shuffle && activePlaylist && activePlaylist.songs.length > 0) {
      // Starting a new pass: refresh the shuffle, but never put the song that
      // just finished (last of the previous pass) first again.
      const lastId = queue[queue.length - 1]?.id;
      const next = shuffleAvoidingFirst(
        activePlaylist.songs,
        (s) => s.id === lastId,
      );
      setQueue(next);
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex(0);
  }, [shuffle, activePlaylist, queue]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => (i <= 0 ? 0 : i - 1));
  }, []);

  const handleToggleShuffle = useCallback(() => {
    if (!activePlaylist || queue.length === 0) return;
    const current = queue[currentIndex];

    if (shuffle) {
      // Back to the playlist's own order, keeping the current song playing.
      const index = current
        ? activePlaylist.songs.findIndex((s) => s.id === current.id)
        : -1;
      setQueue(activePlaylist.songs);
      setCurrentIndex(index < 0 ? 0 : index);
      setShuffle(false);
      return;
    }

    // Keep the current song at the front, then randomize what comes next.
    const rest = activePlaylist.songs.filter((s) => s.id !== current?.id);
    const next = current ? [current, ...shuffleItems(rest)] : shuffleItems(rest);
    if (next.length === 0) return;
    setQueue(next);
    setCurrentIndex(0);
    setShuffle(true);
  }, [activePlaylist, queue, currentIndex, shuffle]);

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
    <I18nProvider language={language}>
      <div className="flex h-screen supports-[height:100dvh]:h-[100dvh] flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <SidebarProvider
        className="relative flex min-h-0 w-full flex-1"
        style={{ "--sidebar-width": "18rem" } as CSSProperties}
      >
        <LibrarySidebar
          allGenres={allGenres}
          genre={genre}
          onGenreChange={handleGenreChange}
          playlists={playlists}
          loading={loading}
          account={account}
          onLogin={openLogin}
          onLogout={handleLogout}
          onAccount={openAccount}
          onCreatePlaylist={openCreatePlaylist}
          onPlayPlaylist={handlePlayPlaylist}
          onManagePlaylist={openManagePlaylist}
          onCopyPlaylist={handleCopyPlaylist}
          artistEntries={artistEntries}
          artistKey={artistKey}
          onSelectArtist={handleSelectArtist}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!playerOpen && (
            <Home
              songs={songs}
              playlists={playlists}
              recentIds={recentIds}
              loading={loading}
              currentId={currentSong?.id ?? null}
              onPlay={handlePlay}
              account={account}
              onUpload={openUpload}
              onEdit={openEdit}
              onDelete={handleDelete}
              onCreatePlaylist={openCreatePlaylist}
              onQuickAdd={handleQuickAdd}
              genre={genre}
              onGenreChange={handleGenreChange}
              artistEntries={artistEntries}
              artistKey={artistKey}
              onSelectArtist={handleSelectArtist}
            />
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
              shuffle={shuffle}
              onToggleShuffle={handleToggleShuffle}
              onLyricsSaved={handleLyricsSaved}
            />
          )}
        </div>
      </SidebarProvider>
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
              songs={songs}
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
                handlePlay(songs, pl ?? null);
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
              songs={songs}
              covers={coverOptions}
              onClose={closeEdit}
              onSaved={afterEdit}
            />
          </div>
        </div>
      )}
      </div>
    </I18nProvider>
  );
}
