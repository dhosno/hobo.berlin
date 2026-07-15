import {
  BOTTLE_VALUE_CENTS,
  CHARACTERS,
  COUNTDOWN_SECONDS,
  DAMAGE_BIN_HAZARD,
  DAMAGE_MISSED_MEAL,
  DAY_DURATION_MS,
  DAYS_PER_RUN,
  DONER_WAIT_MAX_MS,
  DONER_WAIT_MIN_MS,
  MAX_HEALTH_UNITS,
  MEAL_VENDOR_NAME,
  MINIMUM_BOTTLES_TO_REDEEM,
  REWE_WAIT_MAX_MS,
  REWE_WAIT_MIN_MS,
  STARTING_CASH_CENTS,
} from "../config";
import type { Direction } from "../grid/movement";
import { moveGridPosition } from "../grid/movement";
import type { ParsedMapContract } from "../map/tiled-contract";
import { dayBalance, rollMealPriceCents } from "./day-balance";
import { createRng, randomSeed } from "./rng";
import type {
  GameEvent,
  GamePhase,
  GameState,
  VenueWaitState,
  WorldItem,
} from "./types";
import {
  balanceDayEconomy,
  isAdjacentToItem,
  itemAt,
  movementBlockedSet,
  nearestInteractable,
  spawnDailyCollectibles,
  worldFromParsedMap,
} from "./world";

const idleVenue = (): VenueWaitState => ({
  kind: "none",
  remainingMs: 0,
  totalMs: 0,
  bottlesBefore: 0,
  cashBefore: 0,
  fedBefore: false,
});

function emit(state: GameState, event: GameEvent, toast?: string): GameState {
  return {
    ...state,
    lastEvents: [...state.lastEvents, event].slice(-12),
    toast: toast ?? state.toast,
  };
}

export function formatHearts(units: number): string {
  const clamped = Math.max(0, Math.min(MAX_HEALTH_UNITS, units));
  let out = "";
  for (let i = 0; i < 3; i += 1) {
    const slice = clamped - i * 2;
    if (slice >= 2) out += "♥";
    else if (slice === 1) out += "◔";
    else out += "♡";
  }
  return out;
}

