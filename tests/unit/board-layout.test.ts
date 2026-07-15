// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { GRID_COLUMNS, GRID_ROWS } from "../../src/game/config";
import { terrainAt } from "../../src/game/map/board-layout";
import { blockedCellKey, parseTiledMap } from "../../src/game/map/tiled-contract";
import { worldFromParsedMap } from "../../src/game/mechanics/world";

const TREE_POSITIONS = [
  { column: 6, row: 5 },
  { column: 11, row: 5 },
  { column: 7, row: 13 },
  { column: 12, row: 15 },
  { column: 5, row: 24 },
  { column: 16, row: 18 },
] as const;

describe("portrait board layout", () => {
  it("uses connected asphalt bands with grass elsewhere", () => {
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let column = 0; column < GRID_COLUMNS; column += 1) {
        const expected =
          (column >= 2 && column <= 4) ||
          (column >= 13 && column <= 15) ||
          (row >= 7 && row <= 9) ||
          (row >= 20 && row <= 22)
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
    const trees = map.interactables
      .filter((item) => item.assetKey === "tree")
      .map((item) => item.position);

    expect(gate).toMatchObject({
      position: { column: 7, row: 1 },
      size: { columns: 4, rows: 3 },
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
    ).toEqual(["brandenburg-gate", ...TREE_POSITIONS.map(() => "tree")]);
  });
});
