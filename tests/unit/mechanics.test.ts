import { describe, expect, it } from "vitest";

import {
  BIN_HAZARD_CHANCE_MAX,
  BIN_HAZARD_CHANCE_MIN,
  BOTTLE_VALUE_CENTS,
  DAY_DURATION_MS,
} from "../../src/game/config";
import { dayBalance } from "../../src/game/mechanics/day-balance";
import {
  bottlesNeededForMeal,
  createInitialState,
  declareLost,
  endDayEarly,
  formatCash,
  resolveDay,
  tickPlaying,
  tryAction,
  tryMove,
} from "../../src/game/mechanics/run";
import { createRng } from "../../src/game/mechanics/rng";
import {
  balanceDayEconomy,
  dayPotentialCents,
  isAdjacentToItem,
  mapBottleValueCents,
  spawnDailyCollectibles,
  worldFromParsedMap,
} from "../../src/game/mechanics/world";
import { parseTiledMap } from "../../src/game/map/tiled-contract";
import type { GameState } from "../../src/game/mechanics/types";

const miniMap = {
  orientation: "orthogonal",
  infinite: false,
  width: 18,
  height: 26,
  tilewidth: 28,
  tileheight: 28,
  layers: [
    {
      type: "objectgroup",
      name: "Spawn",
      visible: true,
      objects: [{ id: 1, name: "player", point: true, visible: true, x: 56, y: 56 }],
    },
    {
      type: "objectgroup",
      name: "Collision",
      visible: true,
      objects: [{ id: 2, visible: true, x: 140, y: 56, width: 28, height: 28 }],
    },
    {
      type: "objectgroup",
      name: "Interactables",
      visible: true,
      objects: [
        {
          id: 11,
          name: "rewe",
          visible: true,
          x: 28,
          y: 224,
          width: 84,
          height: 56,
        },
        {
          id: 12,
          name: "food",
          visible: true,
          x: 392,
          y: 224,
          width: 84,
          height: 56,
        },
      ],
    },
  ],
};

