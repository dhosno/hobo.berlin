import Phaser from "phaser";

import {
  BOARD_ASSETS,
  itemAssetKey,
  type BoardAssetKey,
} from "../assets/board-assets";
import { CELL_SIZE, DESIGN_HEIGHT, DESIGN_WIDTH, MEAL_VENDOR_NAME } from "../config";
import type { Direction } from "../grid/movement";
import { ArrowRepeatController } from "../input/repeat";
import { terrainAt } from "../map/board-layout";
import type { GameState } from "../mechanics/types";
import type { WorldItem } from "../mechanics/types";

const COLORS = {
  grid: 0x3a4534,
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
  private player!: Phaser.GameObjects.Image;
  private itemGfx = new Map<
    string,
    {
      hitArea: Phaser.GameObjects.Rectangle;
      sprite?: Phaser.GameObjects.Image;
      text?: Phaser.GameObjects.Text;
    }
  >();
  private readonly itemAssetKeys = new Map<string, BoardAssetKey>();
  private mapGfx?: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "MapScene" });
  }

  init(data: { state: GameState; handlers: Handlers }): void {
    this.state = data.state;
    this.handlers = data.handlers;
  }

  preload(): void {
    for (const asset of Object.values(BOARD_ASSETS)) {
      this.load.image(asset.key, asset.url);
    }
  }

  create(): void {
    this.drawStaticMap();
    this.rebuildItems();
    this.player = this.add
      .image(0, 0, BOARD_ASSETS.hobo.key)
      .setDisplaySize(CELL_SIZE * 1.5, CELL_SIZE * 1.5)
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
    for (let row = 0; row < this.state.world.rows; row += 1) {
      for (let column = 0; column < this.state.world.columns; column += 1) {
        const terrain = BOARD_ASSETS[terrainAt(column, row)];
        this.add
          .image(
            column * CELL_SIZE + CELL_SIZE / 2,
            row * CELL_SIZE + CELL_SIZE / 2,
            terrain.key,
          )
          .setDisplaySize(CELL_SIZE, CELL_SIZE)
          .setDepth(0);
      }
    }

    const graphics = this.add.graphics().setDepth(0);
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
      gfx.hitArea.destroy();
      gfx.sprite?.destroy();
      gfx.text?.destroy();
    }
    this.itemGfx.clear();

    for (const item of this.state.world.items) {
      this.itemGfx.set(item.id, this.makeItem(item));
    }
  }

  private makeItem(item: WorldItem): {
    hitArea: Phaser.GameObjects.Rectangle;
    sprite?: Phaser.GameObjects.Image;
    text?: Phaser.GameObjects.Text;
  } {
    const w = item.size.columns * CELL_SIZE;
    const h = item.size.rows * CELL_SIZE;
    const px = item.position.column * CELL_SIZE;
    const py = item.position.row * CELL_SIZE;

    let assetKey = this.itemAssetKeys.get(item.id);
    if (assetKey === undefined) {
      assetKey = itemAssetKey(item);
      if (assetKey !== undefined) this.itemAssetKeys.set(item.id, assetKey);
    }

    const hitArea = this.add
      .rectangle(
        px + w / 2,
        py + h / 2,
        w * 0.92,
        h * 0.92,
        assetKey === undefined ? colorFor(item) : 0xffffff,
        assetKey === undefined ? 1 : 0,
      )
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    if (this.state.focusedItemId === item.id) {
      hitArea.setStrokeStyle(2, COLORS.focus, 1);
    }

    hitArea.on("pointerdown", () => {
      if (
        item.type === "bin" ||
        item.type === "bottle-return" ||
        item.type === "food"
      ) {
        this.handlers.onItemTap(item.id);
      }
    });

    if (assetKey !== undefined) {
      const sprite = this.add
        .image(px + w / 2, py + h / 2, BOARD_ASSETS[assetKey].key)
        .setDisplaySize(w * 0.92, h * 0.92)
        .setDepth(6);
      if (item.type === "bin" && item.state === "depleted") {
        sprite.setAlpha(0.38);
      }
      return { hitArea, sprite };
    }

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

    return { hitArea, text };
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
