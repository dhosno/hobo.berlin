import { config } from "../config";
import type { GridPos, WorldItem, WorldState } from "./types";
import type { Rng } from "./rng";

export function inBounds(
  pos: GridPos,
  width: number = config.gridColumns,
  height: number = config.gridRows,
): boolean {
  return pos.x >= 0 && pos.y >= 0 && pos.x < width && pos.y < height;
}

export function cellsOf(item: WorldItem): GridPos[] {
  const cells: GridPos[] = [];
  for (let dy = 0; dy < item.size.height; dy += 1) {
    for (let dx = 0; dx < item.size.width; dx += 1) {
      cells.push({ x: item.position.x + dx, y: item.position.y + dy });
    }
  }
  return cells;
}

export function isAdjacent(a: GridPos, b: GridPos): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx + dy === 1;
}

export function isAdjacentToItem(pos: GridPos, item: WorldItem): boolean {
  return cellsOf(item).some((c) => isAdjacent(pos, c));
}

export function occupies(item: WorldItem, pos: GridPos): boolean {
  return cellsOf(item).some((c) => c.x === pos.x && c.y === pos.y);
}

export function blockedAt(world: WorldState, pos: GridPos): boolean {
  if (!inBounds(pos, world.width, world.height)) return true;
  return world.items.some((item) => item.blocking && occupies(item, pos));
}

export function itemAt(world: WorldState, pos: GridPos): WorldItem | undefined {
  return world.items.find((item) => occupies(item, pos));
}

export function nearestInteractable(
  world: WorldState,
  pos: GridPos,
): WorldItem | undefined {
  const candidates = world.items.filter(
    (item) =>
      (item.type === "bin" ||
        item.type === "bottle-return" ||
        item.type === "food") &&
      item.state !== "depleted" &&
      isAdjacentToItem(pos, item),
  );
  return candidates[0];
}

/** Sketch map: Brandenburg Gate flavor — venues + scenery fixed; bins/bottles spawn daily. */
export function createBaseWorld(): WorldState {
  const width = config.gridColumns;
  const height = config.gridRows;
  const spawn: GridPos = { x: 2, y: height - 3 };

  const fixed: WorldItem[] = [
    {
      id: "gate",
      type: "scenery",
      position: { x: 6, y: 1 },
      size: { width: 6, height: 2 },
      blocking: true,
    },
    {
      id: "rewe",
      type: "bottle-return",
      position: { x: 1, y: 8 },
      size: { width: 3, height: 2 },
      blocking: true,
      state: "available",
    },
    {
      id: "doner",
      type: "food",
      position: { x: 14, y: 8 },
      size: { width: 3, height: 2 },
      blocking: true,
      state: "available",
    },
    {
      id: "kiosk",
      type: "scenery",
      position: { x: 8, y: 14 },
      size: { width: 2, height: 2 },
      blocking: true,
    },
    {
      id: "bench",
      type: "scenery",
      position: { x: 4, y: 18 },
      size: { width: 2, height: 1 },
      blocking: true,
    },
  ];

  return { width, height, items: fixed, spawn };
}

export function spawnDailyCollectibles(
  world: WorldState,
  rng: Rng,
): WorldItem[] {
  const reserved = new Set<string>();
  const mark = (pos: GridPos) => reserved.add(`${pos.x},${pos.y}`);

  mark(world.spawn);
  for (const item of world.items) {
    for (const c of cellsOf(item)) mark(c);
  }

  const free: GridPos[] = [];
  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) {
      if (!reserved.has(`${x},${y}`)) free.push({ x, y });
    }
  }

  const shuffled = rng.shuffle(free);
  const collectibles: WorldItem[] = [];
  let i = 0;

  for (let n = 0; n < config.binCount && i < shuffled.length; n += 1, i += 1) {
    const pos = shuffled[i]!;
    const hazardChance =
      config.binHazardChanceMin +
      rng.next() * (config.binHazardChanceMax - config.binHazardChanceMin);
    collectibles.push({
      id: `bin-${n}`,
      type: "bin",
      position: pos,
      size: { width: 1, height: 1 },
      blocking: true,
      state: "available",
      yieldBottles: rng.int(config.binYieldMin, config.binYieldMax),
      hazardChance,
    });
  }

  for (
    let n = 0;
    n < config.looseBottleCount && i < shuffled.length;
    n += 1, i += 1
  ) {
    const pos = shuffled[i]!;
    collectibles.push({
      id: `loose-${n}`,
      type: "loose-bottle",
      position: pos,
      size: { width: 1, height: 1 },
      blocking: false,
      state: "available",
    });
  }

  // Keep fixed venues/scenery; replace previous day's collectibles.
  const fixed = world.items.filter(
    (item) =>
      item.type === "scenery" ||
      item.type === "bottle-return" ||
      item.type === "food",
  );

  return [...fixed, ...collectibles];
}

export function ensureAffordableDay(
  items: WorldItem[],
  mealPriceCents: number,
  cashCents: number,
  bottles: number,
): WorldItem[] {
  const potential =
    cashCents +
    bottles * config.bottleValueCents +
    items
      .filter((i) => i.type === "bin" && i.state === "available")
      .reduce((sum, i) => sum + (i.yieldBottles ?? 0) * config.bottleValueCents, 0) +
    items.filter((i) => i.type === "loose-bottle").length *
      config.bottleValueCents;

  if (potential >= mealPriceCents) return items;

  // Soft fix: bump a few bins to max yield.
  return items.map((item) => {
    if (item.type !== "bin") return item;
    return { ...item, yieldBottles: config.binYieldMax, hazardChance: 0.05 };
  });
}
