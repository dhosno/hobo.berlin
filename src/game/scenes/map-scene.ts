import Phaser from "phaser";

import { CELL_SIZE, DESIGN_HEIGHT, DESIGN_WIDTH } from "../config";
import { moveGridPosition, type Direction } from "../grid/movement";
import { ArrowRepeatController } from "../input/repeat";
import type { GridPosition, ParsedMapContract } from "../map/tiled-contract";

const COLORS = {
  background: 0x151922,
  blocker: 0xa4495f,
  grid: 0x596376,
  player: 0xf0bf4c,
} as const;

export class MapScene extends Phaser.Scene {
  private readonly map: ParsedMapContract;
  private readonly repeatController = new ArrowRepeatController();
  private position: GridPosition;
  private player!: Phaser.GameObjects.Rectangle;

  constructor(map: ParsedMapContract) {
    super({ key: "MapScene" });
    this.map = map;
    this.position = { ...map.spawn };
  }

  create(): void {
    this.drawMap();
    this.player = this.add.rectangle(
      this.cellCenter(this.position.column),
      this.cellCenter(this.position.row),
      CELL_SIZE * 0.625,
      CELL_SIZE * 0.625,
      COLORS.player,
    );
    this.syncStatus();

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
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.background);
    graphics.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    graphics.fillStyle(COLORS.blocker);
    for (const blockedCell of this.map.blockedCells) {
      const [column, row] = blockedCell.split(",").map(Number);
      graphics.fillRect(
        column * CELL_SIZE,
        row * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE,
      );
    }

    graphics.lineStyle(1, COLORS.grid, 0.8);
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
