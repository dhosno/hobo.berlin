import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = new URL('../public/assets/audio/music/', import.meta.url);
const TAU = Math.PI * 2;

const sampleCount = (seconds) => Math.max(1, Math.round(seconds * SAMPLE_RATE));
const midiToHz = (note) => 440 * (2 ** ((note - 69) / 12));
const smoothstep = (value) => value * value * (3 - 2 * value);

function envelope(time, duration, attack = 0.012, release = 0.12) {
  const fadeIn = smoothstep(Math.min(1, time / attack));
  const fadeOut = smoothstep(Math.min(1, (duration - time) / release));
  return Math.max(0, Math.min(fadeIn, fadeOut));
}

function instrument({ duration, note, volume = 0.22, character = 'accordion', release = 0.12 }) {
  const output = new Float64Array(sampleCount(duration));
  const frequency = midiToHz(note);
  const harmonics = character === 'bass' ? [1, 0.28, 0.08] : [1, 0.42, 0.20, 0.09];
  for (let index = 0; index < output.length; index += 1) {
    const time = index / SAMPLE_RATE;
    const vibrato = character === 'accordion' ? Math.sin(TAU * 5.3 * time) * 0.004 : 0;
    let sample = 0;
    harmonics.forEach((amplitude, harmonicIndex) => {
      sample += Math.sin(TAU * frequency * (harmonicIndex + 1) * (1 + vibrato) * time) * amplitude;
    });
    const tremolo = character === 'accordion' ? 0.88 + Math.sin(TAU * 3.7 * time) * 0.12 : 1;
    output[index] = sample / 1.71 * volume * tremolo * envelope(time, duration, 0.018, release);
  }
  return output;
}

function clink({ duration = 0.28, frequency = 1100, volume = 0.17 }) {
  const output = new Float64Array(sampleCount(duration));
  for (let index = 0; index < output.length; index += 1) {
    const time = index / SAMPLE_RATE;
    const attack = smoothstep(Math.min(1, time / 0.003));
    const sample = Math.sin(TAU * frequency * time) * Math.exp(-time * 8)
      + Math.sin(TAU * frequency * 2.37 * time) * Math.exp(-time * 13) * 0.42;
    output[index] = sample * volume * attack;
  }
  return output;
}

function stamp({ duration = 0.09, volume = 0.13, seed = 1 }) {
  const output = new Float64Array(sampleCount(duration));
  let state = seed >>> 0;
  let low = 0;
  for (let index = 0; index < output.length; index += 1) {
    state = (1664525 * state + 1013904223) >>> 0;
    const raw = state / 0xffffffff * 2 - 1;
    low += 0.12 * (raw - low);
    const time = index / SAMPLE_RATE;
    output[index] = low * volume * envelope(time, duration, 0.001, 0.065);
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
  const gain = peak > 0.9 ? 0.9 / peak : 1;
  return Float64Array.from(output, (sample) => sample * gain);
}

function compose({ bpm, melody, bass, ending = [] }) {
  const step = 60 / bpm / 2;
  const steps = Math.max(melody.length, bass.length * 2);
  const duration = steps * step + 0.55;
  const layers = [];

  melody.forEach((note, index) => {
    if (note == null) return;
    layers.push({ at: index * step, samples: instrument({ duration: step * 0.92, note }) });
  });
  bass.forEach((note, index) => {
    layers.push({
      at: index * step * 2,
      samples: instrument({ duration: step * 1.75, note, volume: 0.17, character: 'bass', release: step * 0.45 })
    });
  });
  for (let index = 0; index < steps; index += 2) {
    layers.push({ at: index * step, samples: stamp({ seed: 410 + index, volume: index % 4 === 0 ? 0.12 : 0.07 }) });
  }
  for (const index of [7, 15, 23].filter((value) => value < steps)) {
    layers.push({ at: index * step, samples: clink({ frequency: index === 15 ? 1320 : 1100 }) });
  }
  ending.forEach(({ at, note, volume = 0.20 }) => {
    layers.push({ at: at * step, samples: clink({ duration: 0.42, frequency: midiToHz(note), volume }) });
  });
  return mix(duration, layers);
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

const themes = {
  'pfand-und-circumstance-intro.wav': compose({
    bpm: 138,
    melody: [62, 65, 69, 70, 69, 65, 62, null, 64, 67, 70, 72, 70, 67, 64, null, 62, 65, 69, 74, 72, 70, 69, 62],
    bass: [38, 45, 41, 45, 40, 47, 43, 47, 38, 45, 41, 45],
    ending: [{ at: 23, note: 86, volume: 0.23 }]
  }),
  'formular-finale-outro.wav': compose({
    bpm: 112,
    melody: [69, 67, 65, 64, 62, null, 65, 69, 67, 64, 62, null, 65, 64, 62, 61, 62, 66, 69, 74],
    bass: [45, 40, 41, 45, 43, 40, 41, 45, 38, 45],
    ending: [
      { at: 18, note: 74, volume: 0.17 },
      { at: 19, note: 86, volume: 0.24 }
    ]
  })
};

await mkdir(OUTPUT_DIR, { recursive: true });
await Promise.all(Object.entries(themes).map(([filename, samples]) => (
  writeFile(join(OUTPUT_DIR.pathname, filename), wav16Mono(samples))
)));

console.log(`Generated ${Object.keys(themes).length} theme cues in ${OUTPUT_DIR.pathname}`);
