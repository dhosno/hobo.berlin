# Workstream: Game mechanics

**Status:** Draft  
**Parent:** [`../../SPEC.md`](../../SPEC.md)  
**Work packages:** WP-1 (Collectibles), WP-2 (Economy), WP-3 (Run loop)  
**Depends on:** [`app-infra.md`](./app-infra.md) WP-0 shared  
**Does not own:** canvas/bootstrap, final art, SFX/dialogue copy

---

## Mission

Implement the playable rules: collect bottles, take risk on mystery bins, redeem Pfand, buy food, survive seven timed days with hearts, and reach clear win/lose states.

All balance values live in `config`. Prefer pure functions over UI-coupled logic.

---

## Core loop (reminder)

Explore → collect → redeem → eat → survive the day × 7 → benefits approved.

Daily fail: timer ends without `fedToday` → lose one heart.  
Hard fail: health → 0 anytime → lose.  
Win: resolve end of day 7 with health remaining.

---

## WP-1 — Collectibles

### Rules

| Interaction | Trigger | Effect |
| --- | --- | --- |
| Loose bottle | Enter cell | +1 bottle; remove item |
| Mystery bin | Adjacent + action | Exactly one outcome: bottles **or** hazard; then `depleted` |

- Bin bottle yield: random **1–5** (configurable).
- Hazard probability: **10%** provisional per bin.
- Hazard: **−1 health unit** (½ heart); no bottles.
- Outcomes are exclusive; never both.
- Outcome hidden until search; depleted bins ignore further actions until daily reset.
- Provide `resetCollectibles(world, seed)` (or equivalent) for WP-3 day advance.

### Acceptance

- Loose bottles collect once.
- Bin search updates inventory or health and depletes the bin.
- Distinct feedback hooks for bottle vs burn (placeholders OK).
- Reset API restores available bins/loose bottles without touching cash/hearts.

---

## WP-2 — Economy

### Rules

| Interaction | Trigger | Effect |
| --- | --- | --- |
| Bottle return | Adjacent + action | `cashCents += bottles × bottleValueCents`; bottles → 0 |
| Food | Adjacent + action | If affordable: deduct meal price, `fedToday = true`; else no-op + feedback |

- Bottle value: **€0.25** → store as integer cents (`25`).
- Meal price: **€5.00** provisional (`500` cents).
- MVP venues: **separate** bottle-return and food items (one purpose each).
- Second meal same day: no-op (no extra effect).
- Labels (`REWE`, Döner, …) are config strings only.

### Acceptance

- Redeem updates cash with no floating-point drift.
- Food purchase sets `fedToday` and deducts cash when affordable.
- Insufficient funds leaves state unchanged.
- HUD-readable fields update (`bottles`, `cashCents`, `fedToday`).

---

## WP-3 — Run loop

### Rules

| Topic | Rule |
| --- | --- |
| Days | Exactly 7 |
| Timer | Runs only in `phase === "playing"` after Start/Continue |
| Day length | Default `60_000` ms; config-driven; use elapsed time, not frame counts |
| Day end | If `!fedToday` → −2 health units; then next day or lose |
| Persist across days | `healthUnits`, `cashCents`, `bottles` |
| Reset each morning | `fedToday = false`, timer, collectibles via WP-1 API |
| Win | End of day 7 with `healthUnits > 0` |
| Lose | `healthUnits === 0` anytime (including mid-day hazard) |
| Restart | Clear run; new seed (coordinate with app-infra WP-4) |

### Acceptance

- Start does not run the clock before the player begins.
- Day expiry applies heart loss correctly with/without food.
- Seven-day progression works; win and lose phases emit.
- Zero health stops movement intent and timer.
- Next day keeps cash/bottles/health; resets feed flag and collectibles.

---

## Config knobs (minimum)

```ts
// illustrative — names may vary
{
  daysPerRun: 7,
  dayDurationMs: 60_000,
  maxHealthUnits: 6,
  damage: { missedMeal: 2, binHazard: 1 },
  bottleValueCents: 25,
  mealPriceCents: 500,
  binYieldMin: 1,
  binYieldMax: 5,
  binHazardChance: 0.1,
}
```

Randomness must be seedable/injectable for deterministic tests.

---

## Contracts with other workstreams

| Other stream | Contract |
| --- | --- |
| App infra | Mechanics consume move/action commands and write `GameState`; do not draw the canvas |
| Assets | Emit semantic events / state flags; do not require final sprites |
| Sound & dialogue | Prefer named events: `loose-bottle-collected`, `bin-bottles`, `bin-burn`, `bottles-redeemed`, `food-bought`, `food-denied`, `day-failed`, `day-survived`, `won`, `lost` |

---

## Out of scope

- Shelter / night destination as required objective
- Stinkiness, wait queues, hunger/energy bars
- Health recovery (dealer, medicine)
- PvP, scores, monetization
- Multiple maps / procedural Berlin

---

## Suggested ownership split

| Person | Package |
| --- | --- |
| A | WP-1 Collectibles |
| B | WP-2 Economy |
| C | WP-3 Run loop |

Integrate against shared WP-0; small PRs per package.
