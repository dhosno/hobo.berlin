import Phaser from "phaser";

import { CELL_SIZE, DESIGN_HEIGHT, DESIGN_WIDTH, MEAL_VENDOR_NAME } from "../config";
import type { Direction } from "../grid/movement";
import { ArrowRepeatController } from "../input/repeat";
import type { GameState } from "../mechanics/types";
import type { WorldItem } from "../mechanics/types";

const COLORS = {
  background: 0x1a2118,
  blocker: 0xa4495f,
  grid: 0x3a4534,
  player: 0xf0d33c,
  bin: 0x6b7280,
  binDepleted: 0x3f4450,
  loose: 0x6ecf7a,
  rewe: 0xcc3333,
  food: 0xd4a017,
  scenery: 0x5a6b52,
  focus: 0xffffff,
} as const;

type Handlers = {
  onMove: (direction: Direction) => void;
  onAction: () => void;
  onItemTap: (itemId: string) => void;
};

export class MapScene extends Phaser.Scene {
  private state!: GameState;
  private handlers!: Handlers;
  private readonly repeatController = new ArrowRepeatController();
  private player!: Phaser.GameObjects.Rectangle;
  private itemGfx = new Map<
    string,
    { rect: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }
  >();
  private mapGfx?: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "MapScene" });
  }

  init(data: { state: GameState; handlers: Handlers }): void {
    this.state = data.state;
    this.handlers = data.handlers;
  }

  create(): void {
    this.drawStaticMap();
    this.rebuildItems();
    this.player = this.add
      .rectangle(0, 0, CELL_SIZE * 0.7, CELL_SIZE * 0.7, COLORS.player)
      .setDepth(20);
    this.syncPlayer();

    const keyboard = this.input.keyboard;
    if (keyboard !== null) {
      keyboard.addCapture("UP,DOWN,LEFT,RIGHT,W,A,S,D,SPACE,ENTER");
      keyboard.on("keydown", this.handleKeyDown);
      keyboard.on("keyup", this.handleKeyUp);
    }
    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.removeKeyboardListeners,
    );
  }

  syncState(state: GameState): void {
    this.state = state;
    this.rebuildItems();
    this.syncPlayer();
  }

  syncLight(state: GameState): void {
    this.state = state;
    this.syncPlayer();
  }

  update(time: number): void {
    const direction = this.repeatController.update(time);
    if (direction !== undefined) {
      this.handlers.onMove(direction);
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "Space" || event.code === "Enter") {
      if (!event.repeat) this.handlers.onAction();
      return;
    }
    const code = wasdToArrow(event.code) ?? event.code;
    const direction = this.repeatController.keyDown(
      code,
      this.time.now,
      event.repeat,
    );
    if (direction !== undefined) {
      this.handlers.onMove(direction);
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const code = wasdToArrow(event.code) ?? event.code;
    this.repeatController.keyUp(code, this.time.now);
  };

  private readonly removeKeyboardListeners = (): void => {
    const keyboard = this.input.keyboard;
    if (keyboard !== null) {
      keyboard.off("keydown", this.handleKeyDown);
      keyboard.off("keyup", this.handleKeyUp);
    }
  };

  private drawStaticMap(): void {
    this.mapGfx?.destroy();
    const graphics = this.add.graphics().setDepth(0);
    graphics.fillStyle(COLORS.background);
    graphics.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    graphics.fillStyle(COLORS.blocker);
    for (const blockedCell of this.state.world.blockedCells) {
      const [column, row] = blockedCell.split(",").map(Number);
      graphics.fillRect(
        column * CELL_SIZE,
        row * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE,
      );
    }

    graphics.lineStyle(1, COLORS.grid, 0.45);
    for (let column = 0; column <= this.state.world.columns; column += 1) {
      const x = column * CELL_SIZE;
      graphics.lineBetween(x, 0, x, DESIGN_HEIGHT);
    }
    for (let row = 0; row <= this.state.world.rows; row += 1) {
      const y = row * CELL_SIZE;
      graphics.lineBetween(0, y, DESIGN_WIDTH, y);
    }
    this.mapGfx = graphics;
  }

  private syncPlayer(): void {
    const { column, row } = this.state.player.position;
    this.player.setPosition(
      column * CELL_SIZE + CELL_SIZE / 2,
      row * CELL_SIZE + CELL_SIZE / 2,
    );
  }

  private rebuildItems(): void {
    for (const gfx of this.itemGfx.values()) {
      gfx.rect.destroy();
      gfx.text.destroy();
    }
    this.itemGfx.clear();

    for (const item of this.state.world.items) {
      this.itemGfx.set(item.id, this.makeItem(item));
    }
  }

  private makeItem(item: WorldItem): {
    rect: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
  } {
    const w = item.size.columns * CELL_SIZE;
    const h = item.size.rows * CELL_SIZE;
    const px = item.position.column * CELL_SIZE;
    const py = item.position.row * CELL_SIZE;

    const rect = this.add
      .rectangle(px + w / 2, py + h / 2, w * 0.88, h * 0.88, colorFor(item))
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    if (this.state.focusedItemId === item.id) {
      rect.setStrokeStyle(2, COLORS.focus, 1);
    }

    rect.on("pointerdown", () => {
      if (
        item.type === "bin" ||
        item.type === "bottle-return" ||
        item.type === "food"
      ) {
        this.handlers.onItemTap(item.id);
      }
    });

    const label = shortLabel(item);
    const fontSize =
      item.type === "food"
        ? Math.max(9, Math.floor(CELL_SIZE * 0.42))
        : Math.max(8, Math.floor(CELL_SIZE * 0.55));
    const text = this.add
      .text(px + w / 2, py + h / 2, label, {
        fontSize: `${fontSize}px`,
        color: "#111111",
        fontFamily: "sans-serif",
        align: "center",
        wordWrap: item.type === "food" ? { width: w * 0.82 } : undefined,
      })
      .setOrigin(0.5)
      .setDepth(6);

    return { rect, text };
  }
}

function wasdToArrow(code: string): string | undefined {
  switch (code) {
    case "KeyW":
      return "ArrowUp";
    case "KeyS":
      return "ArrowDown";
    case "KeyA":
      return "ArrowLeft";
    case "KeyD":
      return "ArrowRight";
    default:
      return undefined;
  }
}

function colorFor(item: WorldItem): number {
  switch (item.type) {
    case "bin":
      return item.state === "depleted" ? COLORS.binDepleted : COLORS.bin;
    case "loose-bottle":
      return COLORS.loose;
    case "bottle-return":
      return COLORS.rewe;
    case "food":
      return COLORS.food;
    default:
      return COLORS.scenery;
  }
}

function shortLabel(item: WorldItem): string {
  switch (item.type) {
    case "bin":
      return item.state === "depleted" ? "…" : "BIN";
    case "loose-bottle":
      return "B";
    case "bottle-return":
      return "REWE";
    case "food":
      return MEAL_VENDOR_NAME;
    case "scenery":
      return item.id.startsWith("gate") ? "GATE" : "";
    default:
      return "";
  }
}
