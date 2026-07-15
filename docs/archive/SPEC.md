# Hobo Berlin — Product and Technical Specification

**Status:** Draft v0.1  
**Working title:** Hobo Berlin (also discussed as Hobo AI)  
**Source:** Synthesized from [`transcript.md`](./transcript.md)  
**Product type:** Fast-paced, single-player browser game  
**Primary platform:** Mobile-first responsive web

---

## How the team should use this document

| Role of this file | Details |
| --- | --- |
| Product truth | Rules, win/lose, economy, scope |
| Engineering handoff | Work packages below — build **WP-0** first, then branch |
| Workstream specs | Detailed ownership docs in [`docs/specs/`](./docs/specs/) |

| Workstream | Spec |
| --- | --- |
| App infra | [`docs/specs/app-infra.md`](./docs/specs/app-infra.md) |
| Game mechanics | [`docs/specs/game-mechanics.md`](./docs/specs/game-mechanics.md) |
| Assets | [`docs/specs/assets.md`](./docs/specs/assets.md) |
| Sound & dialogue | [`docs/specs/sound-and-dialogue.md`](./docs/specs/sound-and-dialogue.md) |

Index: [`docs/specs/README.md`](./docs/specs/README.md)

**Process**

1. One person (or one agent run) lands **WP-0 Foundation** on `main` (or a shared `foundation` branch) per **app-infra**.
2. Share that commit with the team — clone / pull; everyone starts from the same grid + movement base.
3. Parallelize workstreams / **WP-1 … WP-5** on short-lived branches; merge when each package’s acceptance criteria pass.
4. Do not start economy, timer, or art skins until WP-0 is merged and runnable.

---

## Work packages (delivery plan)

### Overview

```text
WP-0 Foundation  ──►  shared base (REQUIRED FIRST)
                         │
         ┌───────────────┼───────────────┬───────────────┐
         ▼               ▼               ▼               ▼
      WP-1            WP-2            WP-3            WP-4
   Collect &         Economy         Run loop        Shell UI
   bins              & food          hearts/days     intro/end
         │               │               │               │
         └───────────────┴───────┬───────┴───────────────┘
                                 ▼
                              WP-5 Polish (parallel, optional)
                           art · SFX · bubbles · touch juice
```

| ID | Name | Depends on | Parallelizable | Owner suggestion |
| --- | --- | --- | --- | --- |
| **WP-0** | Foundation — project, canvas, grid, items, movement, HUD shell | — | No — lands first | 1 person / 1 agent |
| **WP-1** | Collectibles — loose bottles, mystery bins, inventory | WP-0 | Yes | Mechanics A |
| **WP-2** | Economy — bottle return, cash, food, `fedToday` | WP-0 (+ WP-1 for full loop) | Yes after WP-0; needs bottles for end-to-end | Mechanics B |
| **WP-3** | Run loop — timer, 7 days, health, win/lose | WP-0 | Yes | Mechanics C |
| **WP-4** | Shell UI — intro, character roll, day transition, restart | WP-0 | Yes | Frontend / UI |
| **WP-5** | Polish — art, SFX, text bubbles, touch overlay | WP-0 | Yes anytime after WP-0 | Design / audio |

**Merge rule:** WP-1–WP-4 may land in any order once WP-0 exists, but the **playable MVP** needs all of WP-0 … WP-4.

---

### WP-0 — Foundation (build and share first)

**Goal:** A runnable TypeScript web app the whole team can clone: portrait game frame, canvas grid, placeholder player, keyboard movement, generic multi-cell items, collision, adjacency + action hook, HUD placeholders. No real economy, no timer pressure, no win/lose yet.

**In scope**

