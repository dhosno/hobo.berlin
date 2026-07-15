import asphaltUrl from "../../assets/sprites/asphalt.png";
import gateUrl from "../../assets/sprites/Brandenburg-Gate.png";
import characterUrl from "../../assets/sprites/hobo.png";
import grassUrl from "../../assets/sprites/grass.png";
import trashCanUrl from "../../assets/sprites/trash-can.png";
import treeUrl from "../../assets/sprites/tree.png";

export const PHASE_B_ASSETS = {
  asphalt: { key: "asphalt", url: asphaltUrl },
  grass: { key: "grass", url: grassUrl },
  tree: { key: "tree", url: treeUrl },
  trashCan: { key: "trash-can", url: trashCanUrl },
  gate: { key: "brandenburg-gate", url: gateUrl },
  character: { key: "character", url: characterUrl },
} as const;
