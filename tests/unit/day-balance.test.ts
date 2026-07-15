import { describe, expect, it } from "vitest";

import {
  BIN_HAZARD_CHANCE_MAX,
  BIN_HAZARD_CHANCE_MIN,
} from "../../src/game/config";
import { dayBalance } from "../../src/game/mechanics/day-balance";

describe("day balance curve", () => {
  it("scales supply down and prices up across the week", () => {
    const d1 = dayBalance(1);
    const d7 = dayBalance(7);

    expect(d1.looseBottleCount).toBe(14);
    expect(d7.looseBottleCount).toBe(6);
    expect(d1.binYieldMin).toBe(3);
    expect(d7.binYieldMin).toBe(1);
    expect(d1.hazardChanceMin).toBe(BIN_HAZARD_CHANCE_MIN);
    expect(d1.hazardChanceMax).toBeLessThanOrEqual(d7.hazardChanceMax);
    expect(d7.hazardChanceMax).toBe(BIN_HAZARD_CHANCE_MAX);
    expect(d1.mealMinCents).toBe(400);
    expect(d7.mealMaxCents).toBe(800);
  });
});
