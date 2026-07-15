# Workstream: App infra

**Status:** Draft  
**Parent:** [`../../SPEC.md`](../../SPEC.md)  
**Work packages:** WP-0 (Foundation), WP-4 (Shell UI)  
**Depends on:** nothing for WP-0; WP-4 depends on WP-0  
**Blocks:** all other workstreams until WP-0 is shared

---

## Mission

Ship a runnable TypeScript browser app the whole team can clone: portrait game frame, canvas board, grid world, movement, generic items, collision, input, HUD shell, then the product shell (intro / transitions / end screens).

This workstream owns **structure and presentation chrome**, not bottle math or day resolution (see [`game-mechanics.md`](./game-mechanics.md)).

## Runtime decision

**Phaser is the required game runtime.** WP-0 should use Phaser Scenes, Loader,
Input, Scale, Canvas/WebGL rendering, and the global Sound Manager rather than
building parallel browser subsystems. Keep mechanics as plain testable modules
behind the Scene layer. The audio workstream provides a Phaser-native adapter in
[`../09-sound-pack.md`](../09-sound-pack.md).

---

## WP-0 — Foundation (land first, then share)

> **Current Phase 0 contract:** [`../superpowers/specs/2026-07-15-phase-0-grid-movement-design.md`](../superpowers/specs/2026-07-15-phase-0-grid-movement-design.md) is authoritative for the first implementation slice. It uses Phaser and Tiled, a responsive 24×16 whole-map landscape canvas, arrow-key input, and no touch controls, interactions, HUD, or shell UI. The broader WP-0 material below remains future work after Phase 0.

### Deliverables

| Area | Requirement |
| --- | --- |
| Tooling | TypeScript + Vite + Phaser; `npm install` / `npm run dev` documented in root README |
| Portrait shell | Centered mobile frame on desktop; usable at ~360×640 CSS px; no horizontal page scroll |
| Canvas board | HTML Canvas 2D world renderer |
| Grid | Configurable `width` × `height`; start compact (e.g. 24×32 or 32×40); cells are source of truth |
| Player | 1×1 placeholder + label |
| Movement | Orthogonal; one step = one cell; hold-to-repeat at controlled rate |
| Keyboard | Arrows + WASD; Space/Enter = context action |
| Touch | Functional D-pad (lower-left) + action button (lower-right); placeholder styling OK; targets ≥ 44×44 |
| Items | Generic model from config: id, type, position, size, blocking, optional interaction, state |
| Collision | Map bounds + blocking footprints; no walk-through |
| Adjacency + action | Action next to interactable → visible placeholder feedback |
| HUD shell | DOM fields: day, timer, hearts, bottles, cash (stubs OK) |
| Architecture | Authoritative in-memory `GameState`; canvas is not source of truth; pure updates preferred |
| Modules | Suggested folders: `game`, `world`, `player`, `input`, `render`, `ui`, `config` |
| Demo map | Spawn, 2–3 blocking scenery, 1 multi-cell shop placeholder, 2–3 1×1 interactables |

### Suggested state shape (wire stubs now)

```ts
type GamePhase = "intro" | "playing" | "day-transition" | "won" | "lost";

interface GameState {
  phase: GamePhase;
  day: number;
  timeRemainingMs: number;
  fedToday: boolean;
  player: PlayerState;
  world: WorldState;
  runSeed: string;
}

interface PlayerState {
  characterId: string;
  position: { x: number; y: number };
  healthUnits: number; // 0..6
  bottles: number;
  cashCents: number;
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

### Out of scope (WP-0)

- Real collect/economy/timer/win-lose logic
- Pixel art, SFX, dialogue bubbles
- Tap-to-pathfind, backend, accounts

### Acceptance (share gate)

1. Dev server shows portrait frame + grid.
2. Keyboard move + hold-repeat works.
3. Touch move + action works.
4. Cannot leave map or walk through blockers.
5. Items come from config/data, including ≥1 multi-cell item.
6. Adjacent action shows clear placeholder feedback.
7. HUD shows labeled stub fields.
8. Short README: how to run + where modules live.
9. State updates testable without canvas.

### Handoff

- [ ] Merged / tagged `foundation-v0`
- [ ] README run instructions
- [ ] Config knobs for grid size + item list
- [ ] Other workstreams unblocked

---

## WP-4 — Shell UI

### Deliverables

| Screen | Content |
| --- | --- |
| Intro | Title, one-line premise, controls, lose condition, Start (timer stopped until Start) |
| Character | Randomize one of three layoff archetypes (same stats OK for MVP) |
| Day transition | Ate? Heart lost? Continue into next day |
| Win | Benefits approved after seven days + Restart |
| Lose | Run over + Restart |
| Restart | New run, new seed/character, clear prior state |

### Out of scope (WP-4)

- Implementing timer/heart math (consume events from game-mechanics)
- Final art/copy polish (assets + sound-and-dialogue can supply later)

### Acceptance

- Intro → Start → playing handoff works with mechanics stubs or real WP-3.
- Win/lose/restart reachable when mechanics emit those phases.
- Portrait layout holds on phone and desktop letterbox.

---

## Contracts with other workstreams

| Other stream | Contract |
| --- | --- |
| Game mechanics | Infra exposes `GameState`, command pipeline (move/action), phase hooks; mechanics own rule updates |
| Assets | Renderer draws placeholders; later binds `assetId` / image keys without changing collision |
| Sound & dialogue | Infra may expose a tiny event bus or callback list (`bottle-collected`, `bin-burn`, …); no audio required in WP-0 |

---

## Non-functional

- Input feedback &lt; 100 ms locally
- Usable at 360×640 and desktop centered portrait
- No persistence required; reload must not keep a corrupted run
