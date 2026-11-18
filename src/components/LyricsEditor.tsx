import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { useI18n } from "../lib/i18n";

interface LyricsEditorProps {
  /** LRC text loaded by the player (empty when the song has no lyrics). */
  initialContent: string;
  /** Live clock, read straight from the audio element. */
  getTime: () => number;
  playing: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSave: (text: string) => Promise<{ error?: string }>;
  onClose: () => void;
}

/** Leading [mm:ss.xx] / [mm:ss] tag of a line. */
const LINE_STAMP = /^\s*\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/;

export default function LyricsEditor({
  initialContent,
  getTime,
  playing,
  onTogglePlay,
  onSeek,
  onSave,
  onClose,
}: LyricsEditorProps) {
  const { t, errorText } = useI18n();
  const [text, setText] = useState(initialContent);
  const [savedText, setSavedText] = useState(initialContent);
  const [caret, setCaret] = useState(0);
  const [liveTime, setLiveTime] = useState(getTime);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);

  const dirty = text !== savedText;

  // rAF clock straight from the audio element. The player's `currentTime`
  // state only updates on timeupdate (~4x/sec), which made the badge lag
  // behind what "Stamp line" actually wrote. Reading the element at 60fps
  // keeps the displayed time and the stamped time identical.
  useEffect(() => {
    let raf = 0;
    let last = Number.NaN;
    const tick = () => {
      const t = getTime();
      if (t !== last) {
        last = t;
        setLiveTime(t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getTime]);

  // Restore the caret after a programmatic stamp replaces text.
  useEffect(() => {
    const pos = pendingCaret.current;
    if (pos == null) return;
    pendingCaret.current = null;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(pos, pos);
    setCaret(pos);
  }, [text]);

  const line = useMemo(() => {
    const start = caret === 0 ? 0 : text.lastIndexOf("\n", caret - 1) + 1;
    const newline = text.indexOf("\n", caret);
    const end = newline === -1 ? text.length : newline;
    return {
      number: text.slice(0, start).split("\n").length,
      text: text.slice(start, end),
    };
  }, [text, caret]);

  /** Replaces (or inserts) the leading timestamp of the caret line. */
  const stampLine = () => {
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? caret;
    const start = pos === 0 ? 0 : text.lastIndexOf("\n", pos - 1) + 1;
    const newline = text.indexOf("\n", pos);
    const end = newline === -1 ? text.length : newline;
    const current = text.slice(start, end);
    const stamp = `[${lrcTime(getTime())}]`;
    const nextLine = LINE_STAMP.test(current)
      ? current.replace(LINE_STAMP, stamp)
      : stamp + current;
    const next = text.slice(0, start) + nextLine + text.slice(end);
    const nextCaret = start + nextLine.length;
    pendingCaret.current = nextCaret;
    setCaret(nextCaret);
    setText(next);
  };

  /** Inserts a word-level <mm:ss.xx> tag at the caret (karaoke timing). */
  const insertWordTag = () => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? caret;
    const end = el?.selectionEnd ?? start;
    const tag = `<${lrcTime(getTime())}>`;
    const next = text.slice(0, start) + tag + text.slice(end);
    const nextCaret = start + tag.length;
    pendingCaret.current = nextCaret;
    setCaret(nextCaret);
    setText(next);
  };

  // Keep the window-level shortcuts pointed at the latest closures without
  // re-subscribing on every keystroke/clock tick.
  const stampRef = useRef(stampLine);
  const wordTagRef = useRef(insertWordTag);
  useEffect(() => {
    stampRef.current = stampLine;
    wordTagRef.current = insertWordTag;
  });

  // Alt+T / Alt+W work even when focus sits on the play/seek buttons (not
  // only inside the textarea). `e.repeat` matters: holding the keys used to
  // fire several keydowns, each one overwriting the timestamp with a later
  // time than the one the user aimed at.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.altKey && e.code === "KeyT") {
        e.preventDefault();
        stampRef.current();
        return;
      }
      if (e.altKey && e.code === "KeyW") {
        e.preventDefault();
        wordTagRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const jumpToLine = () => {
    const match = line.text.match(LINE_STAMP);
    if (!match) return;
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const fraction = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) / 1000 : 0;
    onSeek(minutes * 60 + seconds + fraction);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    const result = await onSave(text);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSavedText(text);
    onClose();
  };

  const close = () => {
    if (dirty && !window.confirm(t("lyricsEditor.discard"))) return;
    onClose();
  };

  const nudge = (delta: number) => {
    onSeek(Math.max(0, getTime() + delta));
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      void save();
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-800 pb-2">
        <span className="text-sm font-semibold text-white">{t("lyricsEditor.title")}</span>
        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs tabular-nums text-zinc-300">
          {clock(liveTime)}
        </span>
        <div className="flex items-center gap-1">
          <ToolButton onClick={() => nudge(-3)} label={t("lyricsEditor.back3")}>
            −3s
          </ToolButton>
          <ToolButton
            onClick={onTogglePlay}
            label={playing ? t("common.pause") : t("common.play")}
          >
            {playing ? t("common.pause") : t("common.play")}
          </ToolButton>
          <ToolButton onClick={() => nudge(3)} label={t("lyricsEditor.forward3")}>
            +3s
          </ToolButton>
        </div>
        <button
          type="button"
          onClick={stampLine}
          title={t("lyricsEditor.stampLineTitle")}
          className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-400"
        >
          {t("lyricsEditor.stampLine")} <span className="font-normal opacity-75">Alt+T</span>
        </button>
        <button
          type="button"
          onClick={insertWordTag}
          title={t("lyricsEditor.insertWordTagTitle")}
          className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          {t("lyricsEditor.insertWordTag")} <span className="font-normal opacity-60">Alt+W</span>
        </button>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-zinc-500">
          <span>{t("lyricsEditor.line", { number: line.number })}</span>
          <span className={LINE_STAMP.test(line.text) ? "text-emerald-400" : ""}>
            {LINE_STAMP.test(line.text)
              ? t("lyricsEditor.timed")
              : t("lyricsEditor.noTimestamp")}
          </span>
          {LINE_STAMP.test(line.text) && (
            <button
              type="button"
              onClick={jumpToLine}
              className="rounded-full bg-zinc-900 px-2 py-0.5 font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              {t("lyricsEditor.jumpToLine")}
            </button>
          )}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setCaret(e.target.selectionStart);
        }}
        onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
        onClick={(e) => setCaret(e.currentTarget.selectionStart)}
        onKeyUp={(e) => setCaret(e.currentTarget.selectionStart)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        aria-label={t("lyricsEditor.aria")}
        placeholder={t("lyricsEditor.placeholder")}
        className="mt-2 min-h-0 w-full flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-rose-500"
      />

      <div className="flex shrink-0 flex-wrap items-center gap-2 pt-2">
        <p className="text-[11px] text-zinc-500">{t("lyricsEditor.help")}</p>
        {error && <p className="ml-auto text-xs text-red-400">{errorText(error)}</p>}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-full px-3 py-1 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !dirty}
            className="rounded-full bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-400 disabled:opacity-50"
          >
            {saving ? t("common.saving") : t("lyricsEditor.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
    >
      {children}
    </button>
  );
}

/** [mm:ss.xx] timestamp for the LRC text. */
function lrcTime(seconds: number): string {
  const totalCs = Math.max(0, Math.floor(seconds * 100));
  const minutes = Math.floor(totalCs / 6000);
  const cs = totalCs % 6000;
  return `${String(minutes).padStart(2, "0")}:${(cs / 100).toFixed(2).padStart(5, "0")}`;
}

/** m:ss.xx clock for the toolbar. */
function clock(seconds: number): string {
  const totalCs = Math.max(0, Math.floor(seconds * 100));
  const minutes = Math.floor(totalCs / 6000);
  const cs = totalCs % 6000;
  return `${minutes}:${(cs / 100).toFixed(2).padStart(5, "0")}`;
}
