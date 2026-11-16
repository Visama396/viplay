/**
 * Shared Web Audio context.
 *
 * The player routes the <audio> element through an AnalyserNode to drive the
 * vinyl pulse. Browsers start an AudioContext suspended until a user gesture,
 * and while suspended the routed audio is silent. App calls
 * `resumeAudioContext()` from a capture-phase pointerdown/keydown listener so
 * the context is already running by the time a song click starts playback.
 *
 * Web Audio is deliberately disabled on phones/tablets. Once a media element
 * is connected with `createMediaElementSource` its sound comes from the
 * AudioContext instead of the element, and mobile browsers (iOS Safari in
 * particular) suspend that context when the app is backgrounded or the screen
 * locks. That stops playback instead of handing it off to the OS. Keeping the
 * element unrouted lets the phone continue playing in the background. The
 * vinyl pulse is decorative, so keeping the music alive is the right trade-off.
 */
let ctx: AudioContext | null = null;

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type UAData = { mobile?: boolean };

/** True for phones and tablets, including devices using a desktop user agent. */
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  const uaData = (navigator as Navigator & { userAgentData?: UAData })
    .userAgentData;
  if (uaData?.mobile) return true;

  const ua = navigator.userAgent;
  if (/android|iphone|ipad|ipod|iemobile|opera mini|mobile/i.test(ua)) {
    return true;
  }
  // iPadOS 13+ (and some Android desktop-mode UAs) masquerade as desktop
  // browsers; no-hover touch input is the reliable giveaway.
  return (
    navigator.maxTouchPoints > 0 &&
    (window.matchMedia?.("(hover: none) and (pointer: coarse)").matches ??
      false)
  );
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  // Never create a context on mobile: see the note above about background
  // playback. Returning null makes the player skip the analyser graph.
  if (isMobileDevice()) return null;
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
  if (isMobileDevice()) return;
  const context = getAudioContext();
  if (context && context.state === "suspended") {
    context.resume().catch(() => {
      // Still suspended (no user gesture yet): a later gesture retries.
    });
  }
}
