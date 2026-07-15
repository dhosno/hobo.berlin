import { describe, expect, it } from "vitest";
import {
  CELL_SIZE,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GRID_COLUMNS,
  GRID_ROWS,
  INITIAL_REPEAT_DELAY_MS,
  REPEAT_INTERVAL_MS,
} from "../../src/game/config";

describe("Phase 1 layout constants", () => {
  it("uses the vertical sketch grid (18×28 @ 28px)", () => {
    expect([GRID_COLUMNS, GRID_ROWS, CELL_SIZE]).toEqual([18, 28, 28]);
    expect([DESIGN_WIDTH, DESIGN_HEIGHT]).toEqual([504, 784]);
    expect(DESIGN_HEIGHT).toBeGreaterThan(DESIGN_WIDTH);
  });

  it("pins deterministic repeat timing", () => {
    expect([INITIAL_REPEAT_DELAY_MS, REPEAT_INTERVAL_MS]).toEqual([180, 100]);
  });
});
