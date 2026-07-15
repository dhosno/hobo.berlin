import { describe, expect, it } from "vitest";

import { BOTTLE_VALUE_CENTS, DAY_DURATION_MS } from "../../src/game/config";
import {
  bottlesNeededForMeal,
  createInitialState,
  formatCash,
  resolveDay,
  tickPlaying,
  tryMove,
} from "../../src/game/mechanics/run";
import { parseTiledMap } from "../../src/game/map/tiled-contract";
import type { GameState } from "../../src/game/mechanics/types";

const miniMap = {
  orientation: "orthogonal",
  infinite: false,
  width: 18,
  height: 28,
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

  it("resolves a hungry day with heart loss", () => {
    const map = parseTiledMap(miniMap);
    let state = createInitialState(map, "test-seed");
    state = {
      ...state,
      phase: "playing",
      fedToday: false,
      timeRemainingMs: 0,
    };
    const resolved = resolveDay(state);
    expect(resolved.player.healthUnits).toBe(4);
    expect(resolved.phase).toBe("day-resolution");
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
});
