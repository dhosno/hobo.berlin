import { describe, expect, it } from "vitest";

import { dayBalance } from "../../src/game/mechanics/day-balance";

describe("day balance curve", () => {
  it("clamps later days to the single playable day", () => {
    const d1 = dayBalance(1);
    const d7 = dayBalance(7);

    expect(d1.looseBottleCount).toBe(14);
    expect(d1.binYieldMin).toBe(3);
    expect(d1.mealMinCents).toBe(400);
    expect(d7).toEqual(d1);
  });
});
