export const GAME_EVENT_IDS = Object.freeze([
  'loose-bottle-collected',
  'bin-bottles',
  'bin-burn',
  'bottles-redeemed',
  'food-bought',
  'food-denied',
  'day-failed',
  'day-survived',
  'won',
  'lost',
  'ui-start',
  'step',
  'day-night-sting'
]);

export const DIALOGUE_EVENT_IDS = Object.freeze([
  'character-intro',
  'bin-bottles',
  'bin-burn',
  'food-bought',
  'food-denied',
  'day-failed',
  'won',
  'lost'
]);

export const GAME_FEEDBACK_EVENT_IDS = Object.freeze([
  ...new Set([...GAME_EVENT_IDS, ...DIALOGUE_EVENT_IDS])
]);

const AUDIO_EVENTS = new Set(GAME_EVENT_IDS);
const BUBBLE_EVENTS = new Set(DIALOGUE_EVENT_IDS);

/**
 * Connects named mechanics events to sound and optional bubble rendering.
 * Returns an unsubscribe function so restart/teardown cannot duplicate hooks.
 */
export function bindGameFeedback(eventTarget, {
  audio,
  dialogue,
  showBubble,
  locale = 'en',
  random = Math.random,
  eventIds = GAME_FEEDBACK_EVENT_IDS
} = {}) {
  const usesDomEvents = Boolean(eventTarget?.addEventListener && eventTarget?.removeEventListener);
  const add = usesDomEvents
    ? (eventId, listener) => eventTarget.addEventListener(eventId, listener)
    : eventTarget?.on && eventTarget?.off
      ? (eventId, listener) => eventTarget.on(eventId, listener)
      : null;
  const remove = usesDomEvents
    ? (eventId, listener) => eventTarget.removeEventListener(eventId, listener)
    : eventTarget?.on && eventTarget?.off
      ? (eventId, listener) => eventTarget.off(eventId, listener)
      : null;
  if (!add || !remove) throw new TypeError('eventTarget must be a DOM EventTarget or Phaser EventEmitter');

  let active = true;
  let bubbleSequence = 0;
  const listeners = new Map();

  for (const eventId of eventIds) {
    const listener = (eventOrDetail) => {
      const detail = usesDomEvents ? eventOrDetail?.detail : eventOrDetail;
      if (AUDIO_EVENTS.has(eventId)) void audio?.play?.(eventId);
      if (!dialogue?.pick || !showBubble || !BUBBLE_EVENTS.has(eventId)) return;

      const sequence = ++bubbleSequence;
      void dialogue.pick(eventId, {
        locale: typeof locale === 'function' ? locale() : locale,
        characterId: detail?.characterId,
        random
      }).then((line) => {
        if (active && sequence === bubbleSequence && line) showBubble(line, detail);
      }).catch(() => {});
    };
    listeners.set(eventId, listener);
    add(eventId, listener);
  }

  return () => {
    active = false;
    bubbleSequence += 1;
    for (const [eventId, listener] of listeners) remove(eventId, listener);
  };
}
