# Workstream: Game mechanics

**Status:** Draft — UX feedback integrated
**Parent:** [`../archive/SPEC.md`](../archive/SPEC.md)
**Work packages:** WP-1 (Collectibles), WP-2 (Economy), WP-3 (Run loop)
**Depends on:** [`app-infra.md`](./app-infra.md) WP-0 shared
**Does not own:** canvas/bootstrap, final art, sound-asset production, dialogue copy

---

## Mission

Implement the complete playable loop: explain the game before it begins, start and display seven timed days, collect bottles, take risks on mystery bins, redeem Pfand at REWE, buy food at a Döner stand, and reach clear win/lose states.

All balance values live in configuration. Randomness must be seedable, and mechanics must emit semantic events for UI, animation, and audio rather than implementing those effects directly.

## Terminology and baseline rules

- One complete **run** contains seven **days**. “Round” and “day” refer to the same unit; the interface uses **Day** consistently.
- A day lasts 60 seconds by default.
- The daily objective is to buy food before the timer expires.
- Missing food costs one heart. A bin burn costs half a heart.
- Health reaching zero ends the run immediately.
- Completing day seven with health remaining wins the run.
- The player starts with three hearts, zero bottles, and configured starting cash.

## Player experience and state flow

The site must never begin the game or timer automatically.

```text
instructions
  -> day-ready
  -> night-transition
  -> dawn-transition
  -> countdown (3, 2, 1)
  -> playing
  -> day-resolution
       -> day-ready for the next day
       -> won
       -> lost
```

A venue wait is a substate of `playing`: movement and other interactions are locked, but the day timer continues.

### Instructions screen

On first load, show the game, but keep it inactive behind or beneath a first-screen instructions panel. The panel contains approximately ten short lines covering:

1. Survive seven days until the Agentur für Arbeit approves your money.
2. Each day gives you about one minute.
3. Move one grid square at a time with the joystick, arrow keys, or WASD.
4. Search garbage bins for returnable bottles.
5. A bin contains bottles or a burn hazard; the result is hidden.
6. A burn costs half a heart.
7. Collect enough bottles and redeem them at REWE for cash.
8. REWE queues take time while the day timer keeps running.
9. Spend the cash at the Döner stand and wait for the food.
10. Eat before time runs out or lose one heart.

The panel ends with a prominent **Start game** button. Pressing it unlocks browser audio and begins the day-one start sequence; it does not jump directly into the live timer.

### Starting each day

- Every day has an explicit ready state.
- Day one uses **Start game** on the instructions screen.
- After each day-resolution summary, the player presses **Start day N** to begin the next day.
- Until that action, movement, venue actions, and the day timer remain stopped.
- The top HUD always shows `Day N / 7` and the current phase (`Ready`, `Night`, `Dawn`, `Get ready`, `Playing`, or `Waiting`).

### Night, dawn, and countdown

After the player starts a day:

1. Fade the game surface to black and show a small pixel-art moon.
2. Fade from black to a light-yellow daytime tint and show a small pixel-art sun.
3. Show a centered `3`, `2`, `1` countdown.
4. Remove the countdown, set the phase to `playing`, and start the configured day timer.

The timer must not run during the night animation, dawn animation, or countdown. Transition durations are configurable. Reduced-motion mode may replace fades with static moon/day frames, but it preserves the same phase order and timer gate.

### HUD

The top HUD remains visible throughout a run and shows:

- `Day N / 7`;
- current phase or venue wait status;
- countdown or time remaining;
- hearts, including half hearts;
- bottle count;
- cash in euros;
- the current Döner price;
- whether the player has eaten today.

## Grid, navigation, and controls

### Grid geometry

- The entire edge-to-edge game canvas is a grid of square cells.
- The logical grid is 64 cells wide.
- For the portrait 9:16 mobile target, derive the row count from the drawable aspect ratio: `round(64 × canvasHeight / canvasWidth)`, approximately 114 rows at exactly 9:16.
- Recalculate scale on viewport resize without changing authoritative grid coordinates.
- The canvas fills the phone viewport; HUD and controls are overlays and do not reserve layout space.
- Player, bin, venue, and obstacle placement must be inside bounds, non-overlapping where required, and reachable from the player spawn.

### Directional input