| Deliverable | Detail |
| --- | --- |
| Project bootstrap | TypeScript + Vite (or equivalent), `npm install` / `npm run dev`, opens in browser |
| Portrait shell | Centered mobile frame on desktop; usable at ~360×640 |
| Canvas board | HTML Canvas 2D world renderer |
| Grid | Configurable `width` × `height` (start compact, e.g. 24×32 or 32×40 — not 120×64 yet); cells are source of truth |
| Player | 1×1 placeholder rectangle + label |
| Movement | Orthogonal only; one step = one cell; hold-to-repeat at a controlled rate |
| Input (keyboard) | Arrow keys + WASD move; Space/Enter = context action |
| Input (touch) | Functional D-pad + action overlays; placeholder styling is acceptable |
| Items | Generic model: `id`, `type`, `position`, `size`, `blocking`, optional `interaction`, `state` |
| Collision | Cannot leave map; cannot enter blocking footprints |
| Adjacency + action | Press action when next to an interactable → visible placeholder feedback (e.g. flash / toast “Interacted: bin-1”) |
| HUD shell | DOM overlay fields: day, timer, hearts, bottles, cash (static placeholders OK) |
| State vs render | Authoritative in-memory `GameState`; canvas only draws; pure update functions preferred |
| Module folders | Suggested: `game`, `world`, `player`, `input`, `render`, `ui`, `config` |
| Demo map | Hard-coded or config map: spawn, 2–3 blocking scenery blocks, 1 multi-cell shop placeholder, 2–3 1×1 interactables |

**Out of scope for WP-0**

- Real bottle counts, Pfand math, food purchase
- Day timer countdown and day advancement
- Heart damage / win / lose
- Intro screen copy, character randomization
- Pixel art, sound, text bubbles
- Pathfinding / tap-to-walk
- Backend

**Suggested state shape (foundation-ready)**

```ts
type GamePhase = "intro" | "playing" | "day-transition" | "won" | "lost";

interface GameState {
  phase: GamePhase;
  day: number;                 // stub: 1
  timeRemainingMs: number;     // stub: unused until WP-3
  fedToday: boolean;           // stub: false
  player: PlayerState;
  world: WorldState;
  runSeed: string;
}

interface PlayerState {
  characterId: string;         // stub: "placeholder"
  position: { x: number; y: number };
  healthUnits: number;         // stub: 6 (three hearts)
  bottles: number;             // stub: 0
  cashCents: number;           // stub: 0
}

interface WorldState {
  width: number;
  height: number;
  items: WorldItem[];
}

interface WorldItem {
  id: string;
  type: "loose-bottle" | "bin" | "bottle-return" | "food" | "scenery";
  position: { x: number; y: number };
  size: { width: number; height: number };
  blocking: boolean;
  interaction?: string;
  state?: "available" | "depleted";
}
```

Wire the fields now even if logic is stubbed — later packages fill them in without rewriting the architecture.

**WP-0 acceptance criteria (share gate)**

1. `npm run dev` (or documented equivalent) shows the portrait game frame.
2. A grid is visible on the canvas (grid lines OK for foundation).
3. Player moves with keyboard; hold repeats steps.
4. Player also moves and acts with functional on-screen touch controls.
5. Player cannot leave the map or walk through blocking items.
6. At least one multi-cell item and several 1×1 items are placed from config/data (not painted into the renderer).
7. Standing adjacent to an interactable and pressing action shows clear placeholder feedback.
8. HUD shows labeled placeholders for day / timer / hearts / bottles / cash.
9. README (short) explains how to run and where modules live.
10. No framework-specific game rules: state updates are testable without the canvas.

**Handoff checklist for the team**

- [ ] WP-0 merged / tagged (e.g. `foundation-v0`)
- [ ] README run instructions
- [ ] Demo map + config knobs for grid size and item list
- [ ] Open package list (WP-1–WP-5) claimed by owners

---

### WP-1 — Collectibles (bins & loose bottles)

**Depends on:** WP-0  
**Goal:** Inventory of bottles; mystery bins; loose bottle pickup; daily reset hooks.

