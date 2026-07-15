import type { GridPosition } from "../map/tiled-contract";

export type GamePhase =
  | "instructions"
  | "day-ready"
  | "night"
  | "dawn"
  | "countdown"
  | "playing"
  | "day-resolution"
  | "won"
  | "lost";

export type VenueWait = "none" | "rewe-wait" | "food-wait";

export type ItemType =
  | "loose-bottle"
  | "bin"
  | "bottle-return"
  | "food"
  | "scenery";

export type WorldItem = {
  id: string;
  type: ItemType;
  position: GridPosition;
  size: { columns: number; rows: number };
  blocking: boolean;
  state?: "available" | "depleted";
  yieldBottles?: number;
  hazardChance?: number;
  assetKey?: string;
};

export type PlayerState = {
  characterId: string;
  position: GridPosition;
  healthUnits: number;
  bottles: number;
  cashCents: number;
};

export type WorldState = {
  columns: number;
  rows: number;
  items: WorldItem[];
  spawn: GridPosition;
  /** Static Tiled collision cells. */
  blockedCells: ReadonlySet<string>;
};

export type VenueWaitState = {
  kind: VenueWait;
  remainingMs: number;
  totalMs: number;
  bottlesBefore: number;
  cashBefore: number;
  fedBefore: boolean;
};

export type GameState = {
  phase: GamePhase;
  day: number;
  timeRemainingMs: number;
  fedToday: boolean;
  mealPriceCents: number;
  player: PlayerState;
  world: WorldState;
  runSeed: string;
  daySeed: string;
  venue: VenueWaitState;
  focusedItemId: string | null;
  toast: string;
  lastEvents: string[];
};

export type GameEvent =
  | "night-started"
  | "day-started"
  | "countdown-tick"
  | "loose-bottle-collected"
  | "bin-bottles"
  | "bin-burn"
  | "rewe-wait-started"
  | "bottles-depositing"
  | "cash-received"
  | "food-wait-started"
  | "food-bought"
  | "food-denied"
  | "rewe-denied"
  | "day-failed"
  | "day-survived"
  | "won"
  | "lost"
  | "move-closer"
  | "action-noop";
