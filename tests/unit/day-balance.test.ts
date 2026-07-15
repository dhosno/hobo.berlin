import { describe, expect, it } from "vitest";

import { BIN_HAZARD_FRACTION } from "../../src/game/config";
import { dayBalance } from "../../src/game/mechanics/day-balance";

describe("day balance curve", () => {
  it("scales supply down and prices up across the week", () => {
    const d1 = dayBalance(1);
    const d7 = dayBalance(7);

    expect(d1.looseBottleCount).toBe(14);
    expect(d7.looseBottleCount).toBe(6);
    expect(d1.binYieldMin).toBe(3);
    expect(d7.binYieldMin).toBe(1);
    expect(d1.hazardFraction).toBe(0);
    expect(d7.hazardFraction).toBe(BIN_HAZARD_FRACTION);
    expect(d1.mealMinCents).toBe(400);
    expect(d7.mealMaxCents).toBe(800);
  });
});