describe("mechanics run", () => {
  it("creates an instructions state with hearts and venues", () => {
    const map = parseTiledMap(miniMap);
    const state = createInitialState(map, "test-seed");

    expect(state.phase).toBe("instructions");
    expect(state.player.healthUnits).toBe(6);
    expect(state.player.bottles).toBe(0);
    expect(state.world.items.some((i) => i.type === "bottle-return")).toBe(true);
    expect(state.world.items.some((i) => i.type === "food")).toBe(true);
    expect(state.world.items.some((i) => i.type === "bin")).toBe(true);
  });

  it("does not move before playing", () => {
    const map = parseTiledMap(miniMap);
    const state = createInitialState(map, "test-seed");
    const next = tryMove(state, "right");
    expect(next.player.position).toEqual(state.player.position);
  });

  it("loses immediately when the timer expires", () => {
    const map = parseTiledMap(miniMap);
    let state = createInitialState(map, "test-seed");
    state = {
      ...state,
      phase: "playing",
      fedToday: false,
      timeRemainingMs: 0,
    };
    const resolved = tickPlaying(state, 1);
    expect(resolved.phase).toBe("lost");
    expect(resolved.lastEvents.at(-1)).toBe("lost");
  });

  it("ends the day early only when fed and idle", () => {
    const map = parseTiledMap(miniMap);
    let state = createInitialState(map, "test-seed");
    state = {
      ...state,
      phase: "playing",
      fedToday: false,
      timeRemainingMs: DAY_DURATION_MS,
    };
    expect(endDayEarly(state).phase).toBe("playing");

    state = { ...state, fedToday: true };
    const ended = endDayEarly(state);
    expect(ended.phase).toBe("day-resolution");
    expect(ended.lastEvents.at(-1)).toBe("day-survived");
    expect(ended.timeRemainingMs).toBe(0);

    state = {
      ...state,
      venue: {
        kind: "rewe-wait",
        remainingMs: 2000,
        totalMs: 2000,
        bottlesBefore: 8,
        cashBefore: 0,
        fedBefore: true,
      },
    };
    expect(endDayEarly(state).phase).toBe("playing");
  });

  it("freezes the day timer when requested", () => {
    const map = parseTiledMap(miniMap);
    let state = createInitialState(map, "test-seed");
    state = {
      ...state,
      phase: "playing",
      timeRemainingMs: DAY_DURATION_MS,
    };
    const next = tickPlaying(state, 5_000, { freezeDayTimer: true });
    expect(next.timeRemainingMs).toBe(DAY_DURATION_MS);
    expect(next.phase).toBe("playing");
  });

  it("reports bottles needed for the meal", () => {
    const map = parseTiledMap(miniMap);
    let state = createInitialState(map, "test-seed");
    state = {
      ...state,
      mealPriceCents: 500,
      player: { ...state.player, cashCents: 0, bottles: 0 },
    };
    expect(bottlesNeededForMeal(state)).toBe(20);
    state = {
      ...state,
      player: { ...state.player, cashCents: 500 },
    };
    expect(bottlesNeededForMeal(state)).toBe(0);
  });

  it("redeems bottles into cash with delta toast", () => {
    const map = parseTiledMap(miniMap);
    let state = createInitialState(map, "test-seed");
    const bottles = 20;
    const gained = bottles * BOTTLE_VALUE_CENTS;
    state = {
      ...state,
      phase: "playing",
      timeRemainingMs: DAY_DURATION_MS,
      player: { ...state.player, bottles, cashCents: 100 },
      venue: {
        kind: "rewe-wait",
        remainingMs: 1,
        totalMs: 1000,
        bottlesBefore: bottles,
        cashBefore: 100,
        fedBefore: false,
      },
    } satisfies GameState;

    const next = tickPlaying(state, 50);
    expect(next.player.bottles).toBe(0);
    expect(next.player.cashCents).toBe(100 + gained);
    expect(next.toast).toBe(`−${bottles} bottles · +${formatCash(gained)}`);
    expect(next.lastEvents.at(-1)).toBe("cash-received");
  });

  it("gets harder from day 1 to day 7", () => {
    const easy = dayBalance(1);
    const hard = dayBalance(7);

    expect(easy.looseBottleCount).toBeGreaterThan(hard.looseBottleCount);
    expect(easy.binYieldMax).toBeGreaterThan(hard.binYieldMax);
    expect(easy.hazardChanceMax).toBeLessThanOrEqual(hard.hazardChanceMax);
    expect(easy.mealMinCents).toBeLessThan(hard.mealMinCents);
    expect(easy.surplusRatioMin).toBeGreaterThan(hard.surplusRatioMin);
    expect(hard.hazardChanceMax).toBe(BIN_HAZARD_CHANCE_MAX);
  });

  it("keeps each day solvable but not wildly oversupplied", () => {
    const map = parseTiledMap(miniMap);
    const world = worldFromParsedMap(map);

    for (const day of [1, 4, 7] as const) {
      const balance = dayBalance(day);
      const rng = createRng(`balance-day-${day}`);
      const meal = balance.mealMaxCents;
      let items = spawnDailyCollectibles(world, rng, balance);
      items = balanceDayEconomy(items, meal, 0, 0, balance);
      const potential = dayPotentialCents(items, 0, 0);

      expect(potential).toBeGreaterThanOrEqual(meal);
      expect(potential).toBeLessThanOrEqual(
        Math.ceil(meal * balance.surplusRatioMax) + BOTTLE_VALUE_CENTS,
      );
      expect(mapBottleValueCents(items)).toBeGreaterThan(0);
    }
  });

  it("assigns each bin a hidden 5–15% burn chance", () => {
    const map = parseTiledMap(miniMap);
    const world = worldFromParsedMap(map);
    const balance = dayBalance(7);
    const items = spawnDailyCollectibles(
      world,
      createRng("hazard-day-7"),
      balance,
    );
    const bins = items.filter((item) => item.type === "bin");

    expect(bins.length).toBeGreaterThanOrEqual(Math.max(5, balance.binCount - 3));
    expect(bins.length).toBeLessThanOrEqual(balance.binCount + 3);
    for (const bin of bins) {
      expect(bin.hazardChance).toBeGreaterThanOrEqual(BIN_HAZARD_CHANCE_MIN - 1e-9);
      expect(bin.hazardChance).toBeLessThanOrEqual(BIN_HAZARD_CHANCE_MAX + 1e-9);
      expect(bin.yieldBottles).toBeGreaterThan(0);
    }
  });

  it("keeps the bottle-return venue branded as REWE", () => {
    const map = parseTiledMap(miniMap);
    const world = worldFromParsedMap(map);
    for (let i = 0; i < 24; i += 1) {
      const items = spawnDailyCollectibles(
        world,
        createRng(`pfand-brand-${i}`),
        dayBalance(1),
      );
      const venue = items.find((item) => item.type === "bottle-return");
      expect(venue?.assetKey).toBe("rewe");
    }
  });

  it("burns half a heart and awards no bottles", () => {
    const map = parseTiledMap(miniMap);
    let state = createInitialState(map, "hazard-seed");
    const burner = {
      id: "bin-burn",
      type: "bin" as const,
      position: { column: 3, row: 3 },
      size: { columns: 1, rows: 1 },
      blocking: true,
      state: "available" as const,
      yieldBottles: 4,
      hazardChance: 1,
    };
    const neighbor = { column: 4, row: 3 };
    expect(isAdjacentToItem(neighbor, burner)).toBe(true);

    state = {
      ...state,
      phase: "playing",
      player: {
        ...state.player,
        position: neighbor,
        healthUnits: 6,
        bottles: 0,
      },
      focusedItemId: burner.id,
      world: {
        ...state.world,
        items: [...state.world.items.filter((i) => i.type !== "bin"), burner],
      },
    };

    const next = tryAction(state);
    expect(next.player.healthUnits).toBe(5);
    expect(next.player.bottles).toBe(0);
    expect(next.lastEvents).toContain("bin-burn");
    expect(next.toast).toContain("Burn");
  });

  it("keeps a lethal burn in playing so feedback can show before lost", () => {
    const map = parseTiledMap(miniMap);
    let state = createInitialState(map, "lethal-burn");
    const burner = {
      id: "bin-lethal",
      type: "bin" as const,
      position: { column: 3, row: 3 },
      size: { columns: 1, rows: 1 },
      blocking: true,
      state: "available" as const,
      yieldBottles: 1,
      hazardChance: 1,
    };
    state = {
      ...state,
      phase: "playing",
      player: {
        ...state.player,
        position: { column: 4, row: 3 },
        healthUnits: 1,
        bottles: 0,
      },
      focusedItemId: burner.id,
      world: {
        ...state.world,
        items: [...state.world.items.filter((i) => i.type !== "bin"), burner],
      },
    };

    const burned = tryAction(state);
    expect(burned.player.healthUnits).toBe(0);
    expect(burned.phase).toBe("playing");
    expect(burned.toast).toContain("Burn");
    expect(burned.lastEvents.at(-1)).toBe("bin-burn");
    expect(tickPlaying(burned, 5_000).phase).toBe("playing");

    const lost = declareLost(burned);
    expect(lost.phase).toBe("lost");
    expect(lost.lastEvents.at(-1)).toBe("lost");
  });
});
