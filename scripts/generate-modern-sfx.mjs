import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = new URL('../public/assets/audio/sfx/modern/', import.meta.url);
const TAU = Math.PI * 2;

const sampleCount = (seconds) => Math.max(1, Math.round(seconds * SAMPLE_RATE));
const smoothstep = (value) => value * value * (3 - 2 * value);

function envelope(time, duration, attack = 0.008, release = 0.12) {
  const fadeIn = smoothstep(Math.min(1, time / Math.max(attack, 0.001)));
  const fadeOut = smoothstep(Math.min(1, (duration - time) / Math.max(release, 0.001)));
  return Math.max(0, Math.min(fadeIn, fadeOut));
}

function tone({ duration, frequency, endFrequency = frequency, volume = 0.3, attack, release, fm = 0, harmonics = [1] }) {
  const output = new Float64Array(sampleCount(duration));
  let phase = 0;
  for (let index = 0; index < output.length; index += 1) {
    const time = index / SAMPLE_RATE;
    const progress = index / Math.max(1, output.length - 1);
    const hz = frequency + (endFrequency - frequency) * progress;
    phase += TAU * hz / SAMPLE_RATE;
    const modulation = fm ? Math.sin(TAU * hz * 2.01 * time) * fm : 0;
    let sample = 0;
    let weight = 0;
    harmonics.forEach((harmonic, harmonicIndex) => {
      const amplitude = 1 / (harmonicIndex + 1) ** 1.5;
      sample += Math.sin(phase * harmonic + modulation) * amplitude;
      weight += amplitude;
    });
    output[index] = sample / weight * volume * envelope(time, duration, attack, release);
  }
  return output;
}

function bell({ duration, frequency, volume = 0.3 }) {
  const output = new Float64Array(sampleCount(duration));
  const partials = [1, 2.01, 3.93, 5.42];
  for (let index = 0; index < output.length; index += 1) {
    const time = index / SAMPLE_RATE;
    const attack = smoothstep(Math.min(1, time / 0.004));
    let sample = 0;
    partials.forEach((partial, partialIndex) => {
      sample += Math.sin(TAU * frequency * partial * time) * Math.exp(-time * (4 + partialIndex * 2.2)) / (partialIndex + 1);
    });
    output[index] = sample * volume * attack;
  }
  return output;
}

function filteredNoise({ duration, volume = 0.15, seed = 1, cutoff = 0.08, attack = 0.002, release = 0.1 }) {
  const output = new Float64Array(sampleCount(duration));
  let randomState = seed >>> 0;
  let low = 0;
  for (let index = 0; index < output.length; index += 1) {
    randomState = (1664525 * randomState + 1013904223) >>> 0;
    const raw = randomState / 0xffffffff * 2 - 1;
    low += cutoff * (raw - low);
    const time = index / SAMPLE_RATE;
    output[index] = low * volume * envelope(time, duration, attack, release);
  }
  return output;
}

function mix(duration, layers) {
  const output = new Float64Array(sampleCount(duration));
  for (const { at = 0, samples } of layers) {
    const offset = Math.round(at * SAMPLE_RATE);
    for (let index = 0; index < samples.length && offset + index < output.length; index += 1) {
      output[offset + index] += samples[index];
    }
  }
  let peak = 0;
  for (const sample of output) peak = Math.max(peak, Math.abs(sample));
  const gain = peak > 0.92 ? 0.92 / peak : 1;
  return Float64Array.from(output, (sample) => sample * gain);
}

function wav16Mono(samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < samples.length; index += 1) {
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[index] * 32767))), 44 + index * 2);
  }
  return buffer;
}

