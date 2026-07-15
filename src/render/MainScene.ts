import Phaser from "phaser";
import { config } from "../config";
import type { GameState, GridPos, WorldItem } from "../game/types";
import { itemAt } from "../game/world";

const COLORS: Record<string, number> = {
  floor: 0x2a3326,
  grid: 0x3a4534,
  player: 0xf0d33c,
  bin: 0x6b7280,
  binDepleted: 0x3f4450,
  loose: 0x6ecf7a,
  rewe: 0xcc3333,
  food: 0xd4a017,
  scenery: 0x5a6b52,
  focus: 0xffffff,
};

type SceneHandlers = {
  onItemTap: (itemId: string) => void;
  onCellTap: (pos: GridPos) => void;
};

export class MainScene extends Phaser.Scene {
  private state!: GameState;
  private cell = config.cellSize;
  private itemGfx = new Map<
    string,
    { rect: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }
  >();
  private playerGfx!: Phaser.GameObjects.Rectangle;
  private handlers!: SceneHandlers;
  private worldW = 0;
  private worldH = 0;

  constructor() {
    super("main");
  }

  init(data: { state: GameState } & SceneHandlers): void {
    this.state = data.state;
    this.handlers = {
      onItemTap: data.onItemTap,
      onCellTap: data.onCellTap,
    };
  }

  create(): void {
    this.worldW = config.gridColumns * this.cell;
    this.worldH = config.gridRows * this.cell;
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.setBackgroundColor(COLORS.floor);

    this.drawGrid();

    // Full-map hit target for click-to-walk (below items).
    const ground = this.add
      .rectangle(
        this.worldW / 2,
        this.worldH / 2,
        this.worldW,
        this.worldH,
        COLORS.floor,
        0.001,
      )
      .setInteractive()
      .setDepth(0);
    ground.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const x = Math.floor(worldPoint.x / this.cell);
      const y = Math.floor(worldPoint.y / this.cell);
      if (x < 0 || y < 0 || x >= config.gridColumns || y >= config.gridRows) return;

      const item = itemAt(this.state.world, { x, y });
      if (
        item &&
        (item.type === "bin" ||
          item.type === "bottle-return" ||
          item.type === "food")
      ) {
        this.handlers.onItemTap(item.id);
        return;
      }
      this.handlers.onCellTap({ x, y });
    });

    this.playerGfx = this.add
      .rectangle(0, 0, this.cell * 0.72, this.cell * 0.72, COLORS.player)
      .setDepth(20);
    this.rebuildItems();
    this.syncPlayer();
    this.cameras.main.setRoundPixels(true);
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

  private drawGrid(): void {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(COLORS.floor, 1);
    g.fillRect(0, 0, this.worldW, this.worldH);
    g.lineStyle(1, COLORS.grid, 0.4);
    for (let x = 0; x <= config.gridColumns; x += 1) {
      g.lineBetween(x * this.cell, 0, x * this.cell, this.worldH);
    }
    for (let y = 0; y <= config.gridRows; y += 1) {
      g.lineBetween(0, y * this.cell, this.worldW, y * this.cell);
    }
  }

  private syncPlayer(): void {
    if (!this.playerGfx || !this.state) return;
    const { x, y } = this.state.player.position;
    this.playerGfx.setPosition(
      x * this.cell + this.cell / 2,
      y * this.cell + this.cell / 2,
    );
  }

  private rebuildItems(): void {
    for (const gfx of this.itemGfx.values()) {
      gfx.rect.destroy();
      gfx.text.destroy();
    }
    this.itemGfx.clear();
    if (!this.state) return;

    for (const item of this.state.world.items) {
      this.itemGfx.set(item.id, this.makeItem(item));
    }
  }

  private makeItem(item: WorldItem): {
    rect: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
  } {
    const px = item.position.x * this.cell;
    const py = item.position.y * this.cell;
    const w = item.size.width * this.cell;
    const h = item.size.height * this.cell;

    const rect = this.add
      .rectangle(px + w / 2, py + h / 2, w * 0.88, h * 0.88, colorFor(item))
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    if (this.state.focusedItemId === item.id) {
      rect.setStrokeStyle(3, COLORS.focus, 1);
    }

    rect.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      if (
        item.type === "bin" ||
        item.type === "bottle-return" ||
        item.type === "food"
      ) {
        this.handlers.onItemTap(item.id);
      } else if (item.type === "loose-bottle") {
        this.handlers.onCellTap({ ...item.position });
      }
    });

    const text = this.add
      .text(px + w / 2, py + h / 2, shortLabel(item), {
        fontSize: `${Math.max(9, Math.floor(this.cell * 0.32))}px`,
        color: "#111111",
        fontFamily: "sans-serif",
      })
      .setOrigin(0.5)
      .setDepth(6);

    return { rect, text };
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
      return "FOOD";
    case "scenery":
      return item.id === "gate" ? "GATE" : "";
    default:
      return "";
  }
}
