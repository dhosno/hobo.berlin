import { describe, expect, it } from "vitest";
import {
  ACTION_DEBOUNCE_MS,
  BIN_HAZARD_CHANCE_MAX,
  BIN_HAZARD_CHANCE_MIN,
  CELL_SIZE,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  DAYS_PER_RUN,
  GRID_COLUMNS,
  GRID_ROWS,
  INITIAL_REPEAT_DELAY_MS,
  MEAL_VENDOR_NAME,
  MINIMUM_BOTTLES_TO_REDEEM,
  REWE_WAIT_MAX_MS,
  REWE_WAIT_MIN_MS,
  REPEAT_INTERVAL_MS,
} from "../../src/game/config";

describe("Phase 1 layout constants", () => {
  it("uses the vertical playable grid (18×26 @ 28px)", () => {
    expect([GRID_COLUMNS, GRID_ROWS, CELL_SIZE]).toEqual([18, 26, 28]);
    expect([DESIGN_WIDTH, DESIGN_HEIGHT]).toEqual([504, 728]);
    expect(DESIGN_HEIGHT).toBeGreaterThan(DESIGN_WIDTH);
  });

  it("pins deterministic repeat timing", () => {
    expect([INITIAL_REPEAT_DELAY_MS, REPEAT_INTERVAL_MS]).toEqual([180, 100]);
    expect(ACTION_DEBOUNCE_MS).toBe(280);
  });

  it("keeps economy defaults aligned with the mechanics spec", () => {
    expect(DAYS_PER_RUN).toBe(7);
    expect(MINIMUM_BOTTLES_TO_REDEEM).toBe(15);
    expect([REWE_WAIT_MIN_MS, REWE_WAIT_MAX_MS]).toEqual([2_000, 12_000]);
    expect(MEAL_VENDOR_NAME).toBe("kebap with Attitude");
    expect([BIN_HAZARD_CHANCE_MIN, BIN_HAZARD_CHANCE_MAX]).toEqual([0.2, 0.35]);
  });
});
