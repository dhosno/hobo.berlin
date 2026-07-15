import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SAMPLE_RATE = 22050;
const BASE_OUTPUT_DIR = new URL('../public/assets/audio/sfx/base/', import.meta.url);
const ALT_OUTPUT_DIR = new URL('../public/assets/audio/sfx/alt/', import.meta.url);
const TAU = Math.PI * 2;

function secondsToSamples(seconds) {
  return Math.max(1, Math.round(seconds * SAMPLE_RATE));
}

function silence(seconds) {
  return new Float64Array(secondsToSamples(seconds));
}

function envelope(position, duration, attack = 0.01, release = 0.06) {
  const fadeIn = Math.min(1, position / Math.max(attack, 0.001));
  const fadeOut = Math.min(1, (duration - position) / Math.max(release, 0.001));
  return Math.max(0, Math.min(fadeIn, fadeOut));
}

function oscillator({
  duration,
  frequency,
  endFrequency = frequency,
  type = 'square',
  volume = 0.45,
  attack = 0.006,
  release = 0.05,
  vibrato = 0
}) {
  const output = silence(duration);
  let phase = 0;

  for (let index = 0; index < output.length; index += 1) {
    const time = index / SAMPLE_RATE;
    const progress = index / Math.max(1, output.length - 1);
    const baseFrequency = frequency + (endFrequency - frequency) * progress;
    const currentFrequency = baseFrequency * (1 + Math.sin(TAU * 8 * time) * vibrato);
    phase = (phase + currentFrequency / SAMPLE_RATE) % 1;

    let sample;
    if (type === 'triangle') sample = 1 - 4 * Math.abs(phase - 0.5);
    else if (type === 'saw') sample = phase * 2 - 1;
    else sample = phase < 0.5 ? 1 : -1;

    output[index] = sample * volume * envelope(time, duration, attack, release);
  }

  return output;
}

function noise({ duration, volume = 0.25, release = 0.08, seed = 1, crunch = 1 }) {
  const output = silence(duration);
  let randomState = seed >>> 0;
  let held = 0;

  for (let index = 0; index < output.length; index += 1) {
    if (index % crunch === 0) {
      randomState = (1664525 * randomState + 1013904223) >>> 0;
      held = (randomState / 0xffffffff) * 2 - 1;
    }
    const time = index / SAMPLE_RATE;
    output[index] = held * volume * envelope(time, duration, 0.002, release);
  }

  return output;
}

function mix(duration, layers) {
  const output = silence(duration);

  for (const { at = 0, samples } of layers) {
    const offset = secondsToSamples(at);
    for (let index = 0; index < samples.length && offset + index < output.length; index += 1) {
      output[offset + index] += samples[index];
    }
  }

  let peak = 0;
  for (const sample of output) peak = Math.max(peak, Math.abs(sample));
  const gain = peak > 0.92 ? 0.92 / peak : 1;
  return Float64Array.from(output, (sample) => sample * gain);
}

function notes(sequence, defaults = {}) {
  return sequence.map(({ at, duration, frequency, ...options }) => ({
    at,
    samples: oscillator({ duration, frequency, ...defaults, ...options })
  }));
}

function wav8Mono(samples) {
  const dataSize = samples.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < samples.length; index += 1) {
    buffer[44 + index] = Math.max(0, Math.min(255, Math.round(128 + samples[index] * 127)));
  }

  return buffer;
}

