import type Phaser from "phaser";

const DEFAULT_MANIFEST_URL = "/assets/audio/manifest.json";
const DEFAULT_STORAGE_KEY = "hobo.audio.muted";

export type PhaserAudioScene = Pick<
  Phaser.Scene,
  "cache" | "events" | "load" | "sound"
>;

export interface AudioDefaults {
  readonly sfxVolume?: number;
  readonly musicVolume?: number;
  readonly ambienceVolume?: number;
}

export interface AudioEventEntry {
  readonly file?: string;
  readonly files?: readonly string[];
  readonly variantStyles?: readonly string[];
  readonly volume?: number;
  readonly defaultEnabled?: boolean;
  readonly intent?: string;
  readonly priority?: string;
}

export interface AudioTrackEntry {
  readonly file: string;
  readonly loop?: boolean;
  readonly volume?: number;
  readonly intent?: string;
  readonly priority?: string;
  readonly license?: string;
  readonly source?: string;
}

export interface AudioManifest {
  readonly version: number;
  readonly defaults?: AudioDefaults;
  readonly events: Readonly<Record<string, AudioEventEntry>>;
  readonly music?: Readonly<Record<string, AudioTrackEntry>>;
  readonly ambience?: Readonly<Record<string, AudioTrackEntry>>;
  readonly format?: Readonly<Record<string, string>>;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface ManifestResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

type FetchManifest = (url: string) => Promise<ManifestResponse>;

export interface LoadAudioManifestOptions {
  readonly url?: string;
  readonly fetchImpl?: FetchManifest;
}

export interface PhaserAudioOptions {
  readonly storage?: StorageLike;
  readonly storageKey?: string;
  readonly fallback?: (eventId: string) => boolean;
  readonly stopAmbienceOnSceneShutdown?: boolean;
}

export interface PlayOptions {
  readonly volume?: number;
}

export interface PhaserAudioController {
  unlock(): Promise<boolean>;
  play(eventId: string, options?: PlayOptions): Promise<boolean>;
  playAmbience(trackId: string, options?: PlayOptions): Promise<boolean>;
  playMusic(trackId: string, options?: PlayOptions): Promise<boolean>;
  stopAmbience(): boolean;
  stopMusic(): boolean;
  setMuted(muted: boolean): boolean;
  isMuted(): boolean;
  setEventEnabled(eventId: string, enabled: boolean): void;
  setVariantStyle(style: string | null): void;
  destroy(): Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTrackEntry(value: unknown): value is AudioTrackEntry {
  return isRecord(value) && typeof value.file === "string";
}

function isEventEntry(value: unknown): value is AudioEventEntry {
  if (!isRecord(value)) return false;
  if (typeof value.file === "string") return true;
  if (!Array.isArray(value.files) || value.files.length === 0) return false;
  if (!value.files.every((file) => typeof file === "string")) return false;
  return value.variantStyles === undefined || (
    Array.isArray(value.variantStyles)
    && value.variantStyles.length === value.files.length
    && value.variantStyles.every((style) => typeof style === "string")
  );
}

function validateManifest(value: unknown): AudioManifest {
  if (!isRecord(value) || typeof value.version !== "number" || !isRecord(value.events)) {
    throw new TypeError("Audio manifest must contain a numeric version and an events object");
  }
  if (!Object.values(value.events).every(isEventEntry)) {
    throw new TypeError("Audio manifest contains an invalid event entry");
  }
  for (const section of [value.music, value.ambience]) {
    if (section !== undefined && (
      !isRecord(section) || !Object.values(section).every(isTrackEntry)
    )) {
      throw new TypeError("Audio manifest contains an invalid track entry");
    }
  }
  return value as unknown as AudioManifest;
}

export async function loadAudioManifest({
  url = DEFAULT_MANIFEST_URL,
  fetchImpl = globalThis.fetch?.bind(globalThis) as FetchManifest | undefined,
}: LoadAudioManifestOptions = {}): Promise<AudioManifest> {
  if (fetchImpl === undefined) throw new Error("Fetch API is unavailable");
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Audio manifest request failed (${response.status})`);
  }
  return validateManifest(await response.json());
}

const cacheKey = (kind: "sfx" | "music" | "ambience", id: string, variant?: number): string => (
  `hobo:${kind}:${id}${variant === undefined ? "" : `:${variant}`}`
);

function eventFiles(entry: AudioEventEntry): readonly string[] {
  if (entry.files !== undefined) return entry.files;
  return entry.file === undefined ? [] : [entry.file];
}

function browserStorage(): StorageLike | undefined {
  try {
    return globalThis.window?.localStorage;
  } catch {
    return undefined;
  }
}

function readMuted(storage: StorageLike | undefined, key: string): boolean {
  try {
    return storage?.getItem(key) === "true";
  } catch {
    return false;
  }
}

function storeMuted(storage: StorageLike | undefined, key: string, muted: boolean): void {
  try {
    storage?.setItem(key, String(muted));
  } catch {
    // Storage failure must not affect game mechanics.
  }
}

function clampedVolume(base: number, multiplier: number): number {
  return Math.max(0, Math.min(1, Number(base) * Number(multiplier)));
}

export function queuePhaserAudio(
  scene: PhaserAudioScene,
  manifest: AudioManifest,
): string[] {
  const queued: string[] = [];

  for (const [eventId, entry] of Object.entries(manifest.events)) {
    const files = eventFiles(entry);
    files.forEach((file, index) => {
      const key = cacheKey("sfx", eventId, files.length > 1 ? index : undefined);
      scene.load.audio(key, file);
      queued.push(key);
    });
  }
  for (const [trackId, entry] of Object.entries(manifest.music ?? {})) {
    const key = cacheKey("music", trackId);
    scene.load.audio(key, entry.file);
    queued.push(key);
  }
  for (const [trackId, entry] of Object.entries(manifest.ambience ?? {})) {
    const key = cacheKey("ambience", trackId);
    scene.load.audio(key, entry.file);
    queued.push(key);
  }
  return queued;
}

export function createPhaserAudio(
  scene: PhaserAudioScene,
  manifest: AudioManifest,
  {
    storage = browserStorage(),
    storageKey = DEFAULT_STORAGE_KEY,
    fallback,
    stopAmbienceOnSceneShutdown = true,
  }: PhaserAudioOptions = {},
): PhaserAudioController {
  let muted = readMuted(storage, storageKey);
  let activeMusic: Phaser.Sound.BaseSound | undefined;
  let activeMusicTrackId: string | undefined;
  let activeAmbience: Phaser.Sound.BaseSound | undefined;
  let activeAmbienceTrackId: string | undefined;
  let destroyed = false;
  let preferredVariantStyle: string | undefined;
  const variants = new Map<string, number>();
  const enabledOverrides = new Map<string, boolean>();

  scene.sound.setMute(muted);

  const isCached = (key: string): boolean => scene.cache.audio.exists(key);

  const stopAmbience = (): boolean => {
    if (activeAmbience === undefined) return false;
    activeAmbience.stop();
    activeAmbience.destroy();
    activeAmbience = undefined;
    activeAmbienceTrackId = undefined;
    return true;
  };

  const stopMusic = (): boolean => {
    if (activeMusic === undefined) return false;
    activeMusic.stop();
    activeMusic.destroy();
    activeMusic = undefined;
    activeMusicTrackId = undefined;
    return true;
  };

  const onShutdown = (): void => {
    stopMusic();
    if (stopAmbienceOnSceneShutdown) stopAmbience();
  };
  const onSceneDestroy = (): void => {
    stopMusic();
    stopAmbience();
  };

  scene.events.on("shutdown", onShutdown);
  scene.events.on("destroy", onSceneDestroy);

  return {
    async unlock(): Promise<boolean> {
      if (destroyed) return false;
      (scene.sound as unknown as { unlock?: () => void }).unlock?.();
      return true;
    },

    async play(eventId: string, { volume = 1 }: PlayOptions = {}): Promise<boolean> {
      if (eventId.length === 0 || destroyed || muted || scene.sound.locked) return false;
      const entry = manifest.events[eventId];
      if (entry === undefined) {
        try {
          return Boolean(fallback?.(eventId));
        } catch {
          return false;
        }
      }
      const enabled = enabledOverrides.get(eventId) ?? entry.defaultEnabled !== false;
      if (!enabled) return false;

      const files = eventFiles(entry);
      const styledFiles = preferredVariantStyle === undefined || entry.variantStyles === undefined
        ? files.map((file, index) => ({ file, index }))
        : files
          .map((file, index) => ({ file, index, style: entry.variantStyles?.[index] }))
          .filter((candidate) => candidate.style === preferredVariantStyle);
      const candidates = styledFiles.length > 0
        ? styledFiles
        : files.map((file, index) => ({ file, index }));
      if (candidates.length === 0) return false;

      const variantIndex = variants.get(eventId) ?? 0;
      variants.set(eventId, variantIndex + 1);
      const selected = candidates[variantIndex % candidates.length];
      const key = cacheKey("sfx", eventId, files.length > 1 ? selected.index : undefined);
      if (!isCached(key)) return false;
      return scene.sound.play(key, {
        volume: clampedVolume(entry.volume ?? manifest.defaults?.sfxVolume ?? 1, volume),
      });
    },

    async playAmbience(trackId: string, { volume = 1 }: PlayOptions = {}): Promise<boolean> {
      if (trackId.length === 0 || destroyed || muted || scene.sound.locked) return false;
      if (activeAmbienceTrackId === trackId) return true;
      const entry = manifest.ambience?.[trackId];
      const key = cacheKey("ambience", trackId);
      if (entry === undefined || !isCached(key)) return false;

      stopAmbience();
      activeAmbience = scene.sound.add(key, {
        loop: entry.loop !== false,
        volume: clampedVolume(
          entry.volume ?? manifest.defaults?.ambienceVolume ?? 0.16,
          volume,
        ),
      });
      activeAmbienceTrackId = trackId;
      if (!activeAmbience.play()) {
        stopAmbience();
        return false;
      }
      return true;
    },

    async playMusic(trackId: string, { volume = 1 }: PlayOptions = {}): Promise<boolean> {
      if (trackId.length === 0 || destroyed || muted || scene.sound.locked) return false;
      if (activeMusicTrackId === trackId) return true;
      const entry = manifest.music?.[trackId];
      const key = cacheKey("music", trackId);
      if (entry === undefined || !isCached(key)) return false;

      stopMusic();
      const instance = scene.sound.add(key, {
        loop: entry.loop === true,
        volume: clampedVolume(
          entry.volume ?? manifest.defaults?.musicVolume ?? 0.28,
          volume,
        ),
      });
      activeMusic = instance;
      activeMusicTrackId = trackId;
      instance.once("complete", () => {
        if (activeMusic !== instance) return;
        instance.destroy();
        activeMusic = undefined;
        activeMusicTrackId = undefined;
      });
      if (!instance.play()) {
        stopMusic();
        return false;
      }
      return true;
    },

    stopAmbience,
    stopMusic,

    setMuted(nextMuted: boolean): boolean {
      muted = Boolean(nextMuted);
      if (muted) {
        stopMusic();
        stopAmbience();
      }
      scene.sound.setMute(muted);
      storeMuted(storage, storageKey, muted);
      return muted;
    },

    isMuted(): boolean {
      return muted;
    },

    setEventEnabled(eventId: string, enabled: boolean): void {
      enabledOverrides.set(eventId, Boolean(enabled));
    },

    setVariantStyle(style: string | null): void {
      preferredVariantStyle = style || undefined;
      variants.clear();
    },

    async destroy(): Promise<void> {
      destroyed = true;
      stopMusic();
      stopAmbience();
      scene.events.off("shutdown", onShutdown);
      scene.events.off("destroy", onSceneDestroy);
    },
  };
}
