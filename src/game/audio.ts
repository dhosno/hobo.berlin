import { createAudio } from "../audio.js";
import type { GameEvent, GamePhase } from "./mechanics/types";

type Tone = {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

/**
 * Mechanics events that already match manifest ids play as-is.
 * Others map onto the closest shipped cue (or null = beep-only).
 */
const EVENT_TO_ASSET: Partial<Record<GameEvent, string | null>> = {
  "night-started": "day-night-sting",
  "day-started": "day-night-sting",
  "countdown-tick": null,
  "loose-bottle-collected": "loose-bottle-collected",
  "bin-bottles": "bin-bottles",
  "bin-burn": "bin-burn",
  "rewe-wait-started": null,
  "bottles-depositing": null,
  "cash-received": "bottles-redeemed",
  "food-wait-started": null,
  "food-bought": "food-bought",
  "food-denied": "food-denied",
  "rewe-denied": "food-denied",
  "day-failed": "day-failed",
  "day-survived": "day-survived",
  won: "won",
  lost: "lost",
  "move-closer": null,
  "action-noop": null,
};

/** Extra short SFX layered on top of the primary mapped cue. */
const EXTRA_ASSETS: Partial<Record<GameEvent, readonly string[]>> = {
  "bin-burn": ["heart-lost"],
  "day-failed": ["heart-lost"],
};

/**
 * Theme WAVs are large (~0.5–1MB). Playing them through decodeAudioData has
 * crashed tabs; keep short SFX on the Web Audio path and stream themes via
 * HTMLAudioElement instead.
 */
const EVENT_MUSIC_URL: Partial<Record<GameEvent, string>> = {
  won: "/assets/audio/music/benefits-approved-win.wav",
  lost: "/assets/audio/music/wartenummer-requiem-lose.wav",
};

const TONES: Partial<Record<GameEvent, Tone | Tone[]>> = {
  "night-started": { freq: 180, duration: 0.2, type: "sine", gain: 0.08 },
  "day-started": { freq: 420, duration: 0.18, type: "triangle", gain: 0.08 },
  "countdown-tick": { freq: 660, duration: 0.08, type: "square", gain: 0.05 },
  "loose-bottle-collected": {
    freq: 880,
    duration: 0.07,
    type: "square",
    gain: 0.06,
  },
  "bin-bottles": { freq: 720, duration: 0.1, type: "square", gain: 0.07 },
  "bin-burn": { freq: 140, duration: 0.22, type: "sawtooth", gain: 0.07 },
  "rewe-wait-started": { freq: 330, duration: 0.1, type: "triangle", gain: 0.05 },
  "bottles-depositing": [
    { freq: 520, duration: 0.06, type: "square", gain: 0.05 },
    { freq: 390, duration: 0.06, type: "square", gain: 0.05 },
  ],
  "cash-received": { freq: 990, duration: 0.12, type: "square", gain: 0.07 },
  "food-wait-started": { freq: 300, duration: 0.1, type: "triangle", gain: 0.05 },
  "food-bought": { freq: 700, duration: 0.14, type: "triangle", gain: 0.07 },
  "food-denied": { freq: 200, duration: 0.12, type: "sine", gain: 0.06 },
  "rewe-denied": { freq: 200, duration: 0.12, type: "sine", gain: 0.06 },
  "day-failed": { freq: 160, duration: 0.25, type: "sawtooth", gain: 0.07 },
  "day-survived": { freq: 540, duration: 0.16, type: "triangle", gain: 0.06 },
  won: [
    { freq: 523, duration: 0.1, type: "square", gain: 0.06 },
    { freq: 659, duration: 0.1, type: "square", gain: 0.06 },
    { freq: 784, duration: 0.18, type: "square", gain: 0.07 },
  ],
  lost: { freq: 110, duration: 0.35, type: "sine", gain: 0.08 },
};

let beepCtx: AudioContext | null = null;
let beepUnlocked = false;
let assetAudio: ReturnType<typeof createAudio> | null = null;
let startedOnce = false;
let themePlayer: HTMLAudioElement | null = null;

function getBeepCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!beepCtx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    beepCtx = new AC();
  }
  return beepCtx;
}

function playBeep(event: GameEvent): boolean {
  if (!beepUnlocked) return false;
  const tone = TONES[event];
  if (!tone) return false;
  const audio = getBeepCtx();
  if (!audio) return false;
  if (audio.state === "suspended") void audio.resume();
  const start = audio.currentTime + 0.01;
  const list = Array.isArray(tone) ? tone : [tone];
  let t = start;
  for (const step of list) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = step.type ?? "square";
    osc.frequency.value = step.freq;
    const level = step.gain ?? 0.05;
    gain.gain.setValueAtTime(level, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + step.duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t);
    osc.stop(t + step.duration + 0.02);
    t += step.duration * 0.85;
  }
  return true;
}