- A directional tap or key press moves the character exactly one cell up, down, left, or right.
- Holding a direction repeats steps after a configurable initial delay and at a configurable repeat interval.
- Collision and map bounds are checked for every repeated step.
- Arrow keys and WASD remain desktop equivalents.

### Touch overlays

- A low-opacity four-way virtual joystick sits over the bottom-left of the canvas.
- A low-opacity context/action button sits over the bottom-right.
- Both controls keep full-size hit targets even when visually subtle.
- A pressed or dragged control becomes clearly visible, then returns to its resting opacity on release.
- Controls must not become completely undiscoverable and must respect device safe-area insets.
- The action button, Space, and Enter dispatch the same normalized `action` command.

### Direct object interaction

- Tapping/clicking a nearby bin once focuses it and shows an interaction highlight or prompt.
- Tapping/clicking the same focused bin again triggers the interaction. A desktop double-click is equivalent.
- Pressing the right-side action button while adjacent triggers the focused or nearest eligible item in one press.
- Tapping an item while not adjacent shows a “move closer” prompt; it does not pathfind.
- Input is debounced so double-click, touch, and action-button events cannot resolve the same interaction twice.

## WP-1 — Collectibles

### Daily spawn and reset

At the start of each day, before the ready state is shown:

- Reset or respawn every mystery bin and loose bottle.
- Place them on valid, unique cells allowed by the map configuration.
- Do not place them on blocking footprints, venues, the player spawn, or unreachable cells.
- Reroll each bin's hidden bottle yield and burn probability from configured ranges.
- Use a day-derived seed so a test can reproduce positions, values, probabilities, and outcomes.
- Ensure the map contains enough potential bottle value to afford that day's meal; generation must not make the day impossible before the player acts.

### Collection rules

| Interaction | Trigger | Effect |
| --- | --- | --- |
| Loose bottle | Enter cell | Add one bottle; remove the item |
| Mystery bin | Adjacent + confirmed action | Resolve exactly one outcome, then mark `depleted` |

- Bin bottle yield is a random one to five bottles by default.
- Each bin receives a hidden hazard probability when the day is generated.
- The provisional probability range is 20% to 35% (higher later in the week via day balance).
- A bin interaction resolves to bottles **or** a burn, never both.
- A burn removes one health unit, equal to half a heart, and awards no bottles.
- A depleted bin ignores further interaction until the next daily reset.
- Bottle and burn outcomes update the HUD immediately and emit exactly one feedback event.

### Collection acceptance

- Loose bottles collect exactly once.
- A confirmed bin interaction changes inventory or health, never both.
- Repeated or overlapping input cannot resolve a bin more than once.
- Resetting a day produces valid new placements and hidden values without changing persistent cash or health.
- `bottle-collected` or `got-burned` is emitted once for the corresponding result.

## WP-2 — Economy and timed venues

All money is stored as integer cents. The configured bottle value defaults to €0.25.

### Bottle target

- The HUD may show how many more bottles are needed to afford the current meal after accounting for current cash.
- REWE accepts a redemption only when the player has at least `minimumBottlesToRedeem` bottles.
- The provisional minimum is 20 bottles and must be tuned with the food-price and day-duration ranges.
- An attempt below the minimum does not begin a queue and emits an immediate denial event.

### REWE bottle return

1. The player approaches REWE and confirms the bottle-return action.
2. Sample a new wait duration for that visit from the configured 2–12 second range.
3. Enter a `rewe-wait` substate, show a progress indicator, and lock movement and other actions.
4. Keep the main day timer running throughout the wait.
5. If the wait completes before day end, redeem all carried bottles at once.
6. Atomically set bottles to zero and add `bottles × bottleValueCents` to cash.
7. Emit an animation payload containing the before/after bottle and cash totals.
8. The UI animates the bottle counter downward and the euro counter upward.
9. Play an 8-bit glass-bottle clink during the transfer, followed by an 8-bit cash/cha-ching cue.

Every REWE visit samples a fresh wait, even within the same day. If the day ends during the wait, cancel the transaction and preserve the bottles and cash that existed before it began.

### Döner purchase

