// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { readFile } from "node:fs/promises";
// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BOARD_ASSETS,
  itemAssetKey,
  itemDisplaySize,
} from "../../src/game/assets/board-assets";
import type { WorldItem } from "../../src/game/mechanics/types";

const ASSET_FILES = [
  "asphalt.png",
  "bench.png",
  "grass.png",
  "tree.png",
  "trash-can.png",
  "Brandenburg-Gate.png",
  "hobo.png",
  "bottle.png",
  "Rewe.png",
  "Netto.png",
  "donner.png",
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
      "bench",
      "grass",
      "tree",
      "trash-can",
      "brandenburg-gate",
      "hobo",
      "bottle",
      "rewe",
      "netto",
      "donner",
    ]);
  });

  it("selects sprites for every supported world item", () => {
    expect(itemAssetKey(item("bin"))).toBe("trash-can");
    expect(itemAssetKey(item("loose-bottle"))).toBe("bottle");
    expect(itemAssetKey(item("bottle-return"))).toBe("rewe");
    expect(itemAssetKey(item("scenery", "tree"))).toBe("tree");
    expect(itemAssetKey(item("scenery", "bench"))).toBe("bench");
    expect(itemAssetKey(item("scenery", "brandenburg-gate"))).toBe(
      "brandenburg-gate",
    );
    expect(itemAssetKey(item("food"))).toBe("donner");
  });

  it("enlarges landmarks without changing their source aspect ratios", () => {
    expect(itemDisplaySize(item("food"), 84, 56, 512, 512)).toEqual({
      width: 95.2,
      height: 95.2,
    });
    const gateSize = itemDisplaySize(
      item("scenery", "brandenburg-gate"),
      112,
      84,
      128,
      96,
    );
    expect(gateSize.width).toBeCloseTo(190.4);
    expect(gateSize.height).toBeCloseTo(142.8);
  });

  it.each(["game-over.gif", "win.gif"])("uses a real GIF for %s", async (filename) => {
    const bytes = await readFile(resolve("src/assets/sprites", filename));

    expect(new TextDecoder().decode(bytes.subarray(0, 6))).toMatch(/^GIF8[79]a$/);
    expect(bytes.byteLength).toBeGreaterThan(6);
  });

  it.each(ASSET_FILES)("uses a real PNG for %s", async (filename) => {
    const bytes = await readFile(resolve("src/assets/sprites", filename));

    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(bytes.byteLength).toBeGreaterThan(8);
  });
});
