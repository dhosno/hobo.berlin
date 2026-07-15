import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../src/audio.js';
import { createDialogue } from '../src/dialogue.js';
import { bindGameFeedback } from '../src/game-feedback.js';

class FakeAudioContext {
  static instances = [];

  constructor() {
    this.state = 'suspended';
    this.destination = {};
    this.started = [];
    this.sources = [];
    this.gains = [];
    this.stopped = 0;
    FakeAudioContext.instances.push(this);
  }

  async resume() {
    this.state = 'running';
  }

  async decodeAudioData(data) {
    return { decoded: data.byteLength };
  }

  createBufferSource() {
    const context = this;
    const source = {
      buffer: null,
      loop: false,
      connect(target) {
        return target;
      },
      start() {
        context.started.push(this.buffer);
      },
      stop() {
        context.stopped += 1;
      }
    };
    this.sources.push(source);
    return source;
  }

  createGain() {
    const gain = {
      gain: { value: 0 },
      connect: (target) => target
    };
    this.gains.push(gain);
    return gain;
  }

  async close() {
    this.state = 'closed';
  }
}

function jsonResponse(data, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => data };
}

test('audio unlocks lazily, caches assets, persists mute, and opts footsteps in', async () => {
  FakeAudioContext.instances.length = 0;
  const requests = [];
  const stored = new Map();
  const storage = {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value)
  };
  const manifest = {
    defaults: { sfxVolume: 0.72, ambienceVolume: 0.16 },
    events: {
      ping: { file: '/ping.wav' },
      step: { files: ['/step-1.wav', '/step-2.wav'], defaultEnabled: false, volume: 0.18 }
    },
    ambience: {
      berlin: { file: '/berlin.ogg', loop: true }
    }
  };
  const fetchImpl = async (url) => {
    requests.push(url);
    if (url === '/manifest.json') return jsonResponse(manifest);
    return { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) };
  };
  const audio = createAudio({
    manifestUrl: '/manifest.json', fetchImpl, AudioContextClass: FakeAudioContext, storage
  });

  assert.equal(await audio.play('ping'), false, 'audio must not play before Start unlock');
  assert.equal(await audio.unlock(), true);
  assert.equal(await audio.play('ping'), true);
  assert.equal(await audio.play('ping'), true);
  assert.equal(requests.filter((url) => url === '/ping.wav').length, 1, 'decoded asset should be cached');
  assert.equal(FakeAudioContext.instances[0].started.length, 2);
  assert.equal(FakeAudioContext.instances[0].gains[0].gain.value, 0.72);

  assert.equal(await audio.play('step'), false, 'footsteps default off');
  audio.setEventEnabled('step', true);
  assert.equal(await audio.play('step'), true);

  assert.equal(await audio.playAmbience('berlin'), true);
  assert.equal(FakeAudioContext.instances[0].sources.at(-1).loop, true);
  assert.equal(FakeAudioContext.instances[0].gains.at(-1).gain.value, 0.16);
  assert.equal(await audio.playAmbience('berlin'), true, 'selecting the active ambience must not restart it');

  assert.equal(audio.setMuted(true), true);
  assert.equal(FakeAudioContext.instances[0].stopped, 1, 'mute must stop continuous ambience');
  assert.equal(stored.get('hobo.audio.muted'), 'true');
  assert.equal(await audio.play('ping'), false);
  await audio.destroy();
});

test('missing Web Audio and missing assets use a safe optional fallback', async () => {
  const fallbacks = [];
  const audioWithoutContext = createAudio({
    AudioContextClass: undefined,
    storage: undefined,
    fallback: (eventId) => fallbacks.push(eventId) > 0,
    logger: null
  });
  assert.equal(await audioWithoutContext.unlock(), false);
  assert.equal(await audioWithoutContext.play('bin-burn'), true);
  assert.deepEqual(fallbacks, ['bin-burn']);

  const audioWithoutAsset = createAudio({
    manifestUrl: '/manifest.json',
    AudioContextClass: FakeAudioContext,
    storage: undefined,
    logger: null,
    fetchImpl: async () => jsonResponse({ events: {} }),
    fallback: (eventId) => eventId === 'unknown'
  });
  await audioWithoutAsset.unlock();
  assert.equal(await audioWithoutAsset.play('unknown'), true);
});

test('dialogue normalizes locale, falls back to English, and respects weights', async () => {
  const requests = [];
  const english = [
    { id: 'one', event: 'bin-burn', text: 'One', weight: 3 },
    { id: 'two', event: 'bin-burn', text: 'Two', weight: 1 },
    { id: 'qa', event: 'bin-burn', text: 'QA only', characterId: 'qa', weight: 10 }
  ];
  const dialogue = createDialogue({
    baseUrl: '/copy',
    logger: null,
    fetchImpl: async (url) => {
      requests.push(url);
      return url.endsWith('.en.json')
        ? jsonResponse(english)
        : jsonResponse(null, { ok: false, status: 404 });
    }
  });

  const generic = await dialogue.pick('bin-burn', { locale: 'fr-FR', random: () => 0.8 });
  assert.equal(generic.id, 'two');
  const qa = await dialogue.pick('bin-burn', { locale: 'en', characterId: 'qa', random: () => 0.99 });
  assert.equal(qa.id, 'qa');
  assert.deepEqual(requests, ['/copy/dialogue-lines.fr.json', '/copy/dialogue-lines.en.json']);
});

class FakeEventTarget {
  listeners = new Map();

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type, detail) {
    for (const listener of this.listeners.get(type) || []) listener({ type, detail });
  }
}

test('named game events trigger sound and locale-backed bubbles, then unsubscribe cleanly', async () => {
  const target = new FakeEventTarget();
  const played = [];
  const bubbles = [];
  const stop = bindGameFeedback(target, {
    eventIds: ['character-intro', 'bin-burn', 'heart-lost', 'step'],
    audio: { play: async (eventId) => played.push(eventId) },
    dialogue: { pick: async (eventId, options) => ({ id: 'line', event: eventId, text: options.locale }) },
    locale: () => 'de',
    showBubble: (line, detail) => bubbles.push({ line, detail })
  });

  target.emit('character-intro', { characterId: 'qa-engineer' });
  target.emit('heart-lost');
  target.emit('step');
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(played, ['heart-lost', 'step'], 'text-only intro must not request an unmapped sound');
  assert.equal(bubbles.length, 1);
  assert.equal(bubbles[0].line.text, 'de');

  stop();
  target.emit('bin-burn');
  await Promise.resolve();
  assert.deepEqual(played, ['heart-lost', 'step']);
});
