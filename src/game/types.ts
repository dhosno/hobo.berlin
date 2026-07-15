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

export type Direction = "up" | "down" | "left" | "right";

export type ItemType =
  | "loose-bottle"
  | "bin"
  | "bottle-return"
  | "food"
  | "scenery";

export type GridPos = { x: number; y: number };

export type WorldItem = {
  id: string;
  type: ItemType;
  position: GridPos;
  size: { width: number; height: number };
  blocking: boolean;
  state?: "available" | "depleted";
  /** Hidden until searched (bins). */
  yieldBottles?: number;
  hazardChance?: number;
};

export type PlayerState = {
  characterId: string;
  position: GridPos;
  healthUnits: number;
  bottles: number;
  cashCents: number;
};

export type WorldState = {
  width: number;
  height: number;
  items: WorldItem[];
  spawn: GridPos;
};

export type VenueWaitState = {
  kind: VenueWait;
  remainingMs: number;
  totalMs: number;
  /** Snapshot to restore if day ends mid-wait. */
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
  | "bottle-collected"
  | "got-burned"
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
