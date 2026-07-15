import { describe, expect, it } from "vitest";

import {
  createPhaserAudio,
  loadAudioManifest,
  queuePhaserAudio,
  type AudioManifest,
  type PhaserAudioScene,
} from "../../src/game/audio/phaser-audio";

class FakeEmitter {
  private readonly listeners = new Map<string, Set<() => void>>();

  on(type: string, listener: () => void): this {
    const listeners = this.listeners.get(type) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    return this;
  }

  off(type: string, listener: () => void): this {
    this.listeners.get(type)?.delete(listener);
    return this;
  }

  emit(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

function createManifest(): AudioManifest {
  return {
    version: 1,
    defaults: { sfxVolume: 0.72, musicVolume: 0.28, ambienceVolume: 0.16 },
    events: {
      "heart-lost": {
        files: ["/funny.wav", "/drunk.wav", "/dark.wav"],
        variantStyles: ["funny", "drunk", "dark"],
        volume: 0.68,
      },
    },
    music: {
      intro: { file: "/intro.wav", loop: false, volume: 0.3 },
    },
    ambience: {
      berlin: { file: "/berlin.ogg", loop: true, volume: 0.14 },
    },
  };
}

function createFakeScene() {
  const queued: Array<{ key: string; file: string }> = [];
  const played: Array<{ key: string; volume: number }> = [];
  const added: Array<{
    key: string;
    config: { loop?: boolean; volume?: number };
    stopped: boolean;
    destroyed: boolean;
  }> = [];
  const events = new FakeEmitter();
  const sound = {
    locked: false,
    muted: false,
    setMute(value: boolean) {
      this.muted = value;
    },
    unlock() {},
    play(key: string, config: { volume?: number }) {
      played.push({ key, volume: config.volume ?? 1 });
      return true;
    },
    add(key: string, config: { loop?: boolean; volume?: number }) {
      const instance = {
        key,
        config,
        stopped: false,
        destroyed: false,
        play: () => true,
        stop() {
          instance.stopped = true;
        },
        destroy() {
          instance.destroyed = true;
        },
        once() {},
      };
      added.push(instance);
      return instance;
    },
  };
  const scene = {
    load: { audio: (key: string, file: string) => queued.push({ key, file }) },
    cache: { audio: { exists: () => true } },
    sound,
    events,
  } as unknown as PhaserAudioScene;

  return { scene, queued, played, added, events, sound };
}

describe("Phaser audio adapter", () => {
  it("loads and validates the public manifest without blocking a Scene", async () => {
    const manifest = createManifest();
    const loaded = await loadAudioManifest({
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => manifest }),
    });

    expect(loaded).toEqual(manifest);
  });

  it("queues stable Phaser cache keys for SFX, music, and ambience", () => {
    const { scene, queued } = createFakeScene();
    const keys = queuePhaserAudio(scene, createManifest());

    expect(keys).toEqual([
      "hobo:sfx:heart-lost:0",
      "hobo:sfx:heart-lost:1",
      "hobo:sfx:heart-lost:2",
      "hobo:music:intro",
      "hobo:ambience:berlin",
    ]);
    expect(queued).toHaveLength(5);
  });

  it("selects a named heart style and remains mute-safe", async () => {
    const { scene, played, sound } = createFakeScene();
    const storage = new Map<string, string>();
    const audio = createPhaserAudio(scene, createManifest(), {
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
    });

    audio.setVariantStyle("dark");
    expect(await audio.unlock()).toBe(true);
    expect(await audio.play("heart-lost")).toBe(true);
    expect(played).toEqual([{ key: "hobo:sfx:heart-lost:2", volume: 0.68 }]);

    expect(audio.setMuted(true)).toBe(true);
    expect(sound.muted).toBe(true);
    expect(storage.get("hobo.audio.muted")).toBe("true");
    expect(await audio.play("heart-lost")).toBe(false);
  });
});
