// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { GRID_COLUMNS, GRID_ROWS } from "../../src/game/config";
import { terrainAt } from "../../src/game/map/board-layout";
import { blockedCellKey, parseTiledMap } from "../../src/game/map/tiled-contract";
import { worldFromParsedMap } from "../../src/game/mechanics/world";

const TREE_POSITIONS = [
  { column: 6, row: 4 },
  { column: 11, row: 4 },
  { column: 9, row: 17 },
  { column: 12, row: 16 },
  { column: 5, row: 23 },
  { column: 16, row: 17 },
] as const;

describe("portrait board layout", () => {
  it("uses connected asphalt bands with grass elsewhere", () => {
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        const expected =
          (column >= 2 && column <= 4) ||
          (column >= 13 && column <= 15) ||
          (row >= 6 && row <= 8) ||
          (row >= 19 && row <= 21)
            ? "asphalt"
            : "grass";

        expect(terrainAt(column, row), `${column},${row}`).toBe(expected);
      }
    }
  });

  it("places the Gate and trees from the approved source layout", async () => {
    const input: unknown = JSON.parse(
      await readFile("src/assets/maps/phase-1.json", "utf8"),
    );
    const map = parseTiledMap(input);
    const gate = map.interactables.find(
      (item) => item.assetKey === "brandenburg-gate",
    );
    const bench = map.interactables.find((item) => item.assetKey === "bench");
    const trees = map.interactables
      .filter((item) => item.assetKey === "tree")
      .map((item) => item.position);

    expect(map.spawn).toEqual({ column: 4, row: 12 });
    expect(terrainAt(map.spawn.column, map.spawn.row)).toBe("asphalt");

    expect(gate).toMatchObject({
      position: { column: 7, row: 11 },
      size: { columns: 4, rows: 3 },
    });
    expect(bench).toMatchObject({
      position: { column: 8, row: 23 },
      size: { columns: 2, rows: 1 },
    });
    expect(trees).toEqual(TREE_POSITIONS);
    expect(new Set(trees.map(blockedCellKey))).toEqual(map.blockedCells);
    for (const position of trees) {
      expect(terrainAt(position.column, position.row)).toBe("grass");
    }

    expect(
      worldFromParsedMap(map).items
        .filter((item) => item.assetKey !== undefined)
        .map((item) => item.assetKey),
    ).toEqual([
      "brandenburg-gate",
      "bench",
      ...TREE_POSITIONS.map(() => "tree"),
    ]);
  });
});
