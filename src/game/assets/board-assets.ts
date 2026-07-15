import asphaltUrl from "../../assets/sprites/asphalt.png";
import gateUrl from "../../assets/sprites/Brandenburg-Gate.png";
import bottleUrl from "../../assets/sprites/bottle.png";
import grassUrl from "../../assets/sprites/grass.png";
import hoboUrl from "../../assets/sprites/hobo.png";
import nettoUrl from "../../assets/sprites/Netto.png";
import reweUrl from "../../assets/sprites/Rewe.png";
import trashCanUrl from "../../assets/sprites/trash-can.png";
import treeUrl from "../../assets/sprites/tree.png";
import type { WorldItem } from "../mechanics/types";

export const BOARD_ASSETS = {
  asphalt: { key: "asphalt", url: asphaltUrl },
  grass: { key: "grass", url: grassUrl },
  tree: { key: "tree", url: treeUrl },
  "trash-can": { key: "trash-can", url: trashCanUrl },
  "brandenburg-gate": { key: "brandenburg-gate", url: gateUrl },
  hobo: { key: "hobo", url: hoboUrl },
  bottle: { key: "bottle", url: bottleUrl },
  rewe: { key: "rewe", url: reweUrl },
  netto: { key: "netto", url: nettoUrl },
} as const;

export type BoardAssetKey = keyof typeof BOARD_ASSETS;

function knownAssetKey(value: string | undefined): BoardAssetKey | undefined {
  return value && Object.hasOwn(BOARD_ASSETS, value)
    ? (value as BoardAssetKey)
    : undefined;
}

export function itemAssetKey(
  item: WorldItem,
  random: () => number = Math.random,
): BoardAssetKey | undefined {
  switch (item.type) {
    case "bin":
      return "trash-can";
    case "loose-bottle":
      return "bottle";
    case "bottle-return":
      return random() < 0.5 ? "rewe" : "netto";
    case "scenery":
      return knownAssetKey(item.assetKey);
    case "food":
      return undefined;
  }
}
