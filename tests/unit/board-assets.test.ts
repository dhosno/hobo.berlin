// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { readFile } from "node:fs/promises";
// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BOARD_ASSETS,
  itemAssetKey,
} from "../../src/game/assets/board-assets";
import type { WorldItem } from "../../src/game/mechanics/types";

const ASSET_FILES = [
  "asphalt.png",
  "grass.png",
  "tree.png",
  "trash-can.png",
  "Brandenburg-Gate.png",
  "hobo.png",
  "bottle.png",
  "Rewe.png",
  "Netto.png",
] as const;

function item(type: WorldItem["type"], assetKey?: string): WorldItem {
  return {
    id: type,
    type,
    position: { column: 0, row: 0 },
    size: { columns: 1, rows: 1 },
    blocking: false,
    ...(assetKey ? { assetKey } : {}),
  };
}

describe("board assets", () => {
  it("exposes every supplied sprite under a stable Phaser key", () => {
    expect(Object.keys(BOARD_ASSETS)).toEqual([
      "asphalt",
      "grass",
      "tree",
      "trash-can",
      "brandenburg-gate",
      "hobo",
      "bottle",
      "rewe",
      "netto",
    ]);
  });

  it("selects sprites for supported world items and preserves the food fallback", () => {
    expect(itemAssetKey(item("bin"))).toBe("trash-can");
    expect(itemAssetKey(item("loose-bottle"))).toBe("bottle");
    expect(itemAssetKey(item("bottle-return"), () => 0)).toBe("rewe");
    expect(itemAssetKey(item("bottle-return"), () => 0.999)).toBe("netto");
    expect(itemAssetKey(item("bottle-return", "netto"), () => 0)).toBe("netto");
    expect(itemAssetKey(item("bottle-return", "rewe"), () => 0.999)).toBe(
      "rewe",
    );
    expect(itemAssetKey(item("scenery", "tree"))).toBe("tree");
    expect(itemAssetKey(item("scenery", "brandenburg-gate"))).toBe(
      "brandenburg-gate",
    );
    expect(itemAssetKey(item("food"))).toBeUndefined();
  });

  it.each(ASSET_FILES)("uses a real PNG for %s", async (filename) => {
    const bytes = await readFile(resolve("src/assets/sprites", filename));

    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(bytes.byteLength).toBeGreaterThan(8);
  });
});
