import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPhaserAudio, queuePhaserAudio } from '../src/phaser-audio.js';
import { bindGameFeedback } from '../src/game-feedback.js';

const manifest = JSON.parse(await readFile(
  new URL('../public/assets/audio/manifest.json', import.meta.url), 'utf8'
));

class FakeEmitter {
  listeners = new Map();

  on(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
    return this;
  }

  off(type, listener) {
    this.listeners.get(type)?.delete(listener);
    return this;
  }

  emit(type, detail) {
    for (const listener of this.listeners.get(type) || []) listener(detail);
  }
}

function fakeScene() {
  const queued = [];
  const played = [];
  const added = [];
  const events = new FakeEmitter();
  const sound = {
    locked: false,
    mute: false,
    unlockCalls: 0,
    setMute(value) {
      this.mute = value;
    },
    unlock() {
      this.unlockCalls += 1;
    },
    play(key, config) {
      played.push({ key, config });
      return true;
    },
    add(key, config) {
      const instance = {
        key,
        config,
        stopped: false,
        destroyed: false,
        play: () => true,
        stop() { this.stopped = true; },
        destroy() { this.destroyed = true; }
      };
      added.push(instance);
      return instance;
    }
  };
  return {
    queued,
    played,
    added,
    load: { audio: (key, file) => queued.push({ key, file }) },
    cache: { audio: { exists: () => true } },
    sound,
    events
  };
}

test('Phaser preload queues all SFX, theme music, and ambience with stable cache keys', () => {
  const scene = fakeScene();
  const keys = queuePhaserAudio(scene, manifest);
  assert.equal(keys.length, 49);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.includes('hobo:ambience:berlin-outside'));
  assert.ok(keys.includes('hobo:music:intro-pfand-und-circumstance'));
  assert.ok(keys.includes('hobo:music:win-benefits-approved-overture'));
  assert.ok(keys.includes('hobo:music:lose-wartenummer-requiem'));
  assert.ok(keys.includes('hobo:sfx:heart-lost:2'));
  assert.ok(keys.includes('hobo:sfx:step:0'));
  assert.ok(keys.includes('hobo:ambience:city-night'));
});

test('Phaser facade uses Sound Manager for unlock, events, ambience, mute, and teardown', async () => {
  const scene = fakeScene();
  const storageValues = new Map();
  const audio = createPhaserAudio(scene, manifest, {
    storage: {
      getItem: (key) => storageValues.get(key) ?? null,
      setItem: (key, value) => storageValues.set(key, value)
    }
  });

  assert.equal(await audio.unlock(), true);
  assert.equal(scene.sound.unlockCalls, 1);
  assert.equal(await audio.play('bin-bottles'), true);
  assert.equal(scene.played[0].key, 'hobo:sfx:bin-bottles:0');
  assert.equal(await audio.play('bin-bottles'), true);
  assert.equal(scene.played[1].key, 'hobo:sfx:bin-bottles:1');
  assert.equal(await audio.play('bin-bottles'), true);
  assert.equal(scene.played[2].key, 'hobo:sfx:bin-bottles:2');
  audio.setVariantStyle('modern-16bit');
  assert.equal(await audio.play('bin-bottles'), true);
  assert.equal(scene.played[3].key, 'hobo:sfx:bin-bottles:2');
  assert.equal(await audio.play('step'), false, 'footsteps remain opt-in');
  audio.setEventEnabled('step', true);
  assert.equal(await audio.play('step'), true);
  assert.equal(scene.played.at(-1).key, 'hobo:sfx:step:2');

  assert.equal(await audio.playMusic('intro-pfand-und-circumstance'), true);
  assert.equal(scene.added[0].key, 'hobo:music:intro-pfand-und-circumstance');
  assert.equal(scene.added[0].config.loop, false);
  assert.equal(scene.added[0].config.volume, 0.28);

  assert.equal(await audio.playAmbience('berlin-outside'), true);
  assert.equal(scene.added[1].key, 'hobo:ambience:berlin-outside');
  assert.equal(scene.added[1].config.loop, true);
  assert.equal(scene.added[1].config.volume, 0.14);

  assert.equal(audio.setMuted(true), true);
  assert.equal(scene.sound.mute, true);
  assert.equal(scene.added[0].stopped, true);
  assert.equal(scene.added[0].destroyed, true);
  assert.equal(scene.added[1].stopped, true);
  assert.equal(scene.added[1].destroyed, true);
  assert.equal(storageValues.get('hobo.audio.muted'), 'true');
  await audio.destroy();
});

test('game feedback accepts Phaser EventEmitter payloads', async () => {
  const events = new FakeEmitter();
  const played = [];
  const bubbles = [];
  const unbind = bindGameFeedback(events, {
    eventIds: ['bin-burn'],
    audio: { play: async (eventId) => played.push(eventId) },
    dialogue: { pick: async (_eventId, options) => ({ text: options.characterId }) },
    showBubble: (line) => bubbles.push(line.text)
  });

  events.emit('bin-burn', { characterId: 'qa-engineer' });
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(played, ['bin-burn']);
  assert.deepEqual(bubbles, ['qa-engineer']);

  unbind();
  events.emit('bin-burn', { characterId: 'prompt-engineer' });
  assert.deepEqual(played, ['bin-burn']);
});
