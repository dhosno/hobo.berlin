/** Balance and layout knobs — tune without touching systems. */

export const config = {
  daysPerRun: 7,
  dayDurationMs: 60_000,
  preDayNightMs: 500,
  preDayDawnMs: 500,
  countdownSeconds: 3,

  /** Sketch grid (full target is 64 cols × aspect-derived rows). */
  gridColumns: 18,
  gridRows: 28,
  cellSize: 28,

  movementInitialRepeatDelayMs: 250,
  movementRepeatMs: 100,

  maxHealthUnits: 6,
  damage: {
    missedMeal: 2,
    binHazard: 1,
  },

  startingCashCents: 0,
  bottleValueCents: 25,
  /** Lower for sketch playability; spec default is 20. */
  minimumBottlesToRedeem: 8,

  binCount: 10,
  looseBottleCount: 8,
  binYieldMin: 1,
  binYieldMax: 5,
  binHazardChanceMin: 0.05,
  binHazardChanceMax: 0.15,

  reweWaitMinMs: 2_000,
  reweWaitMaxMs: 6_000,
  donerWaitMinMs: 2_000,
  donerWaitMaxMs: 4_000,
  mealPriceMinCents: 400,
  mealPriceMaxCents: 800,
  mealPriceStepCents: 100,

  characters: [
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
  ],
} as const;

export type GameConfig = typeof config;
