import Phaser from "phaser";

import { PHASE_B_ASSETS } from "../assets/phase-b-assets";
import { CELL_SIZE, DESIGN_HEIGHT, DESIGN_WIDTH } from "../config";
import type { GameBootFailureHandler } from "../create-game";
import { moveGridPosition, type Direction } from "../grid/movement";
import { ArrowRepeatController } from "../input/repeat";
import {
  GATE_PLACEMENT,
  TRASH_CAN_POSITIONS,
  TREE_POSITIONS,
  terrainAt,
} from "../map/phase-b-layout";
import type { GridPosition, ParsedMapContract } from "../map/tiled-contract";

const COLORS = {
  grid: 0x162219,
} as const;

export class MapScene extends Phaser.Scene {
  private readonly map: ParsedMapContract;
  private readonly onBootFailure: GameBootFailureHandler;
  private readonly repeatController = new ArrowRepeatController();
  private assetLoadFailed = false;
  private position: GridPosition;
  private player!: Phaser.GameObjects.Image;

  constructor(map: ParsedMapContract, onBootFailure: GameBootFailureHandler) {
    super({ key: "MapScene" });
    this.map = map;
    this.onBootFailure = onBootFailure;
    this.position = { ...map.spawn };
  }

  preload(): void {
    this.load.once(
      Phaser.Loader.Events.FILE_LOAD_ERROR,
      (file: Phaser.Loader.File) => {
        this.assetLoadFailed = true;
        this.onBootFailure(new Error(`Asset texture failed to load: ${file.key}`));
      },
    );

    for (const asset of Object.values(PHASE_B_ASSETS)) {
      this.load.image(asset.key, asset.url);
    }
  }

  create(): void {
    if (this.assetLoadFailed) {
      return;
    }

    this.drawMap();
    this.player = this.add.image(
      this.cellCenter(this.position.column),
      this.cellCenter(this.position.row),
      PHASE_B_ASSETS.character.key,
    ).setDisplaySize(CELL_SIZE, CELL_SIZE).setDepth(4);
    this.syncStatus();

    const gameElement = document.querySelector<HTMLElement>("#game");
    if (gameElement !== null) {
      gameElement.dataset.presentation = "berlin-placeholders";
    }

    const keyboard = this.input.keyboard;
    if (keyboard !== null) {
      keyboard.addCapture("UP,DOWN,LEFT,RIGHT");
      keyboard.on("keydown", this.handleKeyDown);
      keyboard.on("keyup", this.handleKeyUp);
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.removeKeyboardListeners);
  }

  update(time: number): void {
    const direction = this.repeatController.update(time);
    if (direction !== undefined) {
      this.move(direction);
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const direction = this.repeatController.keyDown(
      event.code,
      this.time.now,
      event.repeat,
    );
    if (direction !== undefined) {
      this.move(direction);
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.repeatController.keyUp(event.code, this.time.now);
  };

  private readonly removeKeyboardListeners = (): void => {
    const keyboard = this.input.keyboard;
    if (keyboard !== null) {
      keyboard.off("keydown", this.handleKeyDown);
      keyboard.off("keyup", this.handleKeyUp);
    }
  };

  private drawMap(): void {
    for (let row = 0; row < this.map.bounds.rows; row += 1) {
      for (let column = 0; column < this.map.bounds.columns; column += 1) {
        const terrain = PHASE_B_ASSETS[terrainAt(column, row)];
        this.add.image(
          this.cellCenter(column),
          this.cellCenter(row),
          terrain.key,
        ).setDisplaySize(CELL_SIZE, CELL_SIZE).setDepth(0);
      }
    }

    this.add.image(
      GATE_PLACEMENT.column * CELL_SIZE,
      GATE_PLACEMENT.row * CELL_SIZE,
      PHASE_B_ASSETS.gate.key,
    ).setOrigin(0, 0).setDisplaySize(
      GATE_PLACEMENT.width * CELL_SIZE,
      GATE_PLACEMENT.height * CELL_SIZE,
    ).setDepth(1);

    for (const position of TREE_POSITIONS) {
      this.add.image(
        this.cellCenter(position.column),
        this.cellCenter(position.row),
        PHASE_B_ASSETS.tree.key,
      ).setDisplaySize(CELL_SIZE, CELL_SIZE).setDepth(2);
    }

    for (const position of TRASH_CAN_POSITIONS) {
      this.add.image(
        this.cellCenter(position.column),
        this.cellCenter(position.row),
        PHASE_B_ASSETS.trashCan.key,
      ).setDisplaySize(CELL_SIZE * 0.75, CELL_SIZE * 0.75).setDepth(2);
    }

    const graphics = this.add.graphics();
    graphics.setDepth(3);
    graphics.lineStyle(1, COLORS.grid, 0.22);
    for (let column = 0; column <= this.map.bounds.columns; column += 1) {
      const x = column * CELL_SIZE;
      graphics.lineBetween(x, 0, x, DESIGN_HEIGHT);
    }
    for (let row = 0; row <= this.map.bounds.rows; row += 1) {
      const y = row * CELL_SIZE;
      graphics.lineBetween(0, y, DESIGN_WIDTH, y);
    }
  }

  private move(direction: Direction): void {
    const nextPosition = moveGridPosition(
      this.position,
      direction,
      this.map.bounds,
      this.map.blockedCells,
    );
    if (nextPosition === this.position) {
      return;
    }

    this.position = nextPosition;
    this.player.setPosition(
      this.cellCenter(this.position.column),
      this.cellCenter(this.position.row),
    );
    this.syncStatus();
  }

  private syncStatus(): void {
    const output = document.querySelector<HTMLOutputElement>("#player-position");
    if (output === null) {
      return;
    }

    output.dataset.column = String(this.position.column);
    output.dataset.row = String(this.position.row);
    output.textContent = `Player: ${this.position.column},${this.position.row}`;
  }

  private cellCenter(index: number): number {
    return index * CELL_SIZE + CELL_SIZE / 2;
  }
}