| Task | Detail |
| --- | --- |
| Loose bottles | Enter cell → +1 bottle, remove item |
| Mystery bins | Adjacent + action → bottles (1–5) **or** hazard stub; deplete for the day |
| Hazard | Prefer −1 health unit here or leave a hook for WP-3 |
| Feedback | Distinct bottle vs burn placeholder icons/text |
| Daily reset API | Function to respawn bins/loose bottles (called later by WP-3) |

**Acceptance:** Collect loose bottles; search bins; inventory updates; depleted bins ignore further actions until reset.

---

### WP-2 — Economy (Pfand & food)

**Depends on:** WP-0; needs WP-1 bottles for a full loop  
**Goal:** Cash in cents; redeem bottles; buy one meal/day.

| Task | Detail |
| --- | --- |
| Bottle return | Adjacent + action → `cashCents += bottles × 25`; bottles → 0 |
| Food point | Adjacent + action → if `cashCents >= mealPrice`, deduct and set `fedToday` |
| Split venues | MVP default: separate **bottle-return** and **food** items |
| Config | Bottle value, meal price in `config` |
| Feedback | Success / insufficient funds messages |

**Acceptance:** Redeem and buy food update HUD; failed buy does not change state; second meal same day is a no-op.

---

### WP-3 — Run loop (timer, hearts, 7 days, win/lose)

**Depends on:** WP-0  
**Goal:** Real stakes — clock, day resolution, health, win/lose.

| Task | Detail |
| --- | --- |
| Start gate | Timer runs only in `playing` after Start/Continue |
| Day length | Configurable; default 60_000 ms; `requestAnimationFrame` + elapsed time |
| Day end | If `!fedToday` → −2 health units (1 heart); then next day or lose |
| Persist | Hearts, cash, bottles persist; `fedToday` resets; collectibles reset |
| Win | End of day 7 with health > 0 |
| Lose | Health reaches 0 anytime |
| Hazard wire-up | Bin burn applies −1 health unit if not done in WP-1 |

**Acceptance:** Full seven-day pressure works with stub collect/economy if needed; win and lose screens reachable; Restart clears run (may share Restart with WP-4).

---

### WP-4 — Shell UI (intro, character, transitions)

**Depends on:** WP-0  
**Goal:** Understandable product surface around the board.

| Task | Detail |
| --- | --- |
| Intro | Title, premise, controls, lose condition, Start |
| Character | Randomize one of three layoff archetypes (same stats OK for MVP) |
| Day transition | Short day-end summary (ate / lost heart) |
| End screens | Win (benefits approved) / Lose + Restart |
| Portrait layout | No horizontal page scroll on phone or desktop letterbox |

**Acceptance:** Criteria 1–2 and 12–15 from § MVP acceptance (intro, restart, portrait).

---

### WP-5 — Polish (optional, parallel)

**Depends on:** WP-0  
**Goal:** Juice without blocking MVP.

- Landmark / scenery art (Brandenburg Gate flavor)
- Character sprites
- SFX (collect, redeem, burn, fail)
- Text bubbles
- Touch control styling
- Ambience

**Acceptance:** Cosmetic only; must not break WP-0–WP-4 rules or input latency targets.

---

### Suggested parallel ownership after WP-0

| Person / track | Packages |
| --- | --- |
| A | WP-1 Collectibles |
| B | WP-2 Economy |
| C | WP-3 Run loop |
| D | WP-4 Shell UI (+ WP-5 art/audio if capacity) |

Integrate on a branch that has WP-0; prefer small PRs per package.

---

## 1. Purpose of this document

This document turns the brainstorming session into an implementation-ready specification. The transcript contains competing ideas and postponed decisions. Scope levels:

- **MVP requirement:** required for the first complete, playable game.
- **Provisional default:** chosen to unblock implementation; may change after playtesting.
- **Deferred:** discussed but excluded from the MVP.

The first engineering milestone is **WP-0 Foundation**. It establishes the grid, movement, items, collision, controls, and HUD so the remaining mechanics can be developed independently.

## 2. Product vision

