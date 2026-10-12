import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { getActiveLyrics, parseLrc } from "../lib/lrc";

interface LyricsViewerProps {
  content: string | null;
  /** Coarse time from the player (seek bar). Used as fallback. */
  currentTime: number;
  /** When provided, the viewer reads time via rAF at 60fps for smooth karaoke. */
  audioRef?: RefObject<HTMLAudioElement | null>;
  /** Seek handler (click a line to jump). */
  onSeek?: (time: number) => void;
}

export default function LyricsViewer({
  content,
  currentTime,
  audioRef,
  onSeek,
}: LyricsViewerProps) {
  const parsed = useMemo(() => {
    if (!content) return null;
    try {
      const p = parseLrc(content);
      return p.lines.length > 0 ? p : null;
    } catch {
      return null;
    }
  }, [content]);

  // Smooth clock: rAF reading the audio element directly. Falls back to the
  // coarse currentTime prop when no ref is available (or element unmounted).
  const [smoothTime, setSmoothTime] = useState(currentTime);
  useEffect(() => {
    setSmoothTime(currentTime);
  }, [content]);

  useEffect(() => {
    const el = audioRef?.current;
    if (!el) {
      setSmoothTime(currentTime);
      return;
    }
    let raf = 0;
    let last = -1;
    const tick = () => {
      const t = el.currentTime ?? currentTime;
      // Skip re-renders when paused (time unchanged) and throttle tiny jitter.
      if (t !== last && Math.abs(t - last) > 0.015) {
        last = t;
        setSmoothTime(t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioRef, content]);

  // Keep coarse prop in sync for seeks while paused (rAF still covers the
  // playing case, this covers unmounted/short-circuit cases).
  useEffect(() => {
    if (!audioRef?.current) setSmoothTime(currentTime);
  }, [currentTime, audioRef]);

  const active = useMemo(
    () => (parsed ? getActiveLyrics(parsed.lines, smoothTime) : null),
    [parsed, smoothTime],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef(new Map<number, HTMLDivElement>());

  useEffect(() => {
    if (active == null) return;
    lineRefs.current.get(active.lineIndex)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [active?.lineIndex]);

  if (!content) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        No lyrics available
      </div>
    );
  }

  if (!parsed || parsed.lines.length === 0) {
    return <div className="whitespace-pre-wrap text-zinc-300">{content}</div>;
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center px-6">
      <div
        ref={containerRef}
        className="flex min-h-0 w-full flex-1 flex-col justify-center gap-2 overflow-y-auto py-4 text-center"
      >
        {parsed.lines.map((line, i) => {
          const isActive = active?.lineIndex === i;
          const isPast = line.time <= smoothTime && !isActive;
          return (
            <div
              key={`${line.time}-${i}`}
              ref={(el) => {
                if (el) lineRefs.current.set(i, el);
                else lineRefs.current.delete(i);
              }}
              onClick={onSeek ? () => onSeek(line.time + 0.01) : undefined}
              className={`leading-snug transition-all duration-300 ${
                isActive ? "scale-[1.02]" : ""
              } ${!isActive && !isPast ? "opacity-40" : ""} ${
                onSeek ? "cursor-pointer rounded-lg hover:bg-zinc-800/40" : ""
              }`}
            >
              {line.words.length > 1 ? (
                <p
                  className={
                    isActive
                      ? "text-2xl font-semibold sm:text-3xl"
                      : isPast
                        ? "text-xl text-zinc-300"
                        : "text-xl text-zinc-600"
                  }
                >
                  {line.words.map((w, j) => {
                    const sung = w.time <= smoothTime;
                    const isActiveWord = isActive && active?.wordIndex === j;
                    if (!isActive) {
                      return (
                        <span
                          key={j}
                          className={isPast ? "text-zinc-300" : "text-zinc-600"}
                        >
                          {w.text}
                          {j < line.words.length - 1 ? " " : ""}
                        </span>
                      );
                    }
                    if (sung && !isActiveWord) {
                      return (
                        <span key={j} className="text-rose-500">
                          {w.text}
                          {j < line.words.length - 1 ? " " : ""}
                        </span>
                      );
                    }
                    if (isActiveWord) {
                      const progress = active?.wordProgress ?? 0;
                      return (
                        <span key={j} className="relative inline-block">
                          <span className="text-zinc-600">
                            {w.text}
                            {j < line.words.length - 1 ? "\u00A0" : ""}
                          </span>
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 overflow-hidden bg-gradient-to-r from-rose-500 to-pink-400 bg-clip-text text-transparent"
                            style={{ width: `${progress * 100}%` }}
                          >
                            {w.text}
                            {j < line.words.length - 1 ? "\u00A0" : ""}
                          </span>
                        </span>
                      );
                    }
                    return (
                      <span key={j} className="text-zinc-600">
                        {w.text}
                        {j < line.words.length - 1 ? " " : ""}
                      </span>
                    );
                  })}
                </p>
              ) : (
                <div className="relative">
                  <span
                    className={
                      isActive
                        ? "text-2xl font-semibold text-zinc-600 sm:text-3xl"
                        : isPast
                          ? "text-xl text-zinc-300"
                          : "text-xl text-zinc-600"
                    }
                  >
                    {line.text}
                  </span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-400 bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl"
                      style={{
                        backgroundSize: `${(active?.lineProgress ?? 0) * 100}% 100%`,
                        backgroundRepeat: "no-repeat",
                      }}
                    >
                      {line.text}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 pb-2 text-xs tabular-nums text-zinc-500">
        <span>{secondsToTime(smoothTime)}</span>
        {parsed.hasWordTiming ? (
          <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-400">
            Karaoke
          </span>
        ) : (
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
            Synced
          </span>
        )}
      </div>
    </div>
  );
}

function secondsToTime(t: number): string {
  if (Number.isNaN(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
