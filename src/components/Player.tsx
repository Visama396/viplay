import { useCallback, useEffect, useRef, useState } from "react";
import { getPublicUrl, supabase } from "../lib/supabase";
import { getAudioContext } from "../lib/audio";
import { artistCredit } from "../lib/catalog";
import type { Account } from "../lib/auth";
import type { PlaylistWithSongs, Song } from "../lib/types";
import LyricsViewer from "./LyricsViewer";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import PlaylistViewDialog from "./PlaylistViewDialog";

const VOLUME_STORAGE_KEY = "viplay.volume";
const DEFAULT_VOLUME = 0.5;

/**
 * A media element can only ever be attached to one MediaElementAudioSourceNode.
 * Keeping the graph per element makes the analyser effect safe to re-run.
 */
type VinylGraph = { ctx: AudioContext; analyser: AnalyserNode };
const vinylGraphs = new WeakMap<HTMLAudioElement, VinylGraph>();

/** Reads the persisted volume, falling back to 50% on first visit. */
function readSavedVolume(): number {
  if (typeof window === "undefined") return DEFAULT_VOLUME;
  try {
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw == null) return DEFAULT_VOLUME;
    const saved = Number(raw);
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

interface PlayerProps {
  queue: Song[];
  currentIndex: number;
  onEnded: () => void;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  onExpand: () => void;
  compact: boolean;
  account: Account | null;
  onEdit: (song: Song) => void;
  onDelete: (songId: string) => void;
  /** The playlist whose songs are in the queue, if any. */
  playlist: PlaylistWithSongs | null;
  /** Whether the playlist popover is open. */
  playlistOpen: boolean;
  /** Called when the playlist popover open state changes. */
  onPlaylistOpenChange: (open: boolean) => void;
  /** Play from the playlist popover, keeping the playlist as the queue. */
  onPlay: (songs: Song[], playlist?: PlaylistWithSongs | null) => void;
  /** Restarts the queue from the beginning (playlist loop). */
  onRestart: () => void;
}

export default function Player({
  queue,
  currentIndex,
  onEnded,
  onPrev,
  onNext,
  onBack,
  onExpand,
  compact,
  account,
  onEdit,
  onDelete,
  playlist,
  playlistOpen,
  onPlaylistOpenChange,
  onPlay,
  onRestart,
}: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  /** Scales the vinyl. Driven imperatively at 60fps to avoid re-renders. */
  const pulseRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [secondaryLyrics, setSecondaryLyrics] = useState<string | null>(null);
  const [volume, setVolume] = useState(readSavedVolume);
  const [loop, setLoop] = useState<0 | 1 | 2>(0); // 0 = off, 1 = song, 2 = playlist

  const song: Song | undefined = queue[currentIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.loop = loop === 1;
  }, [loop]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
    try {
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
    } catch {
      // Storage unavailable (private mode, quota): volume still works per session.
    }
  }, [volume]);

  // Route the audio element through an AnalyserNode once, then scale the vinyl
  // with the live bass energy so it pulses with the music. The element has
  // crossOrigin="anonymous" (required for the analyser to see samples); the
  // storage bucket replies with CORS `*`.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    let graph = vinylGraphs.get(audio);
    if (!graph) {
      try {
        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.5;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        graph = { ctx, analyser };
        vinylGraphs.set(audio, graph);
      } catch {
        // Unsupported browser or tainted media: keep playing without a pulse.
        return;
      }
    }

    const { analyser } = graph;
    const bins = new Uint8Array(analyser.frequencyBinCount);
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    // Autoplay policies suspend the context until a gesture; resume on the
    // next interaction so routed audio is never silent.
    const resume = () => {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    };
    audio.addEventListener("play", resume);
    window.addEventListener("pointerdown", resume, true);

    // 20–200 Hz covers the kick/bass that drives the visible pulse.
    const binHz = ctx.sampleRate / 2 / analyser.frequencyBinCount;
    const lo = Math.max(1, Math.floor(20 / binHz));
    const hi = Math.min(analyser.frequencyBinCount - 1, Math.ceil(200 / binHz));

    let raf = 0;
    let last = performance.now();
    let pulse = 1;
    let bassAvg = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const el = pulseRef.current;
      if (!el) return;
      const dt = Math.min(0.12, Math.max(0.001, (now - last) / 1000));
      last = now;

      if (reduceMotion || audio.paused || audio.readyState < 2) {
        // Ease back to rest when paused or buffering.
        pulse += (1 - pulse) * (1 - Math.exp(-dt * 10));
        el.style.transform = `scale(${pulse.toFixed(4)})`;
        return;
      }

      analyser.getByteFrequencyData(bins);
      let sum = 0;
      for (let i = lo; i <= hi; i++) sum += bins[i];
      const bass = sum / ((hi - lo + 1) * 255);

      // Slow loudness baseline; energy above it is a beat/transient.
      bassAvg += (bass - bassAvg) * (1 - Math.exp(-dt * 2.5));
      const emphasis =
        Math.max(0, bass - bassAvg) / Math.max(0.08, 1 - bassAvg);

      const target = 1 + Math.min(0.1, emphasis * 0.14);
      // Punch fast on a beat, settle gently between beats.
      const k = 1 - Math.exp(-dt * (target > pulse ? 26 : 6));
      pulse += (target - pulse) * k;
      el.style.transform = `scale(${pulse.toFixed(4)})`;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      audio.removeEventListener("play", resume);
      window.removeEventListener("pointerdown", resume, true);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !song) return;

    audio.src = getPublicUrl("audio", song.audio_path);
    setCurrentTime(0);
    setLyrics(null);
    setSecondaryLyrics(null);

    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, [song?.id]);

  // React only to explicit play/pause state changes (user toggles). It must NOT
  // depend on song.id, otherwise a track change races this effect with the
  // auto-play above and causes rapid pause/resume stuttering.
  //
  // The initial run is skipped: the song effect above already starts playback
  // for the first track, and pausing here with the initial `playing = false`
  // would abort that pending play() so the first song never started.
  const playingEffectMounted = useRef(false);
  useEffect(() => {
    if (!playingEffectMounted.current) {
      playingEffectMounted.current = true;
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.play().catch(() => {});
    else audio.pause();
  }, [playing]);

  const loadLyrics = useCallback(async () => {
    if (!song?.lyrics_path && !song?.secondary_lyrics_path) {
      setLyrics(null);
      setSecondaryLyrics(null);
      return;
    }
    const [primary, secondary] = await Promise.all([
      song?.lyrics_path
        ? supabase.storage.from("lyrics").download(song.lyrics_path)
        : null,
      song?.secondary_lyrics_path
        ? supabase.storage.from("lyrics").download(song.secondary_lyrics_path)
        : null,
    ]);
    if (primary && !primary.error && primary.data) {
      setLyrics(await primary.data.text());
    } else {
      setLyrics(null);
    }
    if (secondary && !secondary.error && secondary.data) {
      setSecondaryLyrics(await secondary.data.text());
    } else {
      setSecondaryLyrics(null);
    }
  }, [song?.lyrics_path, song?.secondary_lyrics_path]);

  useEffect(() => {
    loadLyrics();
  }, [loadLyrics]);

  const seek = (t: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const format = (t: number) => {
    if (Number.isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const toggle = () => setPlaying((p) => !p);

  const cycleLoop = () => setLoop((l) => (l === 0 ? 1 : l === 1 ? 2 : 0));
  const loopLabel = loop === 0 ? "Loop off" : loop === 1 ? "Loop song" : "Loop playlist";

  const handleEnded = () => {
    if (loop === 2 && currentIndex >= queue.length - 1) {
      // Looping the playlist: restart from the first song.
      onRestart();
      return;
    }
    onEnded();
  };

  const progress =
    duration > 0 && Number.isFinite(duration)
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  const seekFromBar = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !(duration > 0)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const t = ratio * duration;
    el.currentTime = t;
    setCurrentTime(t);
  };

  // Expose the current track to the OS (iPhone lock screen / notification
  // panel). Without this, iOS falls back to the page title ("Viplay") and
  // the favicon. Guarded: desktop browsers without Media Session ignore it.
  useEffect(() => {
    if (!("mediaSession" in navigator) || !song) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: artistCredit(song),
        album: song.album ?? undefined,
        artwork: song.artwork_path
          ? [
              {
                src: getPublicUrl("artwork", song.artwork_path),
                sizes: "512x512",
              },
            ]
          : [],
      });
    } catch {
      // Older browsers: ignore.
    }
  }, [
    song?.id,
    song?.title,
    song?.artist,
    song?.featured_artists,
    song?.album,
    song?.artwork_path,
  ]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    } catch {
      // Ignore.
    }
  }, [playing]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const skip = (delta: number) => {
      const a = audioRef.current;
      if (!a || Number.isNaN(a.currentTime)) return;
      const dur = Number.isNaN(a.duration) ? Infinity : a.duration;
      a.currentTime = Math.min(Math.max(0, a.currentTime + delta), dur);
      setCurrentTime(a.currentTime);
    };
    try {
      ms.setActionHandler("play", () => setPlaying(true));
      ms.setActionHandler("pause", () => setPlaying(false));
      ms.setActionHandler("previoustrack", () => onPrev());
      ms.setActionHandler("nexttrack", () => onNext());
      ms.setActionHandler("seekbackward", (d) => skip(-(d.seekOffset ?? 10)));
      ms.setActionHandler("seekforward", (d) => skip(d.seekOffset ?? 10));
      ms.setActionHandler("seekto", (d) => {
        const a = audioRef.current;
        if (a && typeof d.seekTime === "number") {
          a.currentTime = d.seekTime;
          setCurrentTime(d.seekTime);
        }
      });
    } catch {
      // setActionHandler throws for unsupported actions: ignore.
    }
    return () => {
      try {
        ms.setActionHandler("play", null);
        ms.setActionHandler("pause", null);
        ms.setActionHandler("previoustrack", null);
        ms.setActionHandler("nexttrack", null);
        ms.setActionHandler("seekbackward", null);
        ms.setActionHandler("seekforward", null);
        ms.setActionHandler("seekto", null);
      } catch {
        // Ignore.
      }
    };
  }, [onPrev, onNext]);

  // Keep the lock-screen progress bar in sync where supported.
  useEffect(() => {
    if (!("mediaSession" in navigator) || !("setPositionState" in navigator.mediaSession)) return;
    if (!Number.isFinite(duration) || duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(Math.max(0, currentTime), duration),
      });
    } catch {
      // Ignore (e.g. position out of range during track switch).
    }
  }, [currentTime, duration, song?.id]);

  if (!song) return null;

  // Same permissions as the browse song cards: owners can edit, admins can
  // edit and delete. Rendered as always-visible buttons (not hover-only) so
  // touch users can reach them.
  const isAdmin = account?.username === "visama396";
  const isOwner = account != null && song.uploaded_by === account.id;
  const canEdit = Boolean(isAdmin || isOwner);

  const playIcon = playing ? (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
    </svg>
  ) : (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );

  const loopIcon =
    loop === 2 ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M17.5 7.5l5 4.5-5 4.5" />
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h3h9v-6h-2v4z" />
      </svg>
    );

  const volumeIcon =
    volume === 0 ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.6 3l2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4L14.2 12l-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4L16.6 12z" />
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z" />
      </svg>
    );

  return (
    <div className={compact ? "flex w-full flex-col" : "flex min-h-0 flex-1 flex-col"}>
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
      />

      {compact ? (
        <div className="w-full">
          <div
            className="relative h-1 w-full cursor-pointer bg-zinc-800"
            onClick={seekFromBar}
            role="progressbar"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration || 0)}
            aria-valuenow={Math.round(currentTime)}
          >
            <div
              className="absolute inset-y-0 left-0 bg-rose-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-3 bg-zinc-900 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          {song.artwork_path && (
            <button
              onClick={onExpand}
              className="shrink-0"
              aria-label="Expand player"
            >
              <img
                src={getPublicUrl("artwork", song.artwork_path)}
                alt={`${song.title} artwork`}
                className="h-12 w-12 rounded-lg object-cover"
              />
            </button>
          )}
          <button
            onClick={onExpand}
            className="min-w-0 flex-1 text-left"
            aria-label="Expand player"
          >
            <div className="truncate text-sm font-semibold text-white">
              {song.title}
            </div>
            <div className="truncate text-xs text-zinc-400">{artistCredit(song)}</div>
            <div className="truncate text-[11px] tabular-nums text-zinc-500">
              {format(currentTime)} / {format(duration)}
            </div>
          </button>
          <button
            onClick={onPrev}
            className="shrink-0 text-zinc-300 transition hover:text-white"
            aria-label="Previous"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button
            onClick={toggle}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white transition hover:bg-rose-400"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playIcon}
          </button>
          <button
            onClick={onNext}
            className="shrink-0 text-zinc-300 transition hover:text-white"
            aria-label="Next"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
            </svg>
          </button>
          {playlist && (
            <Popover open={playlistOpen} onOpenChange={onPlaylistOpenChange}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 text-zinc-300 transition hover:text-white"
                  aria-label={`View playlist ${playlist.name}`}
                  title="View playlist songs"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h12v2H3v-2z" />
                  </svg>
                </button>
              </PopoverTrigger>
              <PopoverContent side="top">
                <PlaylistViewDialog
                  playlist={playlist}
                  onPlay={onPlay}
                  onOpenChange={onPlaylistOpenChange}
                  currentSongId={song?.id ?? null}
                  isPlaying={playing}
                />
              </PopoverContent>
            </Popover>
          )}
          <button
            onClick={cycleLoop}
            className={`shrink-0 transition ${
              loop !== 0 ? "text-rose-500" : "text-zinc-300 hover:text-white"
            }`}
            aria-label={loopLabel}
          >
            {loopIcon}
          </button>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <span className={volume === 0 ? "text-zinc-500" : "text-zinc-300"}>{volumeIcon}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 accent-rose-500"
              aria-label="Volume"
            />
          </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-4 py-3 sm:px-6">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              aria-label="Back to browse"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Browse
            </button>
            {playlist && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{playlist.name}</div>
                {playlist.description && (
                  <div className="truncate text-xs text-zinc-400">{playlist.description}</div>
                )}
              </div>
            )}
            {canEdit && (
              <button
                onClick={() => onEdit(song)}
                className="ml-auto flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                aria-label={`Edit ${song.title}`}
                title="Edit song"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Edit
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onDelete(song.id)}
                className={`flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-red-500 hover:bg-red-600 hover:text-white ${canEdit ? "" : "ml-auto"}`}
                aria-label={`Delete ${song.title}`}
                title="Delete song"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2m1 0v14a2 2 0 01-2 2H9a2 2 0 01-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Delete
              </button>
            )}
          </div>

          <div className="flex min-h-0 flex-1 items-stretch justify-center gap-8 overflow-hidden px-4">
            <div className="flex min-h-0 w-full min-w-0 max-w-4xl flex-1">
              <LyricsViewer
                content={lyrics}
                secondaryContent={secondaryLyrics}
                secondaryLabel={song.secondary_lyrics_label}
                currentTime={currentTime}
                audioRef={audioRef}
                onSeek={seek}
              />
            </div>
            <div className="hidden w-64 shrink-0 flex-col items-center justify-center gap-4 md:flex">
              {song.artwork_path && (
                <div className="relative aspect-square w-[92%]">
                  {/* Scales with the music (beat-driven, imperatively via rAF). */}
                  <div ref={pulseRef} className="absolute inset-0 will-change-transform">
                    {/* The disc and its center label spin together like a record.
                        `key={song.id}` resets the rotation for each new track. */}
                    <div
                      key={song.id}
                      data-playing={playing}
                      className="viplay-vinyl-spin absolute inset-0 rounded-full shadow-2xl"
                      style={{
                        background:
                          "repeating-radial-gradient(circle at 50% 50%, #18181b 0px, #09090b 2px, #18181b 3px, #09090b 5px)",
                      }}
                    >
                      {/* Light sheen across the vinyl surface. */}
                      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.16),transparent_45%)]" />
                      <img
                        src={getPublicUrl("artwork", song.artwork_path)}
                        alt={`${song.title} artwork`}
                        className="absolute left-1/2 top-1/2 aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover ring-2 ring-black/60"
                      />
                      {/* Spindle hole at the very center. */}
                      <span className="absolute left-1/2 top-1/2 h-[6%] w-[6%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-950 ring-1 ring-white/20" />
                    </div>
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="truncate text-lg font-semibold text-white">{song.title}</div>
                <div className="truncate text-sm text-zinc-400">{artistCredit(song)}</div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-zinc-800 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
            <div className="mx-auto flex max-w-2xl flex-col gap-2">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full accent-rose-500"
                aria-label="Seek"
              />
              <div className="flex items-center justify-between text-xs tabular-nums text-zinc-400">
                <span>{format(currentTime)}</span>
                <span>{format(duration)}</span>
              </div>
              <div className="flex items-center justify-center gap-5 sm:gap-6">
                {playlist && (
                  <Popover open={playlistOpen} onOpenChange={onPlaylistOpenChange}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-zinc-300 transition hover:text-white"
                        aria-label={`View playlist ${playlist.name}`}
                        title="View playlist songs"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h12v2H3v-2z" />
                        </svg>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent>
                      {playlist && (
                        <PlaylistViewDialog
                          playlist={playlist}
                          onPlay={onPlay}
                          onOpenChange={onPlaylistOpenChange}
                          currentSongId={song?.id ?? null}
                          isPlaying={playing}
                        />
                      )}
                    </PopoverContent>
                  </Popover>
                )}
                <button
                  onClick={cycleLoop}
                  className={`transition ${
                    loop !== 0 ? "text-rose-500" : "text-zinc-300 hover:text-white"
                  }`}
                  aria-label={loopLabel}
                >
                  {loopIcon}
                </button>
                <button
                  onClick={onPrev}
                  className="text-zinc-300 transition hover:text-white"
                  aria-label="Previous"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>
                <button
                  onClick={toggle}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white transition hover:bg-rose-400"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playIcon}
                </button>
                <button
                  onClick={onNext}
                  className="text-zinc-300 transition hover:text-white"
                  aria-label="Next"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
                  </svg>
                </button>
                <div className="ml-2 hidden w-40 items-center gap-2 sm:flex">
                  <span className={volume === 0 ? "text-zinc-500" : "text-zinc-300"}>
                    {volumeIcon}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1 accent-rose-500"
                    aria-label="Volume"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