Hobo Berlin is a short, satirical survival-and-collection game set in Berlin. The player controls a recently laid-off knowledge worker who must collect returnable bottles, redeem them for cash, and buy food while waiting seven days for the Agentur für Arbeit to approve their benefits.

The game should be funny, immediately understandable, and playable in a short session. Mechanics take priority over visual polish: the player must make meaningful choices, win, and lose even with placeholder art.

### 2.1 Product principles

1. **Playable before polished.** Movement, interaction, risk, and win/loss come before dialogue, sound, and detailed scenery.
2. **One clear loop.** Explore → collect bottles → exchange → buy food → survive the day.
3. **Short and legible.** Seven fast rounds; mobile attention span.
4. **Berlin-specific satire.** Locations, Pfand, bureaucracy, laid-off tech roles.
5. **Simple systems.** New meters only when they create a clear decision.
6. **Punch up.** Satire targets layoffs, automation, bureaucracy, and Berlin absurdity — not real-world homelessness as the punchline.

## 3. Target experience

### 3.1 Audience

- Adults familiar with Berlin, tech culture, or casual web games.
- Players who learn rules from one short intro screen.
- Keyboard and touch users.

### 3.2 Session

- One run = **seven days**.
- A day lasts **60 seconds by default**.
- Successful run ≈ seven minutes plus transitions.
- All timing and economy values live in **configuration**, not magic numbers in systems code.

### 3.3 Platform

- Browser frontend in TypeScript.
- Portrait-first; stays portrait-sized and centered on desktop.
- No backend, accounts, auth, multiplayer, or server persistence in MVP.
- No React Native / native app.

## 4. Player premise and characters

At the start of a run, the game randomly assigns one of three characters:

1. Former prompt engineer — laid off after “loop engineering” became fashionable.
2. Former head of marketing — replaced by an end-to-end automated workflow.
3. Former QA engineer — replaced by instantly generated Playwright tests.

For MVP, characters may share identical mechanics and differ only in name, description, and placeholder appearance. The data model must support different starting cash later.

**Provisional starting state:** €0.00, zero bottles, three hearts (six half-heart units).

## 5. Core game loop

The transcript did not fully settle whether a successful day should require food, a bottle/score threshold, or shelter. This specification adopts **eating once per day** as the provisional MVP objective because it preserves the original bottles → cash → food loop and gives each round a clear success condition. A pure score mode and shelter are deferred.

1. Intro explains premise, objective, controls, loss condition.
2. Player presses **Start** — only then does day 1 timer begin.
3. Move on a top-down Berlin-inspired grid.
4. Pick up loose bottles; search mystery bins.
5. Bin reveals bottles **or** hazard; outcome hidden beforehand.
6. Redeem bottles at return point for cash.
7. Spend cash at food point to become fed for the day.
8. Timer hits zero → resolve day:
   - ate → no heart lost;
   - did not eat → lose one heart.
9. If health remains and day < 7 → reset world for next day; persistent resources stay.
10. Win: finish day 7 with health. Lose: health hits zero.

## 6. Game rules

### 6.1 Time and days

- Exactly seven numbered days.
- Timer runs only in `playing` after Start/Continue.
- Provisional day length: 60 seconds.
- End of day: bins and loose bottles reset/respawn.
- Hearts and cash persist. Carried bottles also persist as a provisional inventory rule.
- `fedToday` resets to `false` each morning.
- Short day/night transition optional; must not change rules.

### 6.2 Health

- Start with three hearts = six half-heart units.
- Fail to eat before timer expires: −2 units (one heart).
- Bin hazard: −1 unit (half a heart).
- Cap at six units in MVP.
- Zero health ends the run immediately.
- MVP: no health recovery.

### 6.3 Bottles and bins

- Loose bottles: visible; collect on enter cell.
- Bins: visible; outcome hidden until search.
- Search: orthogonally adjacent + action.
- One search per bin per day.
- Outcome is exactly one of:
  - **Bottles:** random 1–5 into inventory.
  - **Hazard:** no bottles; −½ heart.
