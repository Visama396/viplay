import { useCallback, useEffect, useRef, useState } from "react";
import { getPublicUrl, supabase } from "../lib/supabase";
import type { Song } from "../lib/types";
import LyricsViewer from "./LyricsViewer";

interface PlayerProps {
  queue: Song[];
  currentIndex: number;
  onEnded: () => void;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  onExpand: () => void;
  compact: boolean;
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
}: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [secondaryLyrics, setSecondaryLyrics] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [loop, setLoop] = useState(false);

  const song: Song | undefined = queue[currentIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.loop = loop;
  }, [loop]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

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
  useEffect(() => {
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

  if (!song) return null;

  const playIcon = playing ? (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
    </svg>
  ) : (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );

  const loopIcon = (
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
    <div className={compact ? "flex w-full flex-col" : "flex h-full min-h-0 flex-1 flex-col"}>
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={onEnded}
      />

      {compact ? (
        <div className="flex items-center gap-3 border-t border-zinc-800 bg-zinc-900 px-4 py-3">
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
            <div className="truncate text-xs text-zinc-400">{song.artist}</div>
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
          <button
            onClick={() => setLoop((l) => !l)}
            className={`shrink-0 transition ${
              loop ? "text-rose-500" : "text-zinc-300 hover:text-white"
            }`}
            aria-label={loop ? "Loop on" : "Loop off"}
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
      ) : (
        <>
          <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-6 py-3">
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
            <div className="min-w-0 flex-1 truncate text-center text-sm text-zinc-400">
              Now playing
            </div>
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
            <div className="hidden w-64 shrink-0 flex-col items-center justify-center gap-3 md:flex">
              {song.artwork_path && (
                <img
                  src={getPublicUrl("artwork", song.artwork_path)}
                  alt={`${song.title} artwork`}
                  className="aspect-square w-full rounded-xl object-cover shadow-lg"
                />
              )}
              <div className="text-center">
                <div className="truncate text-lg font-semibold text-white">{song.title}</div>
                <div className="truncate text-sm text-zinc-400">{song.artist}</div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-zinc-800 px-6 py-4">
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
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setLoop((l) => !l)}
                  className={`transition ${
                    loop ? "text-rose-500" : "text-zinc-300 hover:text-white"
                  }`}
                  aria-label={loop ? "Loop on" : "Loop off"}
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
                <div className="ml-2 flex w-40 items-center gap-2">
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
