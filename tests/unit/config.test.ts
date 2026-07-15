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

describe("Phase 0 constants", () => {
  it("derives the 768 by 512 design from a 24 by 16 grid", () => {
    expect([GRID_COLUMNS, GRID_ROWS, CELL_SIZE]).toEqual([24, 16, 32]);
    expect([DESIGN_WIDTH, DESIGN_HEIGHT]).toEqual([768, 512]);
  });

  it("pins deterministic repeat timing", () => {
    expect([INITIAL_REPEAT_DELAY_MS, REPEAT_INTERVAL_MS]).toEqual([180, 100]);
  });
});