export function formatCash(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export function phaseLabel(state: GameState): string {
  if (state.venue.kind === "rewe-wait") return "Waiting · REWE";
  if (state.venue.kind === "food-wait") return `Waiting · ${MEAL_VENDOR_NAME}`;
  switch (state.phase) {
    case "instructions":
      return "Instructions";
    case "day-ready":
      return "Ready";
    case "night":
      return "Night";
    case "dawn":
      return "Dawn";
    case "countdown":
      return "Get ready";
    case "playing":
      return "Playing";
    case "day-resolution":
      return "Day over";
    case "won":
      return "Won";
    case "lost":
      return "Lost";
  }
}

function canControl(state: GameState): boolean {
  return state.phase === "playing" && state.venue.kind === "none";
}

function prepareDay(state: GameState, day: number): GameState {
  const daySeed = `${state.runSeed}:day-${day}`;
  const rng = createRng(daySeed);
  const balance = dayBalance(day);
  const mealPriceCents = rollMealPriceCents(balance, rng);

  let items = spawnDailyCollectibles(state.world, rng, balance);
  items = balanceDayEconomy(
    items,
    mealPriceCents,
    state.player.cashCents,
    state.player.bottles,
    balance,
  );

  return {
    ...state,
    day,
    daySeed,
    mealPriceCents,
    fedToday: false,
    timeRemainingMs: DAY_DURATION_MS,
    venue: idleVenue(),
    focusedItemId: null,
    toast: "",
    world: { ...state.world, items },
    player: {
      ...state.player,
      position: { ...state.world.spawn },
    },
  };
}

export function createInitialState(
  map: ParsedMapContract,
  seed = randomSeed(),
): GameState {
  const rng = createRng(seed);
  const character = rng.pick(CHARACTERS);
  const world = worldFromParsedMap(map);

  const base: GameState = {
    phase: "instructions",
    day: 1,
    timeRemainingMs: DAY_DURATION_MS,
    fedToday: false,
    mealPriceCents: dayBalance(1).mealMinCents,
    player: {
      characterId: character.id,
      position: { ...world.spawn },
      healthUnits: MAX_HEALTH_UNITS,
      bottles: 0,
      cashCents: STARTING_CASH_CENTS,
    },
    world,
    runSeed: seed,
    daySeed: `${seed}:day-1`,
    venue: idleVenue(),
    focusedItemId: null,
    toast: "",
    lastEvents: [],
  };

  return prepareDay(base, 1);
}

export function restartRun(map: ParsedMapContract): GameState {
  return createInitialState(map);
}

export function beginDaySequence(state: GameState): GameState {
  if (state.phase !== "instructions" && state.phase !== "day-ready") {
    return state;
  }
  return emit({ ...state, phase: "night", toast: "" }, "night-started");
}

export function advancePrePlayPhase(state: GameState): GameState {
  if (state.phase === "night") {
    return emit({ ...state, phase: "dawn" }, "day-started");
  }
  if (state.phase === "dawn") {
    return emit({ ...state, phase: "countdown" }, "countdown-tick", "3");
  }
  return state;
}

export function tickCountdown(state: GameState, secondsLeft: number): GameState {
  if (state.phase !== "countdown") return state;
  if (secondsLeft > 0) {
    return emit({ ...state }, "countdown-tick", String(secondsLeft));
  }
  return {
    ...state,
    phase: "playing",
    timeRemainingMs: DAY_DURATION_MS,
    toast: "Go!",
  };
}

function collectLooseBottle(state: GameState, item: WorldItem): GameState {
  return emit(
    {
      ...state,
      player: {
        ...state.player,
        bottles: state.player.bottles + 1,
      },
      world: {
        ...state.world,
        items: state.world.items.filter((i) => i.id !== item.id),
      },
    },
    "loose-bottle-collected",
    "+1 bottle",
  );
}

export function tryMove(state: GameState, direction: Direction): GameState {
  if (!canControl(state)) return state;

  const next = moveGridPosition(
    state.player.position,
    direction,
    { columns: state.world.columns, rows: state.world.rows },
    movementBlockedSet(state.world),
  );
  if (next === state.player.position) return state;

  let nextState: GameState = {
    ...state,
    player: { ...state.player, position: next },
    focusedItemId: null,
    toast: "",
  };

  const standing = itemAt(nextState.world, next);
  if (standing?.type === "loose-bottle") {
    nextState = collectLooseBottle(nextState, standing);
  }
  return nextState;
}

function searchBin(state: GameState, item: WorldItem): GameState {
  if (item.state === "depleted") {
    return { ...state, toast: "Already searched" };
  }

  const rng = createRng(`${state.daySeed}:bin:${item.id}:resolve`);
  const burns = rng.chance(item.hazardChance ?? 0.1);
  const items = state.world.items.map((i) =>
    i.id === item.id ? { ...i, state: "depleted" as const } : i,
  );

  if (burns) {
    const healthUnits = Math.max(
      0,
      state.player.healthUnits - DAMAGE_BIN_HAZARD,
    );
    let next = emit(
      {
        ...state,
        player: { ...state.player, healthUnits },
        world: { ...state.world, items },
        focusedItemId: null,
      },
      "bin-burn",
      "Burn! −½ ♥",
    );
    if (healthUnits <= 0) {
      next = emit({ ...next, phase: "lost" }, "lost", "Game over");
    }
    return next;
  }

  const gained = item.yieldBottles ?? 1;
  return emit(
    {
      ...state,
      player: {
        ...state.player,
        bottles: state.player.bottles + gained,
      },
      world: { ...state.world, items },
      focusedItemId: null,
    },
    "bin-bottles",
    gained === 1 ? "+1 bottle" : `+${gained} bottles`,
  );
}

function startRewe(state: GameState): GameState {
  if (state.player.bottles < MINIMUM_BOTTLES_TO_REDEEM) {
    return emit(
      state,
      "rewe-denied",
      `Need ${MINIMUM_BOTTLES_TO_REDEEM} bottles`,
    );
  }
  const rng = createRng(
    `${state.daySeed}:rewe:${state.timeRemainingMs}:${state.player.bottles}`,
  );
  const totalMs = rng.int(REWE_WAIT_MIN_MS, REWE_WAIT_MAX_MS);
  return emit(
    {
      ...state,
      venue: {
        kind: "rewe-wait",
        remainingMs: totalMs,
        totalMs,
        bottlesBefore: state.player.bottles,
        cashBefore: state.player.cashCents,
        fedBefore: state.fedToday,
      },
      focusedItemId: null,
    },
    "rewe-wait-started",
    "Queue at REWE…",
  );
}

function startFood(state: GameState): GameState {
  if (state.fedToday) return emit(state, "food-denied", "Already fed today");
  if (state.player.cashCents < state.mealPriceCents) {
    return emit(state, "food-denied", "Not enough cash");
  }
  const rng = createRng(
    `${state.daySeed}:food:${state.timeRemainingMs}:${state.player.cashCents}`,
  );
  const totalMs = rng.int(DONER_WAIT_MIN_MS, DONER_WAIT_MAX_MS);
  return emit(
    {
      ...state,
      venue: {
        kind: "food-wait",
        remainingMs: totalMs,
        totalMs,
        bottlesBefore: state.player.bottles,
        cashBefore: state.player.cashCents,
        fedBefore: state.fedToday,
      },
      focusedItemId: null,
    },
    "food-wait-started",
    `Waiting for ${MEAL_VENDOR_NAME}…`,
  );
}

function completeRewe(state: GameState): GameState {
  const bottles = state.venue.bottlesBefore;
  const gainedCents = bottles * BOTTLE_VALUE_CENTS;
  const cash = state.venue.cashBefore + gainedCents;
  let next = emit(
    {
      ...state,
      player: { ...state.player, bottles: 0, cashCents: cash },
      venue: idleVenue(),
    },
    "bottles-depositing",
  );
  return emit(
    next,
    "cash-received",
    `−${bottles} bottles · +${formatCash(gainedCents)}`,
  );
}

function completeFood(state: GameState): GameState {
  return emit(
    {
      ...state,
      player: {
        ...state.player,
        cashCents: state.venue.cashBefore - state.mealPriceCents,
      },
      fedToday: true,
      venue: idleVenue(),
    },
    "food-bought",
    `−${formatCash(state.mealPriceCents)} · ${MEAL_VENDOR_NAME}`,
  );
}

export function tryAction(state: GameState): GameState {
  if (!canControl(state)) return state;

  const focused = state.focusedItemId
    ? state.world.items.find((i) => i.id === state.focusedItemId)
    : undefined;
  const target =
    focused && isAdjacentToItem(state.player.position, focused)
      ? focused
      : nearestInteractable(state.world, state.player.position);

  if (!target) return emit(state, "action-noop", "Nothing to do");
  if (!isAdjacentToItem(state.player.position, target)) {
    return emit(state, "move-closer", "Move closer");
  }

  switch (target.type) {
    case "bin":
      return searchBin(state, target);
    case "bottle-return":
      return startRewe(state);
    case "food":
      return startFood(state);
    default:
      return emit(state, "action-noop", "Nothing to do");
  }
}

export function focusOrActOnItem(state: GameState, itemId: string): GameState {
  if (!canControl(state)) return state;
  const item = state.world.items.find((i) => i.id === itemId);
  if (!item) return state;
  if (!isAdjacentToItem(state.player.position, item)) {
    return emit(state, "move-closer", "Move closer");
  }
  if (state.focusedItemId === itemId) {
    return tryAction({ ...state, focusedItemId: itemId });
  }
  return {
    ...state,
    focusedItemId: itemId,
    toast: `Focus: ${item.type}`,
  };
}

function cancelVenue(state: GameState): GameState {
  if (state.venue.kind === "none") return state;
  return {
    ...state,
    player: {
      ...state.player,
      bottles: state.venue.bottlesBefore,
      cashCents: state.venue.cashBefore,
    },
    fedToday: state.venue.fedBefore,
    venue: idleVenue(),
    toast: "Queue cancelled",
  };
}

export function resolveDay(state: GameState): GameState {
  let next = cancelVenue(state);

  if (!next.fedToday) {
    const healthUnits = Math.max(
      0,
      next.player.healthUnits - DAMAGE_MISSED_MEAL,
    );
    next = emit(
      { ...next, player: { ...next.player, healthUnits } },
      "day-failed",
      "Missed meal −1 ♥",
    );
    if (healthUnits <= 0) {
      return emit({ ...next, phase: "lost" }, "lost", "Game over");
    }
  } else {
    next = emit(next, "day-survived", "Survived the day");
  }

  if (next.day >= DAYS_PER_RUN) {
    return emit({ ...next, phase: "won" }, "won", "Benefits approved!");
  }

  return { ...next, phase: "day-resolution" };
}

/** End the day early once the player has eaten (same rules as timer expiry). */
export function endDayEarly(state: GameState): GameState {
  if (state.phase !== "playing") return state;
  if (!state.fedToday) return state;
  if (state.venue.kind !== "none") return state;
  return resolveDay({ ...state, timeRemainingMs: 0 });
}

export function continueToNextDay(state: GameState): GameState {
  if (state.phase !== "day-resolution") return state;
  const prepared = prepareDay(state, state.day + 1);
  return {
    ...prepared,
    phase: "day-ready",
    toast: `Day ${prepared.day} ready`,
  };
}

export function tickPlaying(
  state: GameState,
  dtMs: number,
  options: { freezeDayTimer?: boolean } = {},
): GameState {
  if (state.phase !== "playing") return state;

  let next = state;
  const remaining = options.freezeDayTimer
    ? state.timeRemainingMs
    : state.timeRemainingMs - dtMs;

  if (state.venue.kind !== "none") {
    const venueLeft = state.venue.remainingMs - dtMs;
    if (venueLeft <= 0) {
      next =
        state.venue.kind === "rewe-wait"
          ? completeRewe(state)
          : completeFood(state);
    } else {
      next = {
        ...state,
        venue: { ...state.venue, remainingMs: venueLeft },
      };
    }
  }

  if (!options.freezeDayTimer && remaining <= 0) {
    return resolveDay({ ...next, timeRemainingMs: 0 });
  }

  return { ...next, timeRemainingMs: Math.max(0, remaining) };
}

/** Bottles still needed to afford today's meal after current cash. */
export function bottlesNeededForMeal(state: GameState): number {
  const shortfall = Math.max(0, state.mealPriceCents - state.player.cashCents);
  if (shortfall === 0) return 0;
  return Math.ceil(shortfall / BOTTLE_VALUE_CENTS);
}

export function characterName(characterId: string): string {
  return CHARACTERS.find((c) => c.id === characterId)?.name ?? "Hobo";
}

export function characterBlurb(characterId: string): string {
  return (
    CHARACTERS.find((c) => c.id === characterId)?.blurb ?? "Recently laid off."
  );
}

export function setPhase(state: GameState, phase: GamePhase): GameState {
  return { ...state, phase };
}

export { COUNTDOWN_SECONDS };
