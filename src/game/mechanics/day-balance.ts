import {
  BIN_HAZARD_CHANCE_MAX,
  BIN_HAZARD_CHANCE_MIN,
  DAYS_PER_RUN,
  MEAL_PRICE_STEP_CENTS,
} from "../config";

export type DayBalance = {
  day: number;
  /** 0 on day 1 → 1 on final day. */
  progress: number;
  looseBottleCount: number;
  binCount: number;
  binYieldMin: number;
  binYieldMax: number;
  /** Per-bin hidden burn probability range (tuned hot for short days). */
  hazardChanceMin: number;
  hazardChanceMax: number;
  mealMinCents: number;
  mealMaxCents: number;
  /**
   * Map+carry value must cover at least meal × this (after cash/bottles on hand).
   * Higher early → gentler; closer to 1.0 late → tight.
   */
  surplusRatioMin: number;
  /** Soft cap so the day is not trivially oversupplied. */
  surplusRatioMax: number;
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function roundToStep(cents: number, step: number): number {
  return Math.round(cents / step) * step;
}

/** Day 1 is generous; day 7 is tight but still solvable. */
export function dayBalance(day: number): DayBalance {
  const clamped = Math.max(1, Math.min(DAYS_PER_RUN, day));
  const progress =
    DAYS_PER_RUN <= 1 ? 0 : (clamped - 1) / (DAYS_PER_RUN - 1);

  const binYieldMin = Math.max(1, Math.round(lerp(3, 1, progress)));
  const binYieldMax = Math.max(
    binYieldMin,
    Math.round(lerp(5, 3, progress)),
  );

  // Day 1 still risky; day 7 bins burn often.
  const hazardChanceMin = lerp(BIN_HAZARD_CHANCE_MIN, 0.28, progress);
  const hazardChanceMax = lerp(0.28, BIN_HAZARD_CHANCE_MAX, progress);

  return {
    day: clamped,
    progress,
    looseBottleCount: Math.round(lerp(14, 6, progress)),
    binCount: Math.round(lerp(13, 10, progress)),
    binYieldMin,
    binYieldMax,
    hazardChanceMin,
    hazardChanceMax: Math.max(hazardChanceMin, hazardChanceMax),
    mealMinCents: roundToStep(lerp(400, 700, progress), MEAL_PRICE_STEP_CENTS),
    mealMaxCents: roundToStep(lerp(500, 800, progress), MEAL_PRICE_STEP_CENTS),
    surplusRatioMin: lerp(1.35, 1.08, progress),
    surplusRatioMax: lerp(1.85, 1.28, progress),
  };
}

export function rollMealPriceCents(
  balance: DayBalance,
  rng: { int: (min: number, max: number) => number },
): number {
  const steps =
    (balance.mealMaxCents - balance.mealMinCents) / MEAL_PRICE_STEP_CENTS;
  const stepIndex = rng.int(0, Math.max(0, steps));
  return balance.mealMinCents + stepIndex * MEAL_PRICE_STEP_CENTS;
}