- Provisional hazard share: approximately 10% of the day's bins. Outcomes are assigned before interaction and remain hidden.
- Immediate visual feedback (bottle / burn icon).
- Placement: never off-map, overlapping blockers, or unreachable.
- Daily generation must leave enough obtainable bottle value to afford at least one meal, so generation alone cannot make the round unwinnable.

### 6.4 Economy and food

- Bottle value: €0.25 (store as integer cents).
- Return point: redeem **all** carried bottles in one action.
- Meal price: €5.00 provisional.
- Food point: buy/consume one meal if affordable → `fedToday = true`.
- Failed purchase: no state change + “need more cash” feedback.
- Extra meals same day: disabled (no MVP effect).

MVP uses two distinct locations:

- **Bottle-return point** — redeem only.
- **Food point** — buy food only.

Venue labels are configurable. `REWE` for bottle return and `Netto` for food are provisional content defaults; generic venues or a Döner stand can replace them without changing the rules.

### 6.5 Win and loss

- **Win:** end of day 7 with ≥1 health unit.
- **Loss:** health reaches 0 anytime.
- Both stop movement and timer; offer Restart.
- Restart: new run, new character/world seed, clear state.

## 7. World, movement, and interaction

### 7.1 View and map

- Fixed top-down 2D grid.
- Isometric / FPS corridor / side-scroller: out of MVP scope.
- First map: one compact Berlin-inspired location; Brandenburg Gate provisional landmark.
- Landmark may be decorative only.
- Dimensions configurable; use a **compact test map in WP-0**; validate larger sizes on portrait screens later.
- Grid is source of truth even if lines are hidden in final art.
- Renderer may show full board or a follow-camera if full board is illegible.

### 7.2 Movement

- Orthogonal only; one step = one cell.
- Hold direction = repeat at controlled rate.
- Cannot leave map or enter blocking cells.
- No diagonals, no jumping.

### 7.3 Controls

Desktop: arrows + WASD; Space/Enter = action.  
Touch: D-pad lower-left; action lower-right; press-and-hold repeats.  
Tap-to-pathfind: deferred. Controls must not obscure player or nearby interactions.

### 7.4 Items and collision

Generic item model — do not hard-code collision into the renderer.

- Items: identity, type, position, rectangular footprint, blocking, optional interaction.
- Footprints may be multi-cell (1×1 bin, 4×2 shop).
- Blocking footprints cannot overlap each other or the spawn.
- Interact when orthogonally adjacent to the footprint.
- Decorations may be blocking or passable.
- Appearance independent of rules (placeholders → art later).

### 7.5 MVP item types

| Type | Trigger | Effect | Daily reset |
| --- | --- | --- | --- |
| Loose bottle | Enter cell | +1 bottle; remove item | Yes |
| Mystery bin | Adjacent + action | Bottles or hazard; then depleted | Yes |
| Bottle return | Adjacent + action | All bottles → cash | No |
| Food point | Adjacent + action | Buy day's meal if affordable | No |
| Landmark/decoration | None | Visual and/or collision | No |

## 8. Interface and feedback

### 8.1 Intro screen

Title + one-sentence premise; assigned character joke; survive seven days; loop bottles → cash → food; controls; how hearts are lost; Start.

### 8.2 HUD

Visible during play: character/role; `Day N / 7`; seconds left; hearts (half-hearts); bottles; cash €; fed-today indicator. Portrait-safe.

### 8.3 Interaction feedback

Prompt when action available. Distinct feedback for collect, burn, redeem, food OK, insufficient funds. Placeholders OK. Must not rely on sound alone.

### 8.4 End and transition screens

Day resolution: ate? heart lost?  
Win: benefits approved after seven days.  
Loss: run over + Restart.

## 9. Technical design

### 9.1 Architecture

