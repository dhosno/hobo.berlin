import { createAudio } from "../audio.js";
import type { GameEvent } from "./mechanics/types";

type Tone = {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

/** Map mechanics event IDs onto manifest SFX ids from `public/assets/audio`. */
const EVENT_TO_ASSET: Partial<Record<GameEvent, string | null>> = {
  "night-started": "day-night-sting",
  "day-started": "day-night-sting",
  "countdown-tick": null,
  "bottle-collected": "loose-bottle-collected",
  "got-burned": "bin-burn",
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

const TONES: Partial<Record<GameEvent, Tone | Tone[]>> = {
  "night-started": { freq: 180, duration: 0.2, type: "sine", gain: 0.08 },
  "day-started": { freq: 420, duration: 0.18, type: "triangle", gain: 0.08 },
  "countdown-tick": { freq: 660, duration: 0.08, type: "square", gain: 0.05 },
  "bottle-collected": { freq: 880, duration: 0.07, type: "square", gain: 0.06 },
  "got-burned": { freq: 140, duration: 0.22, type: "sawtooth", gain: 0.07 },
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

const assetAudio = createAudio({
  fallback: (eventId: string) => {
    // Manifest ids sometimes arrive here; map back is unnecessary for beeps.
    if (eventId in TONES) return playBeep(eventId as GameEvent);
    return false;
  },
});

let startedOnce = false;

export async function unlockAudio(): Promise<void> {
  beepUnlocked = true;
  const beep = getBeepCtx();
  if (beep?.state === "suspended") await beep.resume();
  await assetAudio.unlock();
  if (!startedOnce) {
    startedOnce = true;
    void assetAudio.play("ui-start");
    void assetAudio.playAmbience("berlin-outside");
  }
}

export function playEvent(event: GameEvent): void {
  const mapped = EVENT_TO_ASSET[event];
  if (mapped === null) {
    playBeep(event);
    return;
  }
  if (mapped) {
    void assetAudio.play(mapped).then((ok: boolean) => {
      if (!ok) playBeep(event);
    });
    return;
  }
  playBeep(event);
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