function getAssetAudio(): ReturnType<typeof createAudio> {
  if (!assetAudio) {
    assetAudio = createAudio({
      fallback: (eventId: string) => {
        if (eventId in TONES) return playBeep(eventId as GameEvent);
        return false;
      },
    });
    // Prefer the small base/alt 22kHz packs — modern WAVs are much larger.
    assetAudio.setVariantStyle("retro-8bit");
  }
  return assetAudio;
}

function stopTheme(): void {
  if (!themePlayer) return;
  themePlayer.pause();
  themePlayer.removeAttribute("src");
  themePlayer.load();
  themePlayer = null;
}

function playThemeUrl(url: string): void {
  try {
    stopTheme();
    const el = new Audio(url);
    el.volume = 0.28;
    themePlayer = el;
    void el.play().catch(() => {
      /* autoplay / decode failure must not break gameplay */
    });
  } catch {
    /* ignore */
  }
}

/** Must run from a user gesture (Start). Ready before the day sequence begins. */
export async function unlockAudio(): Promise<void> {
  beepUnlocked = true;
  const beep = getBeepCtx();
  if (beep?.state === "suspended") {
    try {
      await beep.resume();
    } catch {
      /* continue — beeps may still work after a later gesture */
    }
  }

  const audio = getAssetAudio();
  await audio.unlock();
  audio.setEventEnabled("step", true);

  if (!startedOnce) {
    startedOnce = true;
    // Short cues only — do not decode the multi-hundred-KB intro theme here.
    void audio.play("ui-start");
    void audio.playAmbience("berlin-outside");
  }
}

/** Quiet footstep cue on successful grid moves. */
export function playFootstep(): void {
  if (!beepUnlocked) return;
  void getAssetAudio().play("step");
}

/** Swap ambience beds when the day phase changes. */
export function syncPhaseAudio(phase: GamePhase): void {
  if (!beepUnlocked) return;
  const audio = getAssetAudio();
  if (phase === "night") {
    void audio.playAmbience("city-night");
    return;
  }
  if (phase === "dawn" || phase === "countdown" || phase === "playing") {
    void audio.playAmbience("berlin-outside");
  }
  if (phase === "won" || phase === "lost") {
    audio.stopAmbience();
  }
}

export function playEvent(event: GameEvent): void {
  // Always try a beep if assets are not ready yet (unlock race / missing file).
  const mapped = EVENT_TO_ASSET[event];
  if (mapped === null) {
    playBeep(event);
    return;
  }

  if (!beepUnlocked) {
    playBeep(event);
    return;
  }

  if (mapped) {
    void getAssetAudio()
      .play(mapped)
      .then((ok: boolean) => {
        if (!ok) playBeep(event);
      });
  } else {
    playBeep(event);
  }

  for (const extra of EXTRA_ASSETS[event] ?? []) {
    void getAssetAudio().play(extra);
  }

  const theme = EVENT_MUSIC_URL[event];
  if (theme) playThemeUrl(theme);
}

/** Play only events appended since the previous snapshot. */
export function playEventDelta(
  prevEvents: readonly string[],
  nextEvents: readonly string[],
): void {
  let prefix = 0;
  const limit = Math.min(prevEvents.length, nextEvents.length);
  while (prefix < limit && prevEvents[prefix] === nextEvents[prefix]) {
    prefix += 1;
  }
  const fresh =
    prefix === prevEvents.length
      ? nextEvents.slice(prevEvents.length)
      : nextEvents.slice(-1);
  for (const event of fresh) {
    playEvent(event as GameEvent);
  }
}

/** Dialogue / bubble event ids that match the sound+copy packs. */
export function dialogueEventFor(gameEvent: GameEvent): string | null {
  switch (gameEvent) {
    case "bin-burn":
    case "bin-bottles":
    case "food-bought":
    case "food-denied":
    case "day-failed":
    case "won":
    case "lost":
      return gameEvent;
    case "rewe-denied":
      return "food-denied";
    default:
      return null;
  }
}

export function characterDialogueId(characterId: string): string {
  switch (characterId) {
    case "prompt":
      return "prompt-engineer";
    case "marketing":
      return "head-of-marketing";
    case "qa":
      return "qa-engineer";
    default:
      return characterId;
  }
}
