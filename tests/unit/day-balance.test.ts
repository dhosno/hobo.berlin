import { describe, expect, it } from "vitest";

import {
  BIN_HAZARD_CHANCE_MAX,
  BIN_HAZARD_CHANCE_MIN,
} from "../../src/game/config";
import { dayBalance } from "../../src/game/mechanics/day-balance";

describe("day balance curve", () => {
  it("gets harder from day 1 to day 7", () => {
    const d1 = dayBalance(1);
    const d7 = dayBalance(7);

    expect(d1.looseBottleCount).toBeGreaterThan(d7.looseBottleCount);
    expect(d1.binYieldMax).toBeGreaterThan(d7.binYieldMax);
    expect(d1.hazardChanceMin).toBe(BIN_HAZARD_CHANCE_MIN);
    expect(d1.hazardChanceMax).toBeLessThanOrEqual(d7.hazardChanceMax);
    expect(d7.hazardChanceMax).toBe(BIN_HAZARD_CHANCE_MAX);
    expect(d1.mealMinCents).toBeLessThan(d7.mealMinCents);
    expect(d1.surplusRatioMin).toBeGreaterThan(d7.surplusRatioMin);
  });
});
