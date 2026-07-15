import asphaltUrl from "../../assets/sprites/asphalt.png";
import benchUrl from "../../assets/sprites/bench.png";
import gateUrl from "../../assets/sprites/Brandenburg-Gate.png";
import bottleUrl from "../../assets/sprites/bottle.png";
import donnerUrl from "../../assets/sprites/donner.png";
import grassUrl from "../../assets/sprites/grass.png";
import hoboUrl from "../../assets/sprites/hobo.png";
import nettoUrl from "../../assets/sprites/Netto.png";
import reweUrl from "../../assets/sprites/Rewe.png";
import trashCanUrl from "../../assets/sprites/trash-can.png";
import treeUrl from "../../assets/sprites/tree.png";
import type { WorldItem } from "../mechanics/types";

export const BOARD_ASSETS = {
  asphalt: { key: "asphalt", url: asphaltUrl },
  bench: { key: "bench", url: benchUrl },
  grass: { key: "grass", url: grassUrl },
  tree: { key: "tree", url: treeUrl },
  "trash-can": { key: "trash-can", url: trashCanUrl },
  "brandenburg-gate": { key: "brandenburg-gate", url: gateUrl },
  hobo: { key: "hobo", url: hoboUrl },
  bottle: { key: "bottle", url: bottleUrl },
  rewe: { key: "rewe", url: reweUrl },
  netto: { key: "netto", url: nettoUrl },
  donner: { key: "donner", url: donnerUrl },
} as const;

export type BoardAssetKey = keyof typeof BOARD_ASSETS;

const LANDMARK_DISPLAY_SCALE = 1.7;
const DEFAULT_DISPLAY_SCALE = 0.92;

function knownAssetKey(value: string | undefined): BoardAssetKey | undefined {
  return value && Object.hasOwn(BOARD_ASSETS, value)
    ? (value as BoardAssetKey)
    : undefined;
}

export function itemAssetKey(item: WorldItem): BoardAssetKey | undefined {
  switch (item.type) {
    case "bin":
      return "trash-can";
    case "loose-bottle":
      return "bottle";
    case "bottle-return":
      return "rewe";
    case "scenery":
      return knownAssetKey(item.assetKey);
    case "food":
      return "donner";
  }
}

export function itemDisplaySize(
  item: WorldItem,
  footprintWidth: number,
  footprintHeight: number,
  sourceWidth: number,
  sourceHeight: number,
): { width: number; height: number } {
  const isLandmark =
    item.type === "bottle-return" ||
    item.type === "food" ||
    (item.type === "scenery" &&
      (item.assetKey === "brandenburg-gate" || item.assetKey === "bench"));

  if (!isLandmark) {
    return {
      width: footprintWidth * DEFAULT_DISPLAY_SCALE,
      height: footprintHeight * DEFAULT_DISPLAY_SCALE,
    };
  }

  const scale = Math.min(
    (footprintWidth * LANDMARK_DISPLAY_SCALE) / sourceWidth,
    (footprintHeight * LANDMARK_DISPLAY_SCALE) / sourceHeight,
  );
  return { width: sourceWidth * scale, height: sourceHeight * scale };
}
