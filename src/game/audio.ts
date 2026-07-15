import type { GameEvent } from "./mechanics/types";

type Tone = { freq: number; duration: number; type?: OscillatorType; gain?: number };

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

let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export async function unlockAudio(): Promise<void> {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") {
    await audio.resume();
  }
  unlocked = true;
}

function beep(tone: Tone, when: number): void {
  const audio = getCtx();
  if (!audio || !unlocked) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = tone.type ?? "square";
  osc.frequency.value = tone.freq;
  const level = tone.gain ?? 0.05;
  gain.gain.setValueAtTime(level, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + tone.duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(when);
  osc.stop(when + tone.duration + 0.02);
}

export function playEvent(event: GameEvent): void {
  if (!unlocked) return;
  const tone = TONES[event];
  if (!tone) return;
  const audio = getCtx();
  if (!audio) return;
  const start = audio.currentTime + 0.01;
  const list = Array.isArray(tone) ? tone : [tone];
  let t = start;
  for (const step of list) {
    beep(step, t);
    t += step.duration * 0.85;
  }
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
