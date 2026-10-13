import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { getActiveLyrics, parseLrc } from "../lib/lrc";

interface LyricsViewerProps {
  content: string | null;
  /** Optional second LRC track (e.g. romanized lyrics). Shown via toggle. */
  secondaryContent?: string | null;
  /** Label for the secondary track toggle, e.g. "Romanized". */
  secondaryLabel?: string | null;
  /** Coarse time from the player (seek bar). Used as fallback. */
  currentTime: number;
  /** When provided, the viewer reads time via rAF at 60fps for smooth karaoke. */
  audioRef?: RefObject<HTMLAudioElement | null>;
  /** Seek handler (click a line to jump). */
  onSeek?: (time: number) => void;
}

export default function LyricsViewer({
  content,
  secondaryContent,
  secondaryLabel,
  currentTime,
  audioRef,
  onSeek,
}: LyricsViewerProps) {
  const hasSecondary = Boolean(secondaryContent?.trim());
  const [mode, setMode] = useState<"primary" | "secondary">("primary");
  // Reset to the original track when the song (or either track) changes.
  useEffect(() => {
    setMode("primary");
  }, [content, secondaryContent]);

  const activeContent =
    mode === "secondary" && hasSecondary ? secondaryContent ?? null : content;
  const label = secondaryLabel?.trim() || "Romanized";

  const parsed = useMemo(() => {
    if (!activeContent) return null;
    try {
      const p = parseLrc(activeContent);
      return p.lines.length > 0 ? p : null;
    } catch {
      return null;
    }
  }, [activeContent]);

  // Smooth clock: rAF reading the audio element directly. Falls back to the
  // coarse currentTime prop when no ref is available (or element unmounted).
  const [smoothTime, setSmoothTime] = useState(currentTime);
  useEffect(() => {
    setSmoothTime(currentTime);
  }, [activeContent]);

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
  }, [audioRef, activeContent]);

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
  const innerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef(new Map<number, HTMLDivElement>());
  const [followActive, setFollowActive] = useState(true);
  const lastAutoScrollAt = useRef(0);

  // Cushion so the first/last line can also reach the vertical center.
  // When the lyrics overflow the pane, pad top/bottom by ~half the pane
  // height; short lyrics stay centered via min-h-full + justify-center.
  const [edgePad, setEdgePad] = useState(0);
  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;
    const update = () => {
      const overflow = inner.scrollHeight > container.clientHeight + 1;
      setEdgePad(overflow ? Math.max(0, container.clientHeight / 2 - 24) : 0);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [activeContent]);

  // Reset follow mode and scroll position when the song/lyrics change.
  useEffect(() => {
    setFollowActive(true);
    containerRef.current?.scrollTo({ top: 0 });
  }, [activeContent]);

  useEffect(() => {
    if (active == null || !followActive) return;
    const container = containerRef.current;
    const el = lineRefs.current.get(active.lineIndex);
    if (!container || !el) return;
    lastAutoScrollAt.current = Date.now();
    // Center the highlighted line in the pane. scrollIntoView can scroll
    // outer ancestors instead and is imprecise here, so compute it manually.
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const top =
      container.scrollTop +
      (eRect.top - cRect.top) -
      container.clientHeight / 2 +
      eRect.height / 2;
    container.scrollTo({ top, behavior: "smooth" });
  }, [active?.lineIndex, followActive]);

  const handleManualScroll = () => {
    // Ignore scroll events caused by our own auto-scroll so follow mode
    // isn't disabled by the smooth scrollIntoView above.
    if (Date.now() - lastAutoScrollAt.current < 800) return;
    setFollowActive(false);
  };

  if (!activeContent) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        No lyrics available
      </div>
    );
  }

  if (!parsed || parsed.lines.length === 0) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col px-6">
        {hasSecondary && (
          <LyricsToggle
            mode={mode}
            onChange={setMode}
            secondaryLabel={label}
          />
        )}
        <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain py-4">
          <div className="whitespace-pre-wrap break-words text-zinc-300">
            {activeContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center px-4">
      {hasSecondary && (
        <LyricsToggle mode={mode} onChange={setMode} secondaryLabel={label} />
      )}
      <div
        ref={containerRef}
        onScroll={handleManualScroll}
        className="min-h-0 w-full min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain"
      >
        <div
          ref={innerRef}
          style={{ paddingTop: 16 + edgePad, paddingBottom: 32 + edgePad }}
          className="m-auto flex min-h-full w-full min-w-0 max-w-full flex-col justify-center gap-2 text-center"
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
              className={`min-w-0 max-w-full break-words px-1 leading-snug transition-colors duration-300 ${
                !isActive && !isPast ? "opacity-40" : ""
              } ${
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
      </div>
      <div className="flex shrink-0 items-center gap-2 pb-2 text-xs tabular-nums text-zinc-500">
        {!followActive && (
          <button
            onClick={() => setFollowActive(true)}
            className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
          >
            Follow lyrics
          </button>
        )}
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

function LyricsToggle({
  mode,
  onChange,
  secondaryLabel,
}: {
  mode: "primary" | "secondary";
  onChange: (m: "primary" | "secondary") => void;
  secondaryLabel: string;
}) {
  const btn = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition ${
      active ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"
    }`;
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-zinc-900 p-1">
      <button
        type="button"
        onClick={() => onChange("primary")}
        className={btn(mode === "primary")}
        aria-pressed={mode === "primary"}
      >
        Original
      </button>
      <button
        type="button"
        onClick={() => onChange("secondary")}
        className={btn(mode === "secondary")}
        aria-pressed={mode === "secondary"}
      >
        {secondaryLabel}
      </button>
    </div>
  );
}
