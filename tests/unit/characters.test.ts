// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { readFile } from "node:fs/promises";
// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  characterPortraitUrl,
  characterShortLabel,
} from "../../src/game/characters";

const PORTRAIT_FILES = [
  ["prompt", "prompt.png"],
  ["marketing", "marketing.png"],
  ["qa", "qa.png"],
] as const;

describe("character portraits", () => {
  it.each(PORTRAIT_FILES)(
    "keeps %s art in src/assets/characters/%s",
    async (id, filename) => {
      const bytes = await readFile(
        resolve("src/assets/characters", filename),
      );
      expect([...bytes.subarray(0, 8)]).toEqual([
        137, 80, 78, 71, 13, 10, 26, 10,
      ]);
      expect(characterPortraitUrl(id)).toMatch(
        new RegExp(`${id}-[\\w-]+\\.png|/characters/${id}\\.png`),
      );
      expect(characterShortLabel(id).length).toBeGreaterThan(0);
    },
  );
});
