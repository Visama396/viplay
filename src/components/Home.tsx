import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { getPublicUrl } from "../lib/supabase";
import { artistCredit, songArtistKeys, type ArtistEntry } from "../lib/catalog";
import type { Account } from "../lib/auth";
import type { PlaylistWithSongs, Song } from "../lib/types";
import { isPlaylistOwner } from "../lib/playlists";
import { Skeleton } from "./ui/skeleton";
import TiltedCard from "./TiltedCard.jsx";
import { SidebarTrigger } from "./ui/sidebar";
import { useI18n } from "../lib/i18n";

/** Placeholder cards/rows shown in each section while the library loads. */
const SKELETON_COUNT = 5;

export interface HomeProps {
  songs: Song[];
  playlists: PlaylistWithSongs[];
  recentIds: string[];
  loading?: boolean;
  currentId: string | null;
  onPlay: (songs: Song[]) => void;
  account: Account | null;
  onUpload: () => void;
  onEdit: (song: Song) => void;
  onDelete: (songId: string) => void;
  onCreatePlaylist: () => void;
  onQuickAdd: (songId: string, playlist: PlaylistWithSongs) => void;
  /** Genre filter, owned by App so it survives switching to the song view. */
  genre: string | null;
  onGenreChange: (genre: string | null) => void;
  artistEntries: ArtistEntry[];
  artistKey: string | null;
  onSelectArtist: (key: string | null) => void;
}

export default function Home({
  songs,
  playlists,
  recentIds = [],
  loading = false,
  currentId,
  onPlay,
  account,
  onUpload,
  onEdit,
  onDelete,
  onCreatePlaylist,
  onQuickAdd,
  genre,
  onGenreChange,
  artistEntries,
  artistKey,
  onSelectArtist,
}: HomeProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [addMenuSongId, setAddMenuSongId] = useState<string | null>(null);

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
    <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3 p-4 sm:flex-nowrap sm:gap-4 sm:p-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SidebarTrigger className="shrink-0 text-zinc-400 hover:bg-zinc-800 hover:text-white" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white">ViPlay</h1>
            <p className="text-sm text-zinc-400">{t("home.subtitle")}</p>
          </div>
        </div>
        {account && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              onClick={onUpload}
              className="shrink-0 rounded-full bg-rose-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-rose-400"
            >
              {t("home.upload")}
            </button>
          </div>
        )}
      </div>

      <div className="px-6 pb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("home.searchPlaceholder")}
          className="w-full rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-rose-500 sm:max-w-md"
        />
      </div>

      {activeArtist && (
        <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
          <span className="flex items-center gap-1.5 rounded-full bg-rose-500/15 py-1 pl-3 pr-1.5 text-xs font-medium text-rose-300">
            {activeArtist.name}
            <button
              onClick={() => onSelectArtist(null)}
              className="rounded-full p-0.5 text-rose-300/70 transition hover:text-white"
              aria-label={t("home.clearArtistFilter")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </span>
          <span className="text-[11px] text-zinc-500">
            {t("home.songCount", { count: filtered.length })}
          </span>
        </div>
      )}

      <div className="px-6 pb-6">
        {loading && isBrowsing && (
          <>
            <Section title={t("home.recentlyListened")} padded>
              <RailSkeletons />
            </Section>
            <Section title={t("home.mostListened")} padded>
              <RailSkeletons />
            </Section>
          </>
        )}
        {!loading && isBrowsing && recentSongs.length > 0 && (
          <Section title={t("home.recentlyListened")} padded>
            {recentSongs.map((song) => (
              <RailCard key={song.id} song={song} onPlay={onPlay} tilt />
            ))}
          </Section>
        )}
        {isBrowsing && !loading && mostListened.length > 0 && (
          <Section title={t("home.mostListened")} padded>
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
          <Section title={t("home.lastAdded")}>
            {lastAdded.map((song) => (
              <RailCard key={song.id} song={song} onPlay={onPlay} />
            ))}
          </Section>
        )}
        {isBrowsing && (
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            {t("home.allSongs")}
          </h2>
        )}
        <div className="flex max-h-[35rem] flex-col overflow-y-auto pr-1">
          {loading
            ? <SongRowSkeletons />
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
                    alt={t("common.artworkAlt", { title: song.title })}
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
                      aria-label={t("player.deleteSongTitle")}
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
                      aria-label={t("player.editSongTitle")}
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
                    aria-label={t("common.play")}
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
                      aria-label={t("home.addSongToPlaylist", { title: song.title })}
                      title={t("home.addToPlaylist")}
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
                          {t("home.addToPlaylist")}
                        </div>
                        <div className="max-h-48 overflow-y-auto py-1">
                          {myPlaylists.length === 0 && (
                            <p className="px-3 py-2 text-xs text-zinc-500">
                              {t("home.noPlaylistsYet")}
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
                          {t("home.newPlaylist")}
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
              {t("home.noSongsFound")}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}


/** Five placeholder cards for the recently/most listened rails. */
function RailSkeletons({ count = SKELETON_COUNT }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="w-36 shrink-0 rounded-xl bg-zinc-900 p-3 sm:w-44"
        >
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-1.5 h-3 w-1/2" />
        </div>
      ))}
    </>
  );
}

/** Five placeholder rows for the all-songs list. */
function SongRowSkeletons({ count = SKELETON_COUNT }: { count?: number }) {
  const { t } = useI18n();
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg px-2 py-2"
          aria-label={t("home.loadingSong")}
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
      ))}
    </>
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
  const { t } = useI18n();
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
        aria-label={t("common.scrollLeft")}
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
        aria-label={t("common.scrollRight")}
        className={arrowClasses(canRight, "right")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
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
  const { t } = useI18n();
  const content = (
    <>
      {song.artwork_path ? (
        <img
          src={getPublicUrl("artwork", song.artwork_path)}
          alt={t("common.artworkAlt", { title: song.title })}
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
          {t("home.plays", { count: plays })}
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