const sounds = {
  'loose-bottle-collected.wav': mix(0.24, [
    ...notes([
      { at: 0, duration: 0.08, frequency: 880 },
      { at: 0.07, duration: 0.14, frequency: 1320 }
    ], { type: 'square', volume: 0.34, release: 0.04 }),
    { at: 0, samples: noise({ duration: 0.035, volume: 0.12, release: 0.025, seed: 11, crunch: 4 }) }
  ]),
  'bin-bottles.wav': mix(0.42, [
    ...notes([
      { at: 0, duration: 0.11, frequency: 523.25 },
      { at: 0.09, duration: 0.11, frequency: 659.25 },
      { at: 0.18, duration: 0.20, frequency: 987.77 }
    ], { type: 'square', volume: 0.30, release: 0.06 }),
    { at: 0.01, samples: noise({ duration: 0.08, volume: 0.10, release: 0.05, seed: 22, crunch: 6 }) }
  ]),
  'bin-burn.wav': mix(0.48, [
    { at: 0, samples: noise({ duration: 0.16, volume: 0.36, release: 0.12, seed: 33, crunch: 3 }) },
    { at: 0.02, samples: oscillator({ duration: 0.33, frequency: 310, endFrequency: 82, type: 'saw', volume: 0.42, release: 0.12 }) },
    { at: 0.30, samples: oscillator({ duration: 0.12, frequency: 118, type: 'square', volume: 0.22, release: 0.09 }) }
  ]),
  'bottles-redeemed.wav': mix(0.52, [
    { at: 0, samples: noise({ duration: 0.06, volume: 0.16, release: 0.04, seed: 44, crunch: 8 }) },
    ...notes([
      { at: 0.07, duration: 0.16, frequency: 392 },
      { at: 0.24, duration: 0.24, frequency: 783.99 }
    ], { type: 'triangle', volume: 0.42, release: 0.09 })
  ]),
  'food-bought.wav': mix(0.44, [
    { at: 0, samples: noise({ duration: 0.20, volume: 0.30, release: 0.08, seed: 55, crunch: 10 }) },
    { at: 0.05, samples: oscillator({ duration: 0.13, frequency: 145, endFrequency: 95, type: 'square', volume: 0.20, release: 0.07 }) },
    { at: 0.24, samples: oscillator({ duration: 0.16, frequency: 1046.5, type: 'square', volume: 0.26, release: 0.05 }) }
  ]),
  'food-denied.wav': mix(0.36, notes([
    { at: 0, duration: 0.16, frequency: 330 },
    { at: 0.15, duration: 0.18, frequency: 220 }
  ], { type: 'square', volume: 0.30, release: 0.09 })),
  'day-failed.wav': mix(0.56, notes([
    { at: 0, duration: 0.18, frequency: 293.66 },
    { at: 0.17, duration: 0.18, frequency: 233.08 },
    { at: 0.34, duration: 0.20, frequency: 174.61 }
  ], { type: 'triangle', volume: 0.36, release: 0.10 })),
  'day-survived.wav': mix(0.64, notes([
    { at: 0, duration: 0.20, frequency: 261.63 },
    { at: 0.16, duration: 0.20, frequency: 392 },
    { at: 0.32, duration: 0.28, frequency: 523.25 }
  ], { type: 'triangle', volume: 0.32, release: 0.13 })),
  'won.wav': mix(0.92, notes([
    { at: 0, duration: 0.20, frequency: 392 },
    { at: 0.16, duration: 0.20, frequency: 523.25 },
    { at: 0.32, duration: 0.20, frequency: 659.25 },
    { at: 0.48, duration: 0.40, frequency: 783.99 },
    { at: 0.48, duration: 0.40, frequency: 523.25, volume: 0.18 }
  ], { type: 'square', volume: 0.28, release: 0.12 })),
  'lost.wav': mix(0.78, notes([
    { at: 0, duration: 0.24, frequency: 329.63 },
    { at: 0.20, duration: 0.24, frequency: 261.63 },
    { at: 0.40, duration: 0.34, frequency: 196 }
  ], { type: 'triangle', volume: 0.30, release: 0.15, vibrato: 0.004 })),
  'ui-start.wav': mix(0.24, notes([
    { at: 0, duration: 0.08, frequency: 440 },
    { at: 0.07, duration: 0.14, frequency: 880 }
  ], { type: 'square', volume: 0.28, release: 0.04 })),
  'step-1.wav': mix(0.10, [
    { at: 0, samples: noise({ duration: 0.075, volume: 0.16, release: 0.06, seed: 66, crunch: 12 }) },
    { at: 0, samples: oscillator({ duration: 0.07, frequency: 92, endFrequency: 70, type: 'triangle', volume: 0.14, release: 0.05 }) }
  ]),
  'step-2.wav': mix(0.10, [
    { at: 0, samples: noise({ duration: 0.075, volume: 0.14, release: 0.06, seed: 77, crunch: 10 }) },
    { at: 0, samples: oscillator({ duration: 0.07, frequency: 82, endFrequency: 62, type: 'triangle', volume: 0.13, release: 0.05 }) }
  ]),
  'day-night-sting.wav': mix(1.18, [
    { at: 0, samples: noise({ duration: 1.10, volume: 0.16, release: 0.35, seed: 88, crunch: 18 }) },
    { at: 0.05, samples: oscillator({ duration: 0.95, frequency: 110, endFrequency: 660, type: 'triangle', volume: 0.28, attack: 0.18, release: 0.30 }) },
    { at: 0.70, samples: oscillator({ duration: 0.42, frequency: 880, type: 'square', volume: 0.16, attack: 0.12, release: 0.25 }) }
  ])
};

