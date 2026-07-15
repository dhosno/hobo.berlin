import {
  BIN_YIELD_MAX,
  BOTTLE_VALUE_CENTS,
} from "../config";
import type { DayBalance } from "./day-balance";
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
    ...(entry.assetKey ? { assetKey: entry.assetKey } : {}),
  }));

  return {
    columns: map.bounds.columns,
    rows: map.bounds.rows,
    items,
    spawn: { ...map.spawn },
    blockedCells: map.blockedCells,
  };
}

export function mapBottleValueCents(items: readonly WorldItem[]): number {
  let cents = 0;
  for (const item of items) {
    if (item.type === "loose-bottle") {
      cents += BOTTLE_VALUE_CENTS;
      continue;
    }
    if (item.type === "bin" && item.state !== "depleted") {
      // Count full yield for solvability; burns are risk on top of that.
      cents += (item.yieldBottles ?? 0) * BOTTLE_VALUE_CENTS;
    }
  }
  return cents;
}

export function dayPotentialCents(
  items: readonly WorldItem[],
  cashCents: number,
  bottles: number,
): number {
  return cashCents + bottles * BOTTLE_VALUE_CENTS + mapBottleValueCents(items);
}

export function spawnDailyCollectibles(
  world: WorldState,
  rng: Rng,
  balance: DayBalance,
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

  for (let n = 0; n < balance.binCount && i < shuffled.length; n += 1, i += 1) {
    const pos = shuffled[i]!;
    const hazardChance =
      balance.hazardChanceMin +
      rng.next() * (balance.hazardChanceMax - balance.hazardChanceMin);
    collectibles.push({
      id: `bin-${n}`,
      type: "bin",
      position: pos,
      size: { columns: 1, rows: 1 },
      blocking: true,
      state: "available",
      yieldBottles: rng.int(balance.binYieldMin, balance.binYieldMax),
      hazardChance,
    });
  }

  for (
    let n = 0;
    n < balance.looseBottleCount && i < shuffled.length;
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

function boostSafeBinYields(items: WorldItem[], amount: number): WorldItem[] {
  let remaining = amount;
  return items.map((item) => {
    if (remaining <= 0 || item.type !== "bin") {
      return item;
    }
    const current = item.yieldBottles ?? 0;
    const room = Math.max(0, BIN_YIELD_MAX + 2 - current);
    const add = Math.min(room, remaining);
    if (add <= 0) return item;
    remaining -= add;
    return { ...item, yieldBottles: current + add };
  });
}

function trimSafeBinYields(items: WorldItem[], removeBottles: number): WorldItem[] {
  let remaining = removeBottles;
  const order = items
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) => item.type === "bin" && (item.yieldBottles ?? 0) > 1,
    )
    .sort(
      (a, b) => (b.item.yieldBottles ?? 0) - (a.item.yieldBottles ?? 0),
    );

  const next = [...items];
  for (const { index, item } of order) {
    if (remaining <= 0) break;
    const current = item.yieldBottles ?? 0;
    const cut = Math.min(current - 1, remaining);
    if (cut <= 0) continue;
    remaining -= cut;
    next[index] = { ...item, yieldBottles: current - cut };
  }
  return next;
}

function dropLooseBottles(items: WorldItem[], count: number): WorldItem[] {
  if (count <= 0) return items;
  let left = count;
  const out: WorldItem[] = [];
  for (const item of items) {
    if (left > 0 && item.type === "loose-bottle") {
      left -= 1;
      continue;
    }
    out.push(item);
  }
  return out;
}

/**
 * Guarantee the day is winnable, then soft-cap surplus so early days stay
 * generous without trivializing Mustafa Kebap.
 */
export function balanceDayEconomy(
  items: WorldItem[],
  mealPriceCents: number,
  cashCents: number,
  bottles: number,
  balance: DayBalance,
): WorldItem[] {
  const minNeed = Math.ceil(mealPriceCents * balance.surplusRatioMin);
  const maxNeed = Math.ceil(mealPriceCents * balance.surplusRatioMax);

  let next = items;
  let potential = dayPotentialCents(next, cashCents, bottles);

  let guard = 0;
  while (potential < minNeed && guard < 24) {
    const shortfallBottles = Math.ceil((minNeed - potential) / BOTTLE_VALUE_CENTS);
    next = boostSafeBinYields(next, shortfallBottles);
    const after = dayPotentialCents(next, cashCents, bottles);
    if (after <= potential) break;
    potential = after;
    guard += 1;
  }

  potential = dayPotentialCents(next, cashCents, bottles);
  if (potential > maxNeed) {
    const excessBottles = Math.floor(
      (potential - maxNeed) / BOTTLE_VALUE_CENTS,
    );
    if (excessBottles > 0) {
      const loose = next.filter((i) => i.type === "loose-bottle").length;
      const dropLoose = Math.min(
        Math.floor(excessBottles / 2),
        Math.max(0, loose - 3),
      );
      next = dropLooseBottles(next, dropLoose);
      const stillExcess = Math.floor(
        (dayPotentialCents(next, cashCents, bottles) - maxNeed) /
          BOTTLE_VALUE_CENTS,
      );
      if (stillExcess > 0) {
        next = trimSafeBinYields(next, stillExcess);
      }
    }
  }

  // Final hard guarantee: never leave the day impossible.
  potential = dayPotentialCents(next, cashCents, bottles);
  if (potential < mealPriceCents) {
    next = boostSafeBinYields(
      next,
      Math.ceil((mealPriceCents - potential) / BOTTLE_VALUE_CENTS),
    );
  }

  return next;
}
