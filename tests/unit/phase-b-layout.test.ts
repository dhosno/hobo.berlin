// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { GRID_COLUMNS, GRID_ROWS } from "../../src/game/config";
import {
  GATE_PLACEMENT,
  TRASH_CAN_POSITIONS,
  TREE_POSITIONS,
  terrainAt,
} from "../../src/game/map/phase-b-layout";
import { blockedCellKey, parseTiledMap } from "../../src/game/map/tiled-contract";

const EXPECTED_TREES = [
  { column: 1, row: 9 },
  { column: 8, row: 7 },
  { column: 8, row: 9 },
  { column: 11, row: 7 },
  { column: 13, row: 8 },
  { column: 21, row: 6 },
] as const;

const EXPECTED_TRASH_CANS = [
  { column: 7, row: 3 },
  { column: 17, row: 7 },
  { column: 15, row: 12 },
] as const;

describe("Phase B park layout", () => {
  it("uses the approved connected asphalt bands with grass elsewhere", () => {
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        const expected = (
          (row >= 2 && row <= 4) ||
          (row >= 11 && row <= 13) ||
          (column >= 3 && column <= 5) ||
          (column >= 16 && column <= 18)
        ) ? "asphalt" : "grass";

        expect(terrainAt(column, row), `${column},${row}`).toBe(expected);
      }
    }
    expect(terrainAt(2, 2)).toBe("asphalt");
  });

  it("places trees on grass and trash cans on asphalt", () => {
    expect(TREE_POSITIONS).toEqual(EXPECTED_TREES);
    expect(TRASH_CAN_POSITIONS).toEqual(EXPECTED_TRASH_CANS);

    for (const position of TREE_POSITIONS) {
      expect(terrainAt(position.column, position.row)).toBe("grass");
    }
    for (const position of TRASH_CAN_POSITIONS) {
      expect(terrainAt(position.column, position.row)).toBe("asphalt");
    }
  });

  it("fits the decorative Gate once in the top-right corner", () => {
    expect(GATE_PLACEMENT).toEqual({ column: 20, row: 0, width: 4, height: 3 });
    expect(GATE_PLACEMENT.column + GATE_PLACEMENT.width).toBe(GRID_COLUMNS);
    expect(GATE_PLACEMENT.row + GATE_PLACEMENT.height).toBeLessThanOrEqual(GRID_ROWS);
  });

  it("aligns every visual prop with the checked-in Collision cells", async () => {
    const input: unknown = JSON.parse(await readFile("src/assets/maps/phase-0.json", "utf8"));
    const map = parseTiledMap(input);
    const expected = new Set(
      [...TREE_POSITIONS, ...TRASH_CAN_POSITIONS].map(blockedCellKey),
    );

    expect(map.blockedCells).toEqual(expected);
    for (let row = GATE_PLACEMENT.row; row < GATE_PLACEMENT.row + GATE_PLACEMENT.height; row += 1) {
      for (
        let column = GATE_PLACEMENT.column;
        column < GATE_PLACEMENT.column + GATE_PLACEMENT.width;
        column += 1
      ) {
        expect(map.blockedCells.has(blockedCellKey({ column, row }))).toBe(false);
      }
    }
  });
});
