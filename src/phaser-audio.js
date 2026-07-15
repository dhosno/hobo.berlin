const DEFAULT_STORAGE_KEY = 'hobo.audio.muted';
const keyFor = (kind, id, variant) => `hobo:${kind}:${id}${variant == null ? '' : `:${variant}`}`;

function readMuted(storage, key) {
  try {
    return storage?.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function storeMuted(storage, key, muted) {
  try {
    storage?.setItem(key, String(muted));
  } catch {
    // Sandboxed browsers can deny storage without disabling game audio.
  }
}

function browserStorage() {
  try {
    return globalThis.window?.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Call from a Phaser Scene preload() with the parsed audio manifest.
 * Phaser owns fetching, decoding, codec fallback, and its global audio cache.
 */
export function queuePhaserAudio(scene, manifest) {
  if (!scene?.load?.audio) throw new TypeError('A Phaser Scene with the Loader plugin is required');
  const queued = [];

  for (const [eventId, entry] of Object.entries(manifest.events || {})) {
    const files = entry.files || [entry.file];
    files.filter(Boolean).forEach((file, index) => {
      const key = keyFor('sfx', eventId, files.length > 1 ? index : undefined);
      scene.load.audio(key, file);
      queued.push(key);
    });
  }
  for (const [trackId, entry] of Object.entries(manifest.music || {})) {
    const key = keyFor('music', trackId);
    scene.load.audio(key, entry.file);
    queued.push(key);
  }
  for (const [trackId, entry] of Object.entries(manifest.ambience || {})) {
    const key = keyFor('ambience', trackId);
    scene.load.audio(key, entry.file);
    queued.push(key);
  }
  return queued;
}

/** Phaser-native audio facade; use this instead of creating a second AudioContext. */
export function createPhaserAudio(scene, manifest, {
  storage = browserStorage(),
  storageKey = DEFAULT_STORAGE_KEY,
  fallback,
  stopAmbienceOnSceneShutdown = true
} = {}) {
  if (!scene?.sound) throw new TypeError('A Phaser Scene with the Sound plugin is required');
  let muted = readMuted(storage, storageKey);
  let activeMusic;
  let activeMusicTrackId;
  let activeAmbience;
  let activeAmbienceTrackId;
  let destroyed = false;
  let preferredVariantStyle;
  const variants = new Map();
  const enabledOverrides = new Map();

  scene.sound.setMute?.(muted);

  function cached(key) {
    return scene.cache?.audio?.exists ? scene.cache.audio.exists(key) : true;
  }

  function stopAmbience() {
    if (!activeAmbience) return false;
    activeAmbience.stop?.();
    activeAmbience.destroy?.();
    activeAmbience = undefined;
    activeAmbienceTrackId = undefined;
    return true;
  }

  function stopMusic() {
    if (!activeMusic) return false;
    activeMusic.stop?.();
    activeMusic.destroy?.();
    activeMusic = undefined;
    activeMusicTrackId = undefined;
    return true;
  }

  function onShutdown() {
    stopMusic();
    if (stopAmbienceOnSceneShutdown) stopAmbience();
  }

  function onSceneDestroy() {
    stopMusic();
    stopAmbience();
  }

  scene.events?.on?.('shutdown', onShutdown);
  scene.events?.on?.('destroy', onSceneDestroy);

  return {
    /** Phaser also unlocks automatically on the first game gesture. */
    async unlock() {
      if (destroyed) return false;
      scene.sound.unlock?.();
      return true;
    },

    async play(eventId, { volume = 1 } = {}) {
      if (!eventId || destroyed || muted || scene.sound.locked) return false;
      const entry = manifest.events?.[eventId];
      if (!entry) {
        try {
          return Boolean(fallback?.(eventId));
        } catch {
          return false;
        }
      }
      const enabled = enabledOverrides.has(eventId)
        ? enabledOverrides.get(eventId)
        : entry.defaultEnabled !== false;
      if (!enabled) return false;

      const allFiles = entry.files || [entry.file];
      const candidates = preferredVariantStyle && entry.variantStyles
        ? allFiles
          .map((file, index) => ({ file, index, style: entry.variantStyles[index] }))
          .filter((variant) => variant.style === preferredVariantStyle)
        : allFiles.map((file, index) => ({ file, index }));
      const available = candidates.length ? candidates : allFiles.map((file, index) => ({ file, index }));
      const index = variants.get(eventId) || 0;
      variants.set(eventId, index + 1);
      const selected = available[index % available.length];
      const key = keyFor('sfx', eventId, allFiles.length > 1 ? selected.index : undefined);
      if (!cached(key)) return false;
      const played = scene.sound.play(key, {
        volume: Math.max(0, Math.min(1,
          Number(entry.volume ?? manifest.defaults?.sfxVolume ?? 1) * Number(volume)
        ))
      });
      return played !== false;
    },

    async playAmbience(trackId, { volume = 1 } = {}) {
      if (!trackId || destroyed || muted || scene.sound.locked) return false;
      if (activeAmbienceTrackId === trackId) return true;
      const entry = manifest.ambience?.[trackId];
      const key = keyFor('ambience', trackId);
      if (!entry || !cached(key)) return false;

      stopAmbience();
      activeAmbience = scene.sound.add(key, {
        loop: entry.loop !== false,
        volume: Math.max(0, Math.min(1,
          Number(entry.volume ?? manifest.defaults?.ambienceVolume ?? 0.16) * Number(volume)
        ))
      });
      activeAmbienceTrackId = trackId;
      const played = activeAmbience.play();
      if (played === false) {
        stopAmbience();
        return false;
      }
      return true;
    },

    async playMusic(trackId, { volume = 1 } = {}) {
      if (!trackId || destroyed || muted || scene.sound.locked) return false;
      if (activeMusicTrackId === trackId) return true;
      const entry = manifest.music?.[trackId];
      const key = keyFor('music', trackId);
      if (!entry || !cached(key)) return false;

      stopMusic();
      const instance = scene.sound.add(key, {
        loop: entry.loop === true,
        volume: Math.max(0, Math.min(1,
          Number(entry.volume ?? manifest.defaults?.musicVolume ?? 0.28) * Number(volume)
        ))
      });
      activeMusic = instance;
      activeMusicTrackId = trackId;
      instance.once?.('complete', () => {
        if (activeMusic !== instance) return;
        instance.destroy?.();
        activeMusic = undefined;
        activeMusicTrackId = undefined;
      });
      const played = instance.play();
      if (played === false) {
        stopMusic();
        return false;
      }
      return true;
    },

    stopAmbience,
    stopMusic,

    setMuted(nextMuted) {
      muted = Boolean(nextMuted);
      if (muted) stopMusic();
      if (muted) stopAmbience();
      scene.sound.setMute?.(muted);
      storeMuted(storage, storageKey, muted);
      return muted;
    },

    isMuted() {
      return muted;
    },

    setEventEnabled(eventId, enabled) {
      enabledOverrides.set(eventId, Boolean(enabled));
    },

    /** Use null for round-robin across all variants, or select a manifest style. */
    setVariantStyle(style) {
      preferredVariantStyle = style || undefined;
      variants.clear();
    },

    async destroy() {
      destroyed = true;
      stopMusic();
      stopAmbience();
      scene.events?.off?.('shutdown', onShutdown);
      scene.events?.off?.('destroy', onSceneDestroy);
    }
  };
}
