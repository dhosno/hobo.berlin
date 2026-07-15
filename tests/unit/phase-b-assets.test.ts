// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { readFile } from "node:fs/promises";
// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { PHASE_B_ASSETS } from "../../src/game/assets/phase-b-assets";

const ASSET_FILES = [
  "asphalt.png",
  "grass.png",
  "tree.png",
  "trash-can.png",
  "Brandenburg-Gate.png",
  "hobo.png",
] as const;

describe("Phase B assets", () => {
  it("exposes the six supplied textures under stable Phaser keys", () => {
    expect(Object.fromEntries(
      Object.entries(PHASE_B_ASSETS).map(([name, asset]) => [name, asset.key]),
    )).toEqual({
      asphalt: "asphalt",
      grass: "grass",
      tree: "tree",
      trashCan: "trash-can",
      gate: "brandenburg-gate",
      character: "character",
    });
  });

  it.each(ASSET_FILES)("uses a real PNG for %s", async (filename) => {
    const bytes = await readFile(resolve("src/assets/sprites", filename));

    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(bytes.byteLength).toBeGreaterThan(8);
  });
});
