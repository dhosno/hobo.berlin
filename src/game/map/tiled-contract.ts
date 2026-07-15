import { CELL_SIZE, GRID_COLUMNS, GRID_ROWS } from "../config";
import type { ItemType } from "../mechanics/types";

export interface GridPosition {
  column: number;
  row: number;
}

export interface GridBounds {
  columns: number;
  rows: number;
}

export type ParsedInteractable = {
  id: string;
  type: Exclude<ItemType, "bin" | "loose-bottle"> | "scenery";
  position: GridPosition;
  size: { columns: number; rows: number };
};

export interface ParsedMapContract {
  bounds: GridBounds;
  spawn: GridPosition;
  blockedCells: ReadonlySet<string>;
  /** Fixed venues/scenery from the Interactables layer (bins/loose spawn daily). */
  interactables: ParsedInteractable[];
}

export function blockedCellKey(position: GridPosition): string {
  return `${position.column},${position.row}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredObjectLayer(
  layers: Array<Record<string, unknown>>,
  name: "Spawn" | "Collision",
): Record<string, unknown> {
  const matches = layers.filter((layer) => layer.name === name);
  if (matches.length !== 1) {
    throw new Error(`Tiled map must contain exactly one ${name} object layer`);
  }
  const layer = matches[0]!;
  if (layer.type !== "objectgroup") {
    throw new Error(`${name} layer must be an object layer`);
  }
  return layer;
}

function optionalObjectLayer(
  layers: Array<Record<string, unknown>>,
  name: string,
): Record<string, unknown> | undefined {
  const matches = layers.filter((layer) => layer.name === name);
  if (matches.length === 0) return undefined;
  if (matches.length > 1) {
    throw new Error(`Tiled map must not contain duplicate ${name} layers`);
  }
  const layer = matches[0]!;
  if (layer.type !== "objectgroup") {
    throw new Error(`${name} layer must be an object layer`);
  }
  return layer;
}

function parseType(name: string): ParsedInteractable["type"] | null {
  const key = name.toLowerCase();
  if (key === "rewe" || key === "bottle-return") return "bottle-return";
  if (key === "food" || key === "doner" || key === "döner") return "food";
  if (key === "scenery" || key === "gate" || key === "kiosk" || key === "bench") {
    return "scenery";
  }
  return null;
}

export function parseTiledMap(_input: unknown): ParsedMapContract {
  if (!isRecord(_input) || _input.orientation !== "orthogonal") {
    throw new Error("Tiled map orientation must be orthogonal");
  }
  const map = _input;
  if (map.infinite !== false) {
    throw new Error("Tiled map must use finite geometry");
  }
  if (map.width !== GRID_COLUMNS || map.height !== GRID_ROWS) {
    throw new Error(`Tiled map dimensions must be ${GRID_COLUMNS}x${GRID_ROWS}`);
  }
  if (map.tilewidth !== CELL_SIZE || map.tileheight !== CELL_SIZE) {
    throw new Error(`Tiled map tile size must be ${CELL_SIZE}x${CELL_SIZE}`);
  }
  if (!Array.isArray(map.layers) || !map.layers.every(isRecord)) {
    throw new Error("Tiled map layers must be objects");
  }
  const layers = map.layers;
  const spawnLayer = requiredObjectLayer(layers, "Spawn");
  const collisionLayer = requiredObjectLayer(layers, "Collision");
  if (spawnLayer.visible === false) {
    throw new Error("Spawn layer must be visible");
  }
  if (collisionLayer.visible === false) {
    throw new Error("Collision layer must be visible");
  }
  if (!Array.isArray(spawnLayer.objects)) {
    throw new Error("Spawn layer objects must include one player point");
  }
  const spawnObjects: Array<Record<string, unknown>> = [];
  for (const value of spawnLayer.objects) {
    if (!isRecord(value)) {
      throw new Error("Spawn object must be a Tiled object");
    }
    if (value.visible === false) {
      const objectLabel =
        value.name === "player"
          ? "player"
          : `object${Object.hasOwn(value, "id") ? ` ${String(value.id)}` : ""}`;
      throw new Error(`Spawn ${objectLabel} must be visible`);
    }
    spawnObjects.push(value);
  }
  const players = spawnObjects.filter((object) => object.name === "player");
  if (players.length !== 1) {
    throw new Error("Spawn layer must contain exactly one player point");
  }
  const player = players[0]!;
  const playerX = player.x;
  const playerY = player.y;
  const alternatePlayerKinds = ["ellipse", "polygon", "polyline", "gid", "text"];
  if (
    player.point !== true ||
    alternatePlayerKinds.some((kind) => Object.hasOwn(player, kind)) ||
    typeof playerX !== "number" ||
    typeof playerY !== "number" ||
    !Number.isFinite(playerX) ||
    !Number.isFinite(playerY) ||
    playerX < 0 ||
    playerY < 0 ||
    playerX % CELL_SIZE !== 0 ||
    playerY % CELL_SIZE !== 0 ||
    playerX >= GRID_COLUMNS * CELL_SIZE ||
    playerY >= GRID_ROWS * CELL_SIZE
  ) {
    throw new Error("Spawn player must be a grid-aligned point inside the map");
  }
  const spawn = {
    column: playerX / CELL_SIZE,
    row: playerY / CELL_SIZE,
  };
  const blockedCells = new Set<string>();
  if (!Array.isArray(collisionLayer.objects)) {
    throw new Error("Collision layer objects must be an array");
  }
  for (const value of collisionLayer.objects) {
    if (!isRecord(value)) {
      throw new Error("Collision object must be a rectangle");
    }
    const collision = value;
    const objectLabel = Object.hasOwn(collision, "id")
      ? ` ${String(collision.id)}`
      : "";
    const alternateKinds = ["point", "ellipse", "polygon", "polyline", "gid", "text"];
    const { x, y, width, height } = collision;
    const hasNumericRectangle = [x, y, width, height].every(
      (coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate),
    );
    if (
      collision.visible === false ||
      alternateKinds.some((kind) => Object.hasOwn(collision, kind)) ||
      !hasNumericRectangle ||
      (width as number) <= 0 ||
      (height as number) <= 0 ||
      (x as number) < 0 ||
      (y as number) < 0 ||
      (x as number) % CELL_SIZE !== 0 ||
      (y as number) % CELL_SIZE !== 0 ||
      (width as number) % CELL_SIZE !== 0 ||
      (height as number) % CELL_SIZE !== 0 ||
      (x as number) + (width as number) > GRID_COLUMNS * CELL_SIZE ||
      (y as number) + (height as number) > GRID_ROWS * CELL_SIZE
    ) {
      throw new Error(
        `Collision object${objectLabel} must be a visible grid-aligned rectangle inside the map`,
      );
    }
    const firstColumn = (x as number) / CELL_SIZE;
    const firstRow = (y as number) / CELL_SIZE;

    for (
      let row = firstRow;
      row < firstRow + (height as number) / CELL_SIZE;
      row += 1
    ) {
      for (
        let column = firstColumn;
        column < firstColumn + (width as number) / CELL_SIZE;
        column += 1
      ) {
        blockedCells.add(blockedCellKey({ column, row }));
      }
    }
  }
  if (blockedCells.has(blockedCellKey(spawn))) {
    throw new Error("Spawn player cannot occupy a blocked cell");
  }

  const interactables: ParsedInteractable[] = [];
  const interactablesLayer = optionalObjectLayer(layers, "Interactables");
  if (interactablesLayer && interactablesLayer.visible !== false) {
    if (!Array.isArray(interactablesLayer.objects)) {
      throw new Error("Interactables layer objects must be an array");
    }
    for (const value of interactablesLayer.objects) {
      if (!isRecord(value) || value.visible === false) continue;
      const type = parseType(String(value.name ?? ""));
      if (type === null) continue;
      const { x, y, width, height } = value;
      if (
        typeof x !== "number" ||
        typeof y !== "number" ||
        typeof width !== "number" ||
        typeof height !== "number" ||
        x % CELL_SIZE !== 0 ||
        y % CELL_SIZE !== 0 ||
        width % CELL_SIZE !== 0 ||
        height % CELL_SIZE !== 0 ||
        width <= 0 ||
        height <= 0
      ) {
        throw new Error(
          `Interactable ${String(value.name)} must be a grid-aligned rectangle`,
        );
      }
      interactables.push({
        id: `${type}-${String(value.id ?? interactables.length)}`,
        type,
        position: { column: x / CELL_SIZE, row: y / CELL_SIZE },
        size: {
          columns: width / CELL_SIZE,
          rows: height / CELL_SIZE,
        },
      });
    }
  }

  return {
    bounds: { columns: GRID_COLUMNS, rows: GRID_ROWS },
    spawn,
    blockedCells,
    interactables,
  };
}