const modernSounds = {
  'loose-bottle-collected-modern.wav': mix(0.34, [
    { samples: bell({ duration: 0.30, frequency: 1050, volume: 0.34 }) },
    { samples: filteredNoise({ duration: 0.035, volume: 0.10, seed: 301, cutoff: 0.3, release: 0.025 }) }
  ]),
  'bin-bottles-modern.wav': mix(0.54, [
    { at: 0, samples: bell({ duration: 0.30, frequency: 660, volume: 0.25 }) },
    { at: 0.10, samples: bell({ duration: 0.31, frequency: 830, volume: 0.25 }) },
    { at: 0.21, samples: bell({ duration: 0.31, frequency: 1110, volume: 0.28 }) }
  ]),
  'bin-burn-modern.wav': mix(0.58, [
    { samples: filteredNoise({ duration: 0.24, volume: 0.43, seed: 302, cutoff: 0.16, release: 0.18 }) },
    { at: 0.02, samples: tone({ duration: 0.46, frequency: 270, endFrequency: 72, volume: 0.36, fm: 0.7, release: 0.18, harmonics: [1, 2] }) }
  ]),
  'bottles-redeemed-modern.wav': mix(0.62, [
    { samples: filteredNoise({ duration: 0.045, volume: 0.17, seed: 303, cutoff: 0.22, release: 0.03 }) },
    { at: 0.08, samples: bell({ duration: 0.30, frequency: 520, volume: 0.23 }) },
    { at: 0.25, samples: bell({ duration: 0.34, frequency: 1040, volume: 0.32 }) }
  ]),
  'food-bought-modern.wav': mix(0.55, [
    { samples: filteredNoise({ duration: 0.18, volume: 0.30, seed: 304, cutoff: 0.09, release: 0.11 }) },
    { at: 0.11, samples: filteredNoise({ duration: 0.15, volume: 0.23, seed: 305, cutoff: 0.12, release: 0.09 }) },
    { at: 0.28, samples: bell({ duration: 0.24, frequency: 880, volume: 0.22 }) }
  ]),
  'food-denied-modern.wav': mix(0.48, [
    { samples: tone({ duration: 0.24, frequency: 360, volume: 0.26, release: 0.13, harmonics: [1, 2] }) },
    { at: 0.19, samples: tone({ duration: 0.26, frequency: 240, volume: 0.25, release: 0.15, harmonics: [1, 2] }) }
  ]),
  'day-failed-modern.wav': mix(0.78, [
    { samples: tone({ duration: 0.32, frequency: 330, volume: 0.24, release: 0.20, harmonics: [1, 2, 3] }) },
    { at: 0.22, samples: tone({ duration: 0.32, frequency: 262, volume: 0.23, release: 0.20, harmonics: [1, 2, 3] }) },
    { at: 0.44, samples: tone({ duration: 0.31, frequency: 196, volume: 0.22, release: 0.22, harmonics: [1, 2, 3] }) }
  ]),
  'day-survived-modern.wav': mix(0.82, [
    { samples: tone({ duration: 0.40, frequency: 330, volume: 0.21, attack: 0.025, release: 0.24, harmonics: [1, 2] }) },
    { at: 0.20, samples: tone({ duration: 0.40, frequency: 494, volume: 0.20, attack: 0.025, release: 0.24, harmonics: [1, 2] }) },
    { at: 0.40, samples: tone({ duration: 0.39, frequency: 659, volume: 0.20, attack: 0.025, release: 0.25, harmonics: [1, 2] }) }
  ]),
  'won-modern.wav': mix(1.18, [
    { at: 0, samples: bell({ duration: 0.42, frequency: 520, volume: 0.24 }) },
    { at: 0.16, samples: bell({ duration: 0.44, frequency: 660, volume: 0.24 }) },
    { at: 0.32, samples: bell({ duration: 0.46, frequency: 830, volume: 0.25 }) },
    { at: 0.50, samples: tone({ duration: 0.64, frequency: 1040, volume: 0.26, attack: 0.015, release: 0.34, harmonics: [1, 2, 3] }) },
    { at: 0.50, samples: tone({ duration: 0.64, frequency: 520, volume: 0.14, attack: 0.015, release: 0.34, harmonics: [1, 2] }) }
  ]),
  'lost-modern.wav': mix(1.00, [
    { samples: tone({ duration: 0.44, frequency: 294, volume: 0.23, attack: 0.018, release: 0.28, harmonics: [1, 2] }) },
    { at: 0.26, samples: tone({ duration: 0.44, frequency: 220, volume: 0.22, attack: 0.018, release: 0.28, harmonics: [1, 2] }) },
    { at: 0.52, samples: tone({ duration: 0.45, frequency: 165, volume: 0.21, attack: 0.018, release: 0.31, harmonics: [1, 2] }) }
  ]),
  'ui-start-modern.wav': mix(0.32, [
    { samples: tone({ duration: 0.12, frequency: 520, endFrequency: 700, volume: 0.24, release: 0.06, fm: 0.25 }) },
    { at: 0.07, samples: bell({ duration: 0.22, frequency: 1040, volume: 0.22 }) }
  ]),
  'step-modern.wav': mix(0.15, [
    { samples: filteredNoise({ duration: 0.11, volume: 0.20, seed: 312, cutoff: 0.055, release: 0.08 }) },
    { samples: tone({ duration: 0.10, frequency: 86, endFrequency: 58, volume: 0.16, release: 0.07 }) }
  ]),
  'day-night-sting-modern.wav': mix(1.45, [
    { samples: filteredNoise({ duration: 1.36, volume: 0.20, seed: 313, cutoff: 0.025, attack: 0.16, release: 0.38 }) },
    { at: 0.04, samples: tone({ duration: 1.30, frequency: 120, endFrequency: 640, volume: 0.27, attack: 0.28, release: 0.38, fm: 0.15, harmonics: [1, 2] }) },
    { at: 0.82, samples: bell({ duration: 0.48, frequency: 880, volume: 0.16 }) }
  ])
};

await mkdir(OUTPUT_DIR, { recursive: true });
await Promise.all(Object.entries(modernSounds).map(([filename, samples]) => (
  writeFile(join(OUTPUT_DIR.pathname, filename), wav16Mono(samples))
)));

console.log(`Generated ${Object.keys(modernSounds).length} modern sounds in ${OUTPUT_DIR.pathname}`);
