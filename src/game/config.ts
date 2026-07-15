/** Phase 1 layout: vertical sketch grid (from mechanics branch). */

export const GRID_COLUMNS = 18;
export const GRID_ROWS = 28;
export const CELL_SIZE = 28;
export const DESIGN_WIDTH = GRID_COLUMNS * CELL_SIZE; // 504
export const DESIGN_HEIGHT = GRID_ROWS * CELL_SIZE; // 784

export const INITIAL_REPEAT_DELAY_MS = 180;
export const REPEAT_INTERVAL_MS = 100;
/** Debounce for ACT / Space / item tap so one interact cannot fire twice. */
export const ACTION_DEBOUNCE_MS = 280;

/** Economy / run balance (from mechanics sketch + game-mechanics.md). */
export const DAYS_PER_RUN = 7;
export const DAY_DURATION_MS = 60_000;
export const PRE_DAY_NIGHT_MS = 1_100;
export const PRE_DAY_DAWN_MS = 1_100;
export const COUNTDOWN_SECONDS = 3;

export const MAX_HEALTH_UNITS = 6;
export const DAMAGE_MISSED_MEAL = 2;
export const DAMAGE_BIN_HAZARD = 1;

export const STARTING_CASH_CENTS = 0;
export const BOTTLE_VALUE_CENTS = 25;
export const MINIMUM_BOTTLES_TO_REDEEM = 20;

export const BIN_COUNT = 12;
export const LOOSE_BOTTLE_COUNT = 10;
export const BIN_YIELD_MIN = 1;
export const BIN_YIELD_MAX = 5;
export const BIN_HAZARD_CHANCE_MIN = 0.05;
export const BIN_HAZARD_CHANCE_MAX = 0.15;

export const REWE_WAIT_MIN_MS = 2_000;
export const REWE_WAIT_MAX_MS = 12_000;
export const DONER_WAIT_MIN_MS = 2_000;
export const DONER_WAIT_MAX_MS = 5_000;
export const MEAL_PRICE_MIN_CENTS = 400;
export const MEAL_PRICE_MAX_CENTS = 800;
export const MEAL_PRICE_STEP_CENTS = 100;
/** Player-facing name for the food stand. */
export const MEAL_VENDOR_NAME = "Mustafa Kebap";

export const ACTIVE_MAP_URL = new URL("../assets/maps/phase-1.json", import.meta.url);

export const CHARACTERS = [
  {
    id: "prompt",
    name: "Prompt engineer",
    blurb: "Fired because loop engineering is all the rage.",
  },
  {
    id: "marketing",
    name: "Head of marketing",
    blurb: "Replaced by an end-to-end workflow.",
  },
  {
    id: "qa",
    name: "QA engineer",
    blurb: "Playwright scripts in three seconds. Who needs you?",
  },
] as const;
