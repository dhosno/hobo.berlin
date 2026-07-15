import {
  BIN_COUNT,
  BIN_HAZARD_CHANCE_MAX,
  BIN_HAZARD_CHANCE_MIN,
  BIN_YIELD_MAX,
  BIN_YIELD_MIN,
  BOTTLE_VALUE_CENTS,
  LOOSE_BOTTLE_COUNT,
} from "../config";
import {
  blockedCellKey,
  type GridPosition,
  type ParsedMapContract,
} from "../map/tiled-contract";
import type { Rng } from "./rng";
import type { WorldItem, WorldState } from "./types";

export function cellsOf(item: WorldItem): GridPosition[] {
  const cells: GridPosition[] = [];
  for (let row = 0; row < item.size.rows; row += 1) {
    for (let column = 0; column < item.size.columns; column += 1) {
      cells.push({
        column: item.position.column + column,
        row: item.position.row + row,
      });
    }
  }
  return cells;
}

export function isAdjacent(a: GridPosition, b: GridPosition): boolean {
  return Math.abs(a.column - b.column) + Math.abs(a.row - b.row) === 1;
}

export function isAdjacentToItem(
  pos: GridPosition,
  item: WorldItem,
): boolean {
  return cellsOf(item).some((cell) => isAdjacent(pos, cell));
}

export function occupies(item: WorldItem, pos: GridPosition): boolean {
  return cellsOf(item).some(
    (cell) => cell.column === pos.column && cell.row === pos.row,
  );
}

export function itemAt(
  world: WorldState,
  pos: GridPosition,
): WorldItem | undefined {
  return world.items.find((item) => occupies(item, pos));
}

export function nearestInteractable(
  world: WorldState,
  pos: GridPosition,
): WorldItem | undefined {
  return world.items.find(
    (item) =>
      (item.type === "bin" ||
        item.type === "bottle-return" ||
        item.type === "food") &&
      item.state !== "depleted" &&
      isAdjacentToItem(pos, item),
  );
}

/** Static Tiled blockers + currently blocking items. */
export function movementBlockedSet(world: WorldState): ReadonlySet<string> {
  const blocked = new Set(world.blockedCells);
  for (const item of world.items) {
    if (!item.blocking) continue;
    for (const cell of cellsOf(item)) {
      blocked.add(blockedCellKey(cell));
    }
  }
  return blocked;
}

export function worldFromParsedMap(map: ParsedMapContract): WorldState {
  const items: WorldItem[] = map.interactables.map((entry) => ({
    id: entry.id,
    type: entry.type,
    position: { ...entry.position },
    size: { ...entry.size },
    blocking: true,
    state: "available" as const,
  }));

  return {
    columns: map.bounds.columns,
    rows: map.bounds.rows,
    items,
    spawn: { ...map.spawn },
    blockedCells: map.blockedCells,
  };
}

export function spawnDailyCollectibles(
  world: WorldState,
  rng: Rng,
): WorldItem[] {
  const reserved = new Set<string>();
  const mark = (pos: GridPosition) => reserved.add(blockedCellKey(pos));

  mark(world.spawn);
  for (const key of world.blockedCells) reserved.add(key);

  const fixed = world.items.filter(
    (item) =>
      item.type === "scenery" ||
      item.type === "bottle-return" ||
      item.type === "food",
  );
  for (const item of fixed) {
    for (const cell of cellsOf(item)) mark(cell);
  }

  const free: GridPosition[] = [];
  for (let row = 0; row < world.rows; row += 1) {
    for (let column = 0; column < world.columns; column += 1) {
      if (!reserved.has(blockedCellKey({ column, row }))) {
        free.push({ column, row });
      }
    }
  }

  const shuffled = rng.shuffle(free);
  const collectibles: WorldItem[] = [];
  let i = 0;

  for (let n = 0; n < BIN_COUNT && i < shuffled.length; n += 1, i += 1) {
    const pos = shuffled[i]!;
    collectibles.push({
      id: `bin-${n}`,
      type: "bin",
      position: pos,
      size: { columns: 1, rows: 1 },
      blocking: true,
      state: "available",
      yieldBottles: rng.int(BIN_YIELD_MIN, BIN_YIELD_MAX),
      hazardChance:
        BIN_HAZARD_CHANCE_MIN +
        rng.next() * (BIN_HAZARD_CHANCE_MAX - BIN_HAZARD_CHANCE_MIN),
    });
  }

  for (
    let n = 0;
    n < LOOSE_BOTTLE_COUNT && i < shuffled.length;
    n += 1, i += 1
  ) {
    collectibles.push({
      id: `loose-${n}`,
      type: "loose-bottle",
      position: shuffled[i]!,
      size: { columns: 1, rows: 1 },
      blocking: false,
      state: "available",
    });
  }

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
    bottles * BOTTLE_VALUE_CENTS +
    items
      .filter((i) => i.type === "bin" && i.state === "available")
      .reduce(
        (sum, i) => sum + (i.yieldBottles ?? 0) * BOTTLE_VALUE_CENTS,
        0,
      ) +
    items.filter((i) => i.type === "loose-bottle").length * BOTTLE_VALUE_CENTS;

  if (potential >= mealPriceCents) return items;

  return items.map((item) =>
    item.type === "bin"
      ? { ...item, yieldBottles: BIN_YIELD_MAX, hazardChance: 0.05 }
      : item,
  );
}
