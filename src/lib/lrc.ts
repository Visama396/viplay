export interface LyricWord {
  time: number;
  text: string;
}

export interface LyricLine {
  time: number;
  /** Start time of the next line, or null for the last line. */
  endTime: number | null;
  text: string;
  /** Word-level timings. Always has >= 1 entry when text is non-empty. */
  words: LyricWord[];
}

export interface ParsedLyrics {
  lines: LyricLine[];
  metadata: Record<string, string>;
  /** True when at least one line carries per-word timings. */
  hasWordTiming: boolean;
}

const TIME_TAG = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
const TIME_TAG_TEST = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/;
const WORD_TAG = /<(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?>/g;
const META_TAG = /\[(ar|ti|al|by|re|ve|length|offset):(.*)\]/i;
const LEADING_TAGS = /^(?:\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\])+/;

function parseTimeTag(min: string, sec: string, frac?: string): number {
  const minutes = parseInt(min, 10);
  const seconds = parseInt(sec, 10);
  let fraction = 0;
  if (frac) {
    // LRC fractions can be 1, 2 or 3 digits (hundredths or thousandths).
    const f = frac.padEnd(3, "0");
    fraction = parseInt(f, 10) / 1000;
  }
  return minutes * 60 + seconds + fraction;
}

export function parseLrc(content: string): ParsedLyrics {
  const metadata: Record<string, string> = {};

  // First pass: metadata (incl. offset) so it applies regardless of position.
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const meta = line.match(META_TAG);
    if (meta) {
      const key = meta[1].toLowerCase();
      if (key === "offset") {
        const off = parseFloat(meta[2]);
        if (!Number.isNaN(off)) metadata.offset = String(off);
      } else {
        metadata[key] = meta[2].trim();
      }
    }
  }

  const offsetMs = metadata.offset ? parseFloat(metadata.offset) : 0;
  const offset = Number.isNaN(offsetMs) ? 0 : offsetMs / 1000;

  const lines: LyricLine[] = [];

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (META_TAG.test(line) && !TIME_TAG_TEST.test(line.replace(META_TAG, ""))) {
      // Pure metadata line (no lyric timestamps left after removing meta).
      // Heuristic: if it matched META_TAG and has no other time tag, skip.
      // Lines like "[ar:...]" never reach here as lyrics.
      continue;
    }

    // Collect leading [mm:ss.xx] tags as line start times.
    const leading = line.match(LEADING_TAGS);
    if (!leading) continue;
    const leadingTags = [...leading[0].matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    if (leadingTags.length === 0) continue;

    const lineTimes = leadingTags.map(
      (t) => parseTimeTag(t[1], t[2], t[3]) + offset,
    );
    const remainder = line.slice(leading[0].length).trim();
    if (!remainder) continue;

    // Parse inline <mm:ss.xx> word tags inside the remainder.
    const wordMatches = [...remainder.matchAll(WORD_TAG)];

    if (wordMatches.length === 0) {
      // Plain line-level LRC (backward compatible).
      const text = remainder.replace(TIME_TAG, "").trim();
      if (!text) continue;
      for (const lt of lineTimes) {
        lines.push({
          time: lt,
          endTime: null,
          text,
          words: [{ time: lt, text }],
        });
      }
      continue;
    }

    // Enhanced line: text before the first word tag belongs to the line time,
    // each <tag> starts a new word running until the next tag.
    const baseWords: { time: number; text: string }[] = [];
    const firstIdx = wordMatches[0].index ?? 0;
    const preText = remainder.slice(0, firstIdx).trim();
    // Placeholder time; fixed per lineTime below.
    if (preText) baseWords.push({ time: 0, text: preText, pre: true } as never);

    wordMatches.forEach((m, i) => {
      const wt = parseTimeTag(m[1], m[2], m[3]) + offset;
      const start = (m.index ?? 0) + m[0].length;
      const end =
        i + 1 < wordMatches.length
          ? (wordMatches[i + 1].index ?? remainder.length)
          : remainder.length;
      const wtext = remainder.slice(start, end).trim();
      if (!wtext) return;
      baseWords.push({ time: wt, text: wtext });
    });

    if (baseWords.length === 0) continue;
    const cleanText = baseWords.map((w) => w.text).join(" ").trim();
    if (!cleanText) continue;

    // Duplicate the word pattern across repeated line times (chorus repeats).
    const anchor = lineTimes[0];
    for (const lt of lineTimes) {
      const delta = lt - anchor;
      const words: LyricWord[] = baseWords.map((w, i) => ({
        // First chunk before any <tag> inherits the line start time.
        time: (w as { pre?: boolean }).pre ? lt : w.time + delta,
        text: w.text,
      }));
      words.sort((a, b) => a.time - b.time);
      const startTime = Math.min(lt, words[0]?.time ?? lt);
      lines.push({ time: startTime, endTime: null, text: cleanText, words });
    }
  }

  lines.sort((a, b) => a.time - b.time);
  for (let i = 0; i < lines.length; i++) {
    lines[i].endTime = i + 1 < lines.length ? lines[i + 1].time : null;
  }

  const hasWordTiming = lines.some((l) => l.words.length > 1);
  return { lines, metadata, hasWordTiming };
}

