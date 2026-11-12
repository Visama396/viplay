/**
 * Shared Web Audio context.
 *
 * The player routes the <audio> element through an AnalyserNode to drive the
 * vinyl pulse. Browsers start an AudioContext suspended until a user gesture,
 * and while suspended the routed audio is silent. App calls
 * `resumeAudioContext()` from a capture-phase pointerdown/keydown listener so
 * the context is already running by the time a song click starts playback.
 */
let ctx: AudioContext | null = null;

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

export function resumeAudioContext() {
  const context = getAudioContext();
  if (context && context.state === "suspended") {
    context.resume().catch(() => {
      // Still suspended (no user gesture yet): a later gesture retries.
    });
  }
}