- At the beginning of each day, generate one meal price for the active location.
- The first-location price is a whole-euro value from €4 to €8 inclusive by default.
- Show the price in the HUD and interaction prompt before the player commits.
- If cash is insufficient, deny immediately; do not start a wait or deduct cash.
- If cash is sufficient, sample a new 2–5 second wait for that visit.
- During `food-wait`, lock movement/actions and keep the day timer running.
- If the wait completes before day end, deduct the exact price and set `fedToday = true`.
- A second meal on the same day is a no-op because it has no additional MVP effect.
- If the day ends during the wait, cancel the purchase and preserve the pre-transaction cash and `fedToday` state.

Price generation supports future per-location ranges, but only one location is required now.

### Economy acceptance

- Waits are sampled independently and remain within their configured inclusive ranges.
- A valid REWE transaction has no floating-point drift and cannot double-spend bottles.
- Counter animation values reconcile exactly to the authoritative post-transaction state.
- The meal price is stable for one day and rerolls on the next day.
- A successful food purchase deducts the displayed price and sets `fedToday`.
- Denied and interrupted transactions leave authoritative resources unchanged.

## WP-3 — Seven-day run loop

### Timer and waits

| Phase | Day timer |
| --- | --- |
| Instructions / day ready | Stopped |
| Night / dawn transition | Stopped |
| Three-second countdown | Stopped |
| Playing / venue wait | Running |
| Day resolution / win / loss | Stopped |

- The default live duration is 60 seconds and is configurable.
- Use elapsed wall-clock time rather than frame counts.
- The visible timer never displays a negative value.
- When it reaches zero, stop movement, cancel any incomplete venue transaction, and resolve the day exactly once.
- While `fedToday` is true and the player is not in a venue wait, they may end the day early; resolution matches timer expiry, then the next night/dawn cycle begins immediately.

### Day resolution

- If `fedToday` is false, remove two health units, equal to one full heart.
- If health reaches zero, enter `lost` immediately.
- If day seven resolves with health remaining, enter `won`.
- Otherwise show a day summary and an explicit **Start day N** action (skipped when the player ended the day early after eating).
- The next day keeps `healthUnits`, `cashCents`, and unredeemed bottles.
- The next day resets `fedToday`, the timer, bins, loose bottles, per-bin risk/yield data, venue waits, and the Döner price.

### Restart

Restart clears all run state, creates a new seed, rerolls the character, returns to the instructions screen, and leaves the timer stopped.

### Run-loop acceptance

- No timer runs before the first Start action or between days.
- Every day follows night, dawn, `3, 2, 1`, then live timer in that order.
- The HUD shows the correct `Day N / 7` throughout the run.
- Day expiry applies health loss correctly with and without food.
- Health reaching zero stops the timer and produces `lost` even during a day.
- Resolving day seven with health remaining produces `won`.

## Audio and animation event contract

Mechanics emits semantic event IDs. The sound workstream supplies short 8-bit-style assets using matching kebab-case filenames.

| Event ID | Default asset filename | Trigger |
| --- | --- | --- |
| `night-started` | `night-started.mp3` | Moon/night transition begins |
| `day-started` | `day-started.mp3` | Dawn/sun transition begins |
| `countdown-tick` | `countdown-tick.mp3` | Each `3`, `2`, `1` tick |
| `bottle-collected` | `bottle-collected.mp3` | Loose bottle or positive bin result |
| `got-burned` | `got-burned.mp3` | Bin burn removes half a heart |
| `rewe-wait-started` | `rewe-wait-started.mp3` | REWE queue begins |
| `bottles-depositing` | `bottles-depositing.mp3` | Bottle counter transfer begins; 8-bit glass clink |
| `cash-received` | `cash-received.mp3` | Cash has been credited; 8-bit cha-ching |
| `food-wait-started` | `food-wait-started.mp3` | Döner wait begins |
| `food-bought` | `food-bought.mp3` | Food transaction completes |
| `food-denied` | `food-denied.mp3` | Insufficient cash or already fed |
| `day-failed` | `day-failed.mp3` | End-of-day heart loss |
| `day-survived` | `day-survived.mp3` | Day resolves without meal damage |

- Event IDs match filename stems.
- Audio plays at most once per state transition or transaction.
- Missing, muted, or failed audio never blocks mechanics.
- The Start gesture must call the audio unlock hook required by browser autoplay policies.

## Configuration knobs