- **Language:** TypeScript.
- **Runtime:** modern mobile and desktop browsers.
- **World:** HTML Canvas 2D.
- **HUD/controls:** DOM over/around canvas.
- **State:** in-memory; pure updates where practical.
- **Loop:** `requestAnimationFrame` + elapsed time (not frame-count rules).
- **Backend:** none.
- **Framework:** optional for UI; game rules must not depend on framework components.

### 9.2 Data flow

1. Input adapters → movement/action commands.
2. Update layer validates phase, bounds, collision.
3. Systems return explicit state changes.
4. Authoritative `GameState` updates.
5. Canvas reads world; HUD reads player/run.
6. Clock dispatches day resolution at t = 0.

Rendering is never authoritative for position, collision, inventory, or time.

### 9.3 Configuration

Config must hold: run length, day duration, health/damage, bottle value, bin yield, hazard share, meal price, grid size, spawn, item placements, characters, venue labels, assets.

Randomness injectable/seedable for tests.

### 9.4 Suggested module boundaries

- `game` — phases, clock, day resolution, win/loss
- `world` — grid, items, collision, daily reset
- `player` — movement, inventory, cash, health, interaction rules
- `input` — keyboard and touch
- `render` — canvas, camera/scale
- `ui` — intro, HUD, prompts, transitions, end screens
- `config` — balance, characters, maps, labels

## 10. Nice-to-have after MVP (not work-package blockers)

- Pixel-art characters and Berlin scenery
- Sound, ambience, text bubbles, NPCs
- Maps: Alexanderplatz, Kottbusser Tor
- Varied/procedural daily placement
- Character-specific starting cash/traits
- Shelter as second daily objective
- Stinkiness, shop wait times, multiple supermarket tradeoffs
- Hunger/energy bars, dealer/medicine healing
- Hidden landmark caches

## 11. Explicitly out of scope for MVP

- Native app / React Native
- Backend, SSO, accounts, cloud saves, leaderboards
- Multiplayer / PvP
- Multiple cameras, isometric, FPS, platforming
- Real-time NPC simulation
- Tap-to-pathfind
- Shop queues / wait times
- Shelter, stinkiness, hunger, energy as required systems
- Healing consumables / dealer (post-MVP)
- Scores, monetization, paid skip

## 12. Non-functional requirements

- Usable at 360×640 CSS px and on desktop letterbox.
- Touch targets ≥ 44×44 CSS px.
- Input feedback &lt; 100 ms under normal local execution.
- Smooth on mid-range mobile; cosmetics must not block the loop.
- Reload/restart never keeps a corrupted run; persistence not required.
- State/economy unit-testable without canvas.
- Readable without color alone.

## 13. MVP acceptance criteria

Accepted when all are true:

1. Site shows rules + random character; timer stopped.
2. Start → seven-day run, three hearts, zero bottles, provisional cash, day 1.
3. Playable with keyboard and on-screen touch controls.
4. Orthogonal movement only; map bounds + blocking respected.
5. Loose bottle cell collects exactly once.
6. Adjacent bin search → one hidden random outcome; bin depleted for the day.
7. Bottle outcome increases inventory; hazard removes half a heart, no bottles.
8. Redeem → bottles 0; cash += bottles × configured value (integer cents).
9. Affordable food deducts price and marks fed; unaffordable attempt no-ops.
10. Time up without food → −1 heart; with food → no end-of-day heart loss.
11. Next day resets timer, `fedToday`, bins, loose bottles; keeps health, cash, unredeemed bottles.
12. Zero health → loss + Restart.
13. Complete day 7 with health → win + Restart.
14. Restart → fresh character/intro state.
15. Portrait mobile + desktop portrait frame; no horizontal page scroll.

## 14. Open product decisions

Do not block WP-0; keep configurable:

1. Final venue model (labels vs single supermarket later).
2. Final map dimensions and full-board vs follow camera.
3. Balance: day length, food price, bin count, yields, hazard rate.
4. Character starting cash / traits.
5. Real brand names vs fictional equivalents.
6. Tone review before public release.
7. Next major mechanic after food loop is fun: shelter.
