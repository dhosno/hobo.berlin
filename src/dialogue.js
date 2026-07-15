const DEFAULT_BASE_URL = '/assets/audio';

function normalizeLocale(locale, fallback) {
  const language = String(locale || fallback).toLowerCase().split('-')[0];
  return /^[a-z]{2,3}$/.test(language) ? language : fallback;
}

function weightedPick(lines, random) {
  const weighted = lines.map((line) => ({ line, weight: Math.max(0, Number(line.weight ?? 1)) }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return lines[0] || null;
  let cursor = Math.max(0, Math.min(0.999999999, Number(random()))) * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor < 0) return item.line;
  }
  return weighted.at(-1)?.line || null;
}

/** Loads short bubble copy by locale and selects weighted event variants. */
export function createDialogue({
  baseUrl = DEFAULT_BASE_URL,
  defaultLocale = 'en',
  fetchImpl = globalThis.fetch?.bind(globalThis),
  logger = globalThis.console
} = {}) {
  const fallbackLocale = normalizeLocale(defaultLocale, 'en');
  const cache = new Map();
  const warned = new Set();

  async function load(locale) {
    const normalized = normalizeLocale(locale, fallbackLocale);
    if (!fetchImpl) throw new Error('Fetch API is unavailable');
    if (!cache.has(normalized)) {
      const url = `${baseUrl}/dialogue-lines.${normalized}.json`;
      cache.set(normalized, (async () => {
        const response = await fetchImpl(url);
        if (!response?.ok) throw new Error(`Dialogue request failed (${response?.status ?? 'unknown'}): ${url}`);
        const lines = await response.json();
        if (!Array.isArray(lines)) throw new Error(`Dialogue data must be an array: ${url}`);
        return lines;
      })().catch((error) => {
        cache.delete(normalized);
        throw error;
      }));
    }
    return cache.get(normalized);
  }

  async function safelyLoad(locale) {
    try {
      return await load(locale);
    } catch (error) {
      const key = normalizeLocale(locale, fallbackLocale);
      if (!warned.has(key)) {
        warned.add(key);
        logger?.warn?.(`[dialogue] Could not load locale "${key}"`, error);
      }
      return null;
    }
  }

  return {
    load,

    async pick(eventId, { locale = fallbackLocale, characterId, random = Math.random } = {}) {
      const requested = normalizeLocale(locale, fallbackLocale);
      let lines = await safelyLoad(requested);
      if (!lines && requested !== fallbackLocale) lines = await safelyLoad(fallbackLocale);
      if (!lines) return null;

      const candidates = lines.filter((line) => (
        line.event === eventId && (!line.characterId || line.characterId === characterId)
      ));
      return weightedPick(candidates, random);
    }
  };
}