/**
 * Returns the current line index and progress (0..1) within that line for a
 * given playback time, used to drive the karaoke highlight.
 * Kept for backward compatibility; prefers word timings when present.
 */
export function getCurrentLine(
  lines: LyricLine[],
  time: number,
): { index: number; progress: number } | null {
  const active = getActiveLyrics(lines, time);
  if (!active) return null;
  return { index: active.lineIndex, progress: active.lineProgress };
}

export interface ActiveLyrics {
  lineIndex: number;
  wordIndex: number;
  /** 0..1 progress within the active word (1 when past it). */
  wordProgress: number;
  /** 0..1 progress within the active line. */
  lineProgress: number;
}

/**
 * Plain LRC has no end tag: a line implicitly ends at the next timestamp.
 * During instrumental gaps that span can be tens of seconds, so the wipe
 * is capped — a line counts as fully highlighted a few seconds after it
 * starts instead of crawling until the next line.
 */
const MAX_LINE_WIPE = 6;
const MAX_WORD_WIPE = 3;

/** Binary search: last index with time <= t, or 0 when t precedes all. */
function searchByTime(times: number[], t: number): number {
  let lo = 0;
  let hi = times.length - 1;
  if (times.length === 0) return 0;
  if (t < times[0]) return 0;
  let idx = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= t) {
      idx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return idx;
}

/**
 * Resolves the active line + word for a playback time. Works for both
 * plain line-level LRC and enhanced word-level LRC.
 */
export function getActiveLyrics(
  lines: LyricLine[],
  time: number,
): ActiveLyrics | null {
  if (lines.length === 0) return null;

  const lineIndex = searchByTime(
    lines.map((l) => l.time),
    time,
  );
  const line = lines[lineIndex];
  const next = lines[lineIndex + 1];

  // Line progress: word-aware when possible, else interpolate to next line.
  let lineProgress = 0;
  if (line.words.length > 1) {
    const sung =
      line.words.filter((w) => w.time <= time).length / line.words.length;
    lineProgress = Math.min(1, Math.max(0, sung));
    // Refine with intra-word progress for a smooth wipe.
    const wi = searchByTime(
      line.words.map((w) => w.time),
      time,
    );
    const cur = line.words[wi];
    const inLine = wi + 1 < line.words.length;
    const nxt = inLine ? line.words[wi + 1] : next ? { time: next.time } : null;
    if (cur && nxt && nxt.time > cur.time) {
      // Last word borrows the next line's start: cap it so gaps don't crawl.
      const span = inLine
        ? nxt.time - cur.time
        : Math.min(nxt.time - cur.time, MAX_WORD_WIPE);
      const frac = Math.min(1, Math.max(0, (time - cur.time) / span));
      lineProgress = Math.min(1, (wi + frac) / line.words.length);
    }
  } else if (next) {
    const span = Math.min(next.time - line.time, MAX_LINE_WIPE);
    if (span > 0) lineProgress = Math.min(1, Math.max(0, (time - line.time) / span));
    else lineProgress = time >= line.time ? 1 : 0;
  } else {
    lineProgress = time >= line.time ? 1 : 0;
  }

  let wordIndex = 0;
  let wordProgress = 1;
  if (line.words.length > 0) {
    wordIndex = searchByTime(
      line.words.map((w) => w.time),
      time,
    );
    const cur = line.words[wordIndex];
    const inLine = wordIndex + 1 < line.words.length;
    const nxt = inLine
      ? line.words[wordIndex + 1]
      : next
        ? { time: next.time }
        : null;
    if (!cur || cur.time > time) {
      wordProgress = 0;
    } else if (nxt && nxt.time > cur.time) {
      // Last word borrows the next line's start: cap it so gaps don't crawl.
      const span = inLine
        ? nxt.time - cur.time
        : Math.min(nxt.time - cur.time, MAX_WORD_WIPE);
      wordProgress = Math.min(1, Math.max(0, (time - cur.time) / span));
    } else {
      wordProgress = 1;
    }
  }

  return { lineIndex, wordIndex, wordProgress, lineProgress };
}
