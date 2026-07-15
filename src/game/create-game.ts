import Phaser from "phaser";

import { DESIGN_HEIGHT, DESIGN_WIDTH } from "./config";
import type { ParsedMapContract } from "./map/tiled-contract";
import { MapScene } from "./scenes/map-scene";

export function createGame(parent: HTMLElement, map: ParsedMapContract): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    transparent: true,
    antialias: false,
    scale: {
      parent,
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: DESIGN_WIDTH,
      height: DESIGN_HEIGHT,
    },
    scene: new MapScene(map),
  });
}