```ts
// Illustrative names and provisional defaults; values require playtesting.
{
  daysPerRun: 7,
  dayDurationMs: 60_000,
  preDayNightMs: 750,
  preDayDawnMs: 750,
  countdownSeconds: 3,

  gridColumns: 64,
  portraitAspectRatio: { width: 9, height: 16 },
  movementInitialRepeatDelayMs: 250,
  movementRepeatMs: 100,
  controlIdleOpacity: 0.18,
  controlActiveOpacity: 0.65,

  maxHealthUnits: 6,
  damage: { missedMeal: 2, binHazard: 1 },

  bottleValueCents: 25,
  minimumBottlesToRedeem: 20,
  binYieldMin: 1,
  binYieldMax: 5,
  binHazardChanceMin: 0.05,
  binHazardChanceMax: 0.15,

  reweWaitMinMs: 2_000,
  reweWaitMaxMs: 12_000,
  donerWaitMinMs: 2_000,
  donerWaitMaxMs: 5_000,
  mealPriceMinCents: 400,
  mealPriceMaxCents: 800,
  mealPriceStepCents: 100,
}
```

Randomness must be injectable or seedable for deterministic tests of bin placement, yields, hazard probabilities and outcomes, wait durations, and meal prices.

## Contracts with other workstreams

| Other stream | Contract |
| --- | --- |
| App infra | Implements full-screen canvas, HUD, phase screens, overlays, normalized commands, and visual counter/transition animations. Mechanics owns timing and state transitions. |
| Assets | Supplies pixel-art moon, sun, player, bins, REWE, Döner stand, and interaction icons without changing item rules. |
| Sound & dialogue | Maps the event IDs above to audio and optional text; calls cannot control or delay authoritative mechanics. |

## Full feedback acceptance checklist

1. Landing shows instructions and Start; time and movement remain inactive.
2. Starting a day shows moon/night, dawn/sun, and `3, 2, 1` before one live timer begins.
3. Every later day waits for an explicit **Start day N** action.
4. `Day N / 7`, phase, and timer are visible in the top HUD.
5. The full-screen portrait grid has 64 columns and an aspect-derived row count.
6. Directional taps move one cell; held joystick input repeats without bypassing collision.
7. Joystick and action controls overlay the canvas, remain subtle at rest, and visibly acknowledge input.
8. Direct bin input uses focus then confirm; the action button is an equivalent one-press confirmation when adjacent.
9. Each day creates valid, reproducible bin placements and rerolls hidden yield/risk data.
10. A bin resolves once to bottles or half-heart damage and emits the matching audio event once.
11. REWE enforces the configured bottle minimum and samples a new 2–12 second wait per visit.
12. The live timer continues and movement is locked during venue waits.
13. Completed redemption updates state exactly, then animates bottles down and euros up with bottle-clink and cash cues.
14. The daily Döner price is visible, falls within €4–€8, and remains stable for that day.
15. An affordable purchase samples a 2–5 second wait, deducts the exact price, and marks the player fed.
16. Insufficient or interrupted transactions do not change bottles, cash, or fed state.
17. Missing food at time zero costs one heart; eating avoids that damage.
18. Zero health loses; surviving the end of day seven wins.
19. Seeded tests reproduce all mechanics randomness.
20. The entire loop remains understandable and functional with audio muted.

## Out of scope

- Simulated visible queue NPCs or queue management beyond the timed REWE/Döner waits
- Shelter or a night destination as a required objective
- Stinkiness and separate hunger/energy bars
- Health recovery through a dealer or medicine
- Tap-to-walk pathfinding
- PvP, scores, or monetization
- Multiple playable maps in the first location milestone

## Open tuning questions

- Final minimum bottle count for REWE
- Final per-bin hazard-probability range and distribution
- Transition and input-repeat timing
- Whether Döner prices use whole-euro or smaller steps
- Final REWE and Döner wait ranges after playtesting
- Target first-run win rate and required bin density for a 60-second day

## Suggested ownership split

| Person | Package |
| --- | --- |
| A | WP-1 Collectibles and daily generation |
| B | WP-2 Economy, waits, and transactions |
| C | WP-3 phase machine, timer, and run progression |

Integrate against shared WP-0 and keep UI/audio implementations behind the contracts above.