Object.assign(sounds, {
  'loose-bottle-collected-alt.wav': mix(0.26, [
    ...notes([
      { at: 0, duration: 0.09, frequency: 659.25 },
      { at: 0.08, duration: 0.15, frequency: 987.77 }
    ], { type: 'triangle', volume: 0.40, release: 0.05 }),
    { at: 0.015, samples: noise({ duration: 0.045, volume: 0.13, release: 0.03, seed: 111, crunch: 5 }) }
  ]),
  'bin-bottles-alt.wav': mix(0.46, [
    ...notes([
      { at: 0, duration: 0.10, frequency: 587.33 },
      { at: 0.08, duration: 0.10, frequency: 783.99 },
      { at: 0.17, duration: 0.10, frequency: 987.77 },
      { at: 0.25, duration: 0.18, frequency: 1174.66 }
    ], { type: 'square', volume: 0.27, release: 0.055 }),
    { at: 0, samples: noise({ duration: 0.09, volume: 0.11, release: 0.06, seed: 122, crunch: 7 }) }
  ]),
  'bin-burn-alt.wav': mix(0.50, [
    { at: 0, samples: noise({ duration: 0.20, volume: 0.33, release: 0.15, seed: 133, crunch: 5 }) },
    { at: 0.03, samples: oscillator({ duration: 0.36, frequency: 370, endFrequency: 98, type: 'square', volume: 0.34, release: 0.14, vibrato: 0.018 }) },
    { at: 0.34, samples: oscillator({ duration: 0.12, frequency: 92, type: 'triangle', volume: 0.20, release: 0.09 }) }
  ]),
  'bottles-redeemed-alt.wav': mix(0.58, [
    { at: 0, samples: noise({ duration: 0.045, volume: 0.14, release: 0.03, seed: 144, crunch: 9 }) },
    { at: 0.13, samples: noise({ duration: 0.04, volume: 0.12, release: 0.025, seed: 145, crunch: 10 }) },
    ...notes([
      { at: 0.05, duration: 0.13, frequency: 440 },
      { at: 0.20, duration: 0.13, frequency: 659.25 },
      { at: 0.34, duration: 0.20, frequency: 880 }
    ], { type: 'triangle', volume: 0.38, release: 0.08 })
  ]),
  'food-bought-alt.wav': mix(0.48, [
    { at: 0, samples: noise({ duration: 0.14, volume: 0.26, release: 0.08, seed: 155, crunch: 8 }) },
    { at: 0.12, samples: noise({ duration: 0.13, volume: 0.22, release: 0.07, seed: 156, crunch: 11 }) },
    { at: 0.27, samples: oscillator({ duration: 0.17, frequency: 783.99, type: 'square', volume: 0.28, release: 0.06 }) }
  ]),
  'food-denied-alt.wav': mix(0.42, notes([
    { at: 0, duration: 0.13, frequency: 392 },
    { at: 0.12, duration: 0.13, frequency: 311.13 },
    { at: 0.24, duration: 0.15, frequency: 233.08 }
  ], { type: 'triangle', volume: 0.34, release: 0.08 })),
  'day-failed-alt.wav': mix(0.62, [
    ...notes([
      { at: 0, duration: 0.16, frequency: 349.23 },
      { at: 0.15, duration: 0.16, frequency: 261.63 },
      { at: 0.30, duration: 0.25, frequency: 196 }
    ], { type: 'square', volume: 0.25, release: 0.13 }),
    { at: 0.42, samples: noise({ duration: 0.10, volume: 0.09, release: 0.08, seed: 177, crunch: 14 }) }
  ]),
  'day-survived-alt.wav': mix(0.68, notes([
    { at: 0, duration: 0.18, frequency: 329.63 },
    { at: 0.15, duration: 0.18, frequency: 493.88 },
    { at: 0.30, duration: 0.18, frequency: 587.33 },
    { at: 0.43, duration: 0.22, frequency: 659.25 }
  ], { type: 'square', volume: 0.25, release: 0.11 })),
  'won-alt.wav': mix(1.02, [
    ...notes([
      { at: 0, duration: 0.16, frequency: 523.25 },
      { at: 0.14, duration: 0.16, frequency: 659.25 },
      { at: 0.28, duration: 0.16, frequency: 783.99 },
      { at: 0.42, duration: 0.16, frequency: 1046.5 },
      { at: 0.57, duration: 0.38, frequency: 1318.51 },
      { at: 0.57, duration: 0.38, frequency: 659.25, volume: 0.14 }
    ], { type: 'triangle', volume: 0.33, release: 0.13 }),
    { at: 0.56, samples: noise({ duration: 0.08, volume: 0.08, release: 0.06, seed: 199, crunch: 6 }) }
  ]),
  'lost-alt.wav': mix(0.86, [
    ...notes([
      { at: 0, duration: 0.22, frequency: 293.66 },
      { at: 0.19, duration: 0.22, frequency: 246.94 },
      { at: 0.38, duration: 0.40, frequency: 164.81 }
    ], { type: 'square', volume: 0.22, release: 0.18, vibrato: 0.006 }),
    { at: 0.55, samples: noise({ duration: 0.16, volume: 0.07, release: 0.13, seed: 210, crunch: 16 }) }
  ]),
  'ui-start-alt.wav': mix(0.28, [
    { at: 0, samples: oscillator({ duration: 0.11, frequency: 523.25, type: 'triangle', volume: 0.34, release: 0.04 }) },
    { at: 0.09, samples: oscillator({ duration: 0.16, frequency: 1046.5, type: 'square', volume: 0.24, release: 0.06 }) }
  ]),
  'day-night-sting-alt.wav': mix(1.22, [
    { at: 0, samples: noise({ duration: 1.12, volume: 0.13, release: 0.38, seed: 232, crunch: 21 }) },
    { at: 0.04, samples: oscillator({ duration: 1.02, frequency: 740, endFrequency: 123, type: 'triangle', volume: 0.26, attack: 0.20, release: 0.34 }) },
    { at: 0.72, samples: oscillator({ duration: 0.43, frequency: 329.63, type: 'square', volume: 0.13, attack: 0.10, release: 0.27 }) }
  ])
});

await Promise.all([
  mkdir(BASE_OUTPUT_DIR, { recursive: true }),
  mkdir(ALT_OUTPUT_DIR, { recursive: true })
]);
await Promise.all(
  Object.entries(sounds).map(([filename, samples]) => {
    const directory = filename.endsWith('-alt.wav') ? ALT_OUTPUT_DIR : BASE_OUTPUT_DIR;
    return writeFile(join(directory.pathname, filename), wav8Mono(samples));
  })
);

console.log(`Generated ${Object.keys(sounds).length} base/alt sounds under public/assets/audio/sfx/`);
