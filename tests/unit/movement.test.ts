import { describe, expect, it } from "vitest";

import { moveGridPosition } from "../../src/game/grid/movement";

describe("moveGridPosition", () => {
  it("moves right", () => {
    const current = { column: 2, row: 2 };
    const originalCurrent = { ...current };

    const result = moveGridPosition(
      current,
      "right",
      { columns: 24, rows: 16 },
      new Set(),
    );

    expect(result).toEqual({ column: 3, row: 2 });
    expect(result).not.toBe(current);
    expect(current).toEqual(originalCurrent);
  });

  it("moves left", () => {
    expect(
      moveGridPosition(
        { column: 2, row: 2 },
        "left",
        { columns: 24, rows: 16 },
        new Set(),
      ),
    ).toEqual({ column: 1, row: 2 });
  });

  it("moves up", () => {
    expect(
      moveGridPosition(
        { column: 2, row: 2 },
        "up",
        { columns: 24, rows: 16 },
        new Set(),
      ),
    ).toEqual({ column: 2, row: 1 });
  });

  it("moves down", () => {
    expect(
      moveGridPosition(
        { column: 2, row: 2 },
        "down",
        { columns: 24, rows: 16 },
        new Set(),
      ),
    ).toEqual({ column: 2, row: 3 });
  });

  it.each([
    ["left", { column: 0, row: 2 }],
    ["right", { column: 23, row: 2 }],
    ["up", { column: 2, row: 0 }],
    ["down", { column: 2, row: 15 }],
  ] as const)("rejects %s movement outside bounds", (direction, current) => {
    const result = moveGridPosition(
      current,
      direction,
      { columns: 24, rows: 16 },
      new Set(),
    );

    expect(result).toBe(current);
  });

  it("rejects a blocked destination", () => {
    const current = { column: 2, row: 2 };
    const blockedCells = new Set(["3,2"]);
    const originalBlockedCells = new Set(blockedCells);

    const result = moveGridPosition(
      current,
      "right",
      { columns: 24, rows: 16 },
      blockedCells,
    );

    expect(result).toBe(current);
    expect(blockedCells).toEqual(originalBlockedCells);
  });
});
