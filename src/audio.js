const DEFAULT_MANIFEST_URL = '/assets/audio/manifest.json';
const DEFAULT_STORAGE_KEY = 'hobo.audio.muted';

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
    // Storage can be unavailable in private browsing or sandboxed iframes.
  }
}

function browserAudioContext() {
  return globalThis.AudioContext || globalThis.webkitAudioContext;
}

function browserStorage() {
  try {
    return globalThis.window?.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Small, lazy Web Audio player for semantic game events.
 *
 * Call unlock() synchronously from the Start button handler. All other methods
 * are safe no-ops when audio, an asset, or browser storage is unavailable.
 */
export function createAudio({
  manifestUrl = DEFAULT_MANIFEST_URL,
  fetchImpl = globalThis.fetch?.bind(globalThis),
  AudioContextClass = browserAudioContext(),
  storage = browserStorage(),
  storageKey = DEFAULT_STORAGE_KEY,
  fallback,
  logger = globalThis.console
} = {}) {
  let context;
  let manifestPromise;
  let muted = readMuted(storage, storageKey);
  let unlocked = false;
  let destroyed = false;
  let preferredVariantStyle;
  let activeAmbience;
  let ambienceRequest = 0;
  let activeMusic;
  let musicRequest = 0;
  const buffers = new Map();
  const enabledOverrides = new Map();
  const variantIndexes = new Map();
  const warned = new Set();

  function warnOnce(key, error) {
    if (warned.has(key)) return;
    warned.add(key);
    logger?.warn?.(`[audio] ${key}`, error);
  }

  function runFallback(eventId, error) {
    if (!fallback || muted || destroyed) return false;
    try {
      return Boolean(fallback(eventId, error));
    } catch (fallbackError) {
      warnOnce(`fallback failed for "${eventId}"`, fallbackError);
      return false;
    }
  }

  async function loadManifest() {
    if (!fetchImpl) throw new Error('Fetch API is unavailable');
    manifestPromise ||= (async () => {
      const response = await fetchImpl(manifestUrl);
      if (!response?.ok) throw new Error(`Manifest request failed (${response?.status ?? 'unknown'})`);
      return response.json();
    })().catch((error) => {
      manifestPromise = undefined;
      throw error;
    });
    return manifestPromise;
  }

  async function loadBuffer(file) {
    if (!buffers.has(file)) {
      buffers.set(file, (async () => {
        const response = await fetchImpl(file);
        if (!response?.ok) throw new Error(`Audio request failed (${response?.status ?? 'unknown'}): ${file}`);
        return context.decodeAudioData(await response.arrayBuffer());
      })().catch((error) => {
        buffers.delete(file);
        throw error;
      }));
    }
    return buffers.get(file);
  }

  function selectFile(eventId, entry) {
    if (entry.file) return entry.file;
    if (!entry.files?.length) return undefined;
    const candidates = preferredVariantStyle && entry.variantStyles
      ? entry.files
        .map((file, index) => ({ file, style: entry.variantStyles[index] }))
        .filter((variant) => variant.style === preferredVariantStyle)
        .map((variant) => variant.file)
      : entry.files;
    const files = candidates.length ? candidates : entry.files;
    const index = variantIndexes.get(eventId) || 0;
    variantIndexes.set(eventId, index + 1);
    return files[index % files.length];
  }

  function stopAmbience() {
    ambienceRequest += 1;
    if (!activeAmbience) return false;
    try {
      activeAmbience.source.stop();
    } catch {
      // A source may already have ended or been stopped.
    }
    activeAmbience = undefined;
    return true;
  }

  function stopMusic() {
    musicRequest += 1;
    if (!activeMusic) return false;
    try {
      activeMusic.source.stop();
    } catch {
      // Already ended.
    }
    activeMusic = undefined;
    return true;
  }

  return {
    /** Must be invoked by the Start click/tap so browser autoplay rules are met. */
    async unlock() {
      if (destroyed) return false;
      unlocked = true;
      try {
        if (!context) {
          if (!AudioContextClass) return false;
          context = new AudioContextClass();
        }
        const resume = context.state === 'suspended' ? context.resume() : Promise.resolve();
        // Begin the tiny manifest request during the gesture, but do not block Start.
        void loadManifest().catch((error) => warnOnce('manifest preload failed', error));
        await resume;
        return true;
      } catch (error) {
        warnOnce('audio unlock failed', error);
        return false;
      }
    },

    /** Plays one semantic event and resolves false instead of disrupting gameplay. */
    async play(eventId, { volume = 1 } = {}) {
      if (!eventId || destroyed || muted || !unlocked) return false;
      if (!context) return runFallback(eventId, new Error('Audio context is unavailable'));

      try {
        const manifest = await loadManifest();
        const entry = manifest.events?.[eventId];
        if (!entry) return runFallback(eventId, new Error(`No asset mapped for "${eventId}"`));

        const enabled = enabledOverrides.has(eventId)
          ? enabledOverrides.get(eventId)
          : entry.defaultEnabled !== false;
        if (!enabled) return false;

        const file = selectFile(eventId, entry);
        if (!file) return runFallback(eventId, new Error(`No file mapped for "${eventId}"`));
        const buffer = await loadBuffer(file);
        if (destroyed || muted || !unlocked) return false;
        if (context.state === 'suspended') await context.resume();

        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        gain.gain.value = Math.max(0, Math.min(1,
          Number(entry.volume ?? manifest.defaults?.sfxVolume ?? 1) * Number(volume)
        ));
        source.connect(gain).connect(context.destination);
        source.start();
        return true;
      } catch (error) {
        warnOnce(`play failed for "${eventId}"`, error);
        return runFallback(eventId, error);
      }
    },

    /** Starts one manifest ambience loop, replacing the current ambience. */
    async playAmbience(trackId, { volume = 1 } = {}) {
      if (!trackId || destroyed || muted || !unlocked || !context) return false;
      if (activeAmbience?.trackId === trackId) return true;
      const request = ++ambienceRequest;

      try {
        const manifest = await loadManifest();
        const entry = manifest.ambience?.[trackId];
        if (!entry?.file) return false;
        const buffer = await loadBuffer(entry.file);
        if (request !== ambienceRequest || destroyed || muted || !unlocked) return false;
        if (context.state === 'suspended') await context.resume();

        stopAmbience();
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        source.loop = entry.loop !== false;
        gain.gain.value = Math.max(0, Math.min(1,
          Number(entry.volume ?? manifest.defaults?.ambienceVolume ?? 0.16) * Number(volume)
        ));
        source.connect(gain).connect(context.destination);
        source.start();
        activeAmbience = { source, gain, trackId };
        return true;
      } catch (error) {
        warnOnce(`ambience failed for "${trackId}"`, error);
        return false;
      }
    },

    /** Plays one non-looping music sting from the manifest. */
    async playMusic(trackId, { volume = 1 } = {}) {
      if (!trackId || destroyed || muted || !unlocked || !context) return false;
      if (activeMusic?.trackId === trackId) return true;
      const request = ++musicRequest;

      try {
        const manifest = await loadManifest();
        const entry = manifest.music?.[trackId];
        if (!entry?.file) return false;
        const buffer = await loadBuffer(entry.file);
        if (request !== musicRequest || destroyed || muted || !unlocked) return false;
        if (context.state === 'suspended') await context.resume();

        stopMusic();
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        source.loop = entry.loop === true;
        gain.gain.value = Math.max(0, Math.min(1,
          Number(entry.volume ?? manifest.defaults?.musicVolume ?? 0.28) * Number(volume)
        ));
        source.connect(gain).connect(context.destination);
        source.onended = () => {
          if (activeMusic?.source === source) activeMusic = undefined;
        };
        source.start();
        activeMusic = { source, gain, trackId };
        return true;
      } catch (error) {
        warnOnce(`music failed for "${trackId}"`, error);
        return false;
      }
    },

    stopAmbience,
    stopMusic,

    setMuted(nextMuted) {
      muted = Boolean(nextMuted);
      if (muted) {
        stopAmbience();
        stopMusic();
      }
      storeMuted(storage, storageKey, muted);
      return muted;
    },

    isMuted() {
      return muted;
    },

    /** Opts low-frequency events such as footsteps in or out at runtime. */
    setEventEnabled(eventId, enabled) {
      enabledOverrides.set(eventId, Boolean(enabled));
    },

    /** Use null for all variants, or e.g. "modern-16bit" for one sound style. */
    setVariantStyle(style) {
      preferredVariantStyle = style || undefined;
      variantIndexes.clear();
    },

    async destroy() {
      destroyed = true;
      unlocked = false;
      stopAmbience();
      stopMusic();
      buffers.clear();
      if (context?.close) await context.close().catch(() => {});
    }
  };
}
