# Phase 0 Grid Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Every production behavior follows `superpowers:test-driven-development`, and completion claims follow `superpowers:verification-before-completion`.

**Goal:** Deliver the approved Phase 0 as a responsive Phaser grid scene, pause for manual approval of its debug proof of concept, then add three temporary Berlin textures without changing gameplay.

**Architecture:** A strict Tiled parser converts the checked-in map into pure grid state. Pure movement plus a deterministic input-repeat controller own behavior; one Phaser scene renders that state and mirrors the current position into a DOM status element. Playwright drives the real Vite app and observes the status element and canvas geometry.

**Tech Stack:** Node.js `>=24 <26`, pnpm 11.13.0, Phaser 4.2.1, TypeScript 7.0.2, Vite 8.1.4, Vitest 4.1.10, Playwright 1.61.1, Tiled JSON.

**Design source:** `docs/superpowers/specs/2026-07-15-phase-0-grid-movement-design.md`

## Global Constraints

- Use pnpm exclusively; declare `"packageManager": "pnpm@11.13.0"` and commit `pnpm-lock.yaml`.
- Declare `"engines": { "node": ">=24 <26" }`.
- Pin exact dependencies: Phaser 4.2.1, Vite 8.1.4, TypeScript 7.0.2, Vitest 4.1.10, and Playwright 1.61.1.
- The map is finite, orthogonal, 24×16 cells, with 32×32-pixel cells and a 768×512 design resolution.
- Grid state is authoritative. Rendering never decides movement or collision.
- Accepted input is arrow keys only. Immediate movement is followed by a 180 ms initial repeat delay and 100 ms repeat intervals; delayed updates discard missed intervals.
- The complete map remains visible with no camera following at 360×640, 768×512, and 1440×900 viewports.
- No bins, REWE interactions, collection, economy, audio, dialogue, touch controls, WASD, context actions, HUD, multiple scenes, persistence, or customization.
- Do not create Stage B artwork or Stage B code before the user explicitly approves Stage A.
- Do not merge, push, or open a pull request.

## Execution and Review Protocol

Tasks 1–5 and 7 are **non-lightweight**. For each, dispatch one fresh implementer with no child-agent permission, record the base commit, require the reported red/green commands, generate a review package for the complete task range, and run task review in this order:

1. specification compliance against this task and the approved design;
2. code quality, test quality, scope discipline, and project conventions;
3. fix every Critical or Important finding and re-run the covering tests before re-review; and
4. append the clean result to `.superpowers/sdd/progress.md`.

Tasks 6 and 8 are pre-classified **lightweight, read-only verification gates**: they add no behavior and make no source changes. They require fresh command/browser evidence but no per-task code review. After Task 8, run one whole-branch review over the implementation range.

## File Map

```text
.gitignore                              generated/test output exclusions
package.json                            exact toolchain and scripts
pnpm-lock.yaml                          reproducible dependency graph
tsconfig.json                           strict browser TypeScript
vite.config.ts                          Vite server/build config, port 3150
vitest.config.ts                        unit-test discovery
playwright.config.ts                    real-app browser test server, port 3151
index.html                              game host, status, boot-alert host
src/styles.css                          full-viewport responsive shell
src/main.ts                             map fetch, validation, boot failure
src/game/config.ts                      design and repeat constants
src/game/create-game.ts                 Phaser game construction
src/game/grid/movement.ts               pure grid movement
src/game/input/repeat.ts                deterministic arrow repeat
src/game/map/tiled-contract.ts          validation and grid conversion
src/game/scenes/map-scene.ts            Stage A/Stage B rendering and input
src/assets/maps/phase-0.json            checked-in Tiled contract fixture
src/assets/sprites/*.png                User-supplied Stage B raster textures
src/game/assets/phase-b-assets.ts       Stage B texture manifest
src/game/map/phase-b-layout.ts          Fixed terrain and prop placement
tests/unit/config.test.ts               constants and version-facing contract
tests/unit/tiled-contract.test.ts       parser acceptance/rejection
tests/unit/movement.test.ts             movement behavior
tests/unit/repeat.test.ts               input timing and priority
tests/unit/phase-b-assets.test.ts       Stage B texture manifest/files
tests/unit/phase-b-layout.test.ts       Terrain, prop, and collision alignment
tests/e2e/phase-0.spec.ts               complete Stage A/Stage B user flow
```

---

### Task 1: pnpm, Vite, TypeScript, and Test Foundation

**Files:**

- Create: `.gitignore`
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `tests/unit/config.test.ts`
- Create: `src/game/config.ts`
- Modify (local machine, not committed here): `~/.config/dev-ports.md`

**Interfaces:**

- Produces constants `GRID_COLUMNS`, `GRID_ROWS`, `CELL_SIZE`, `DESIGN_WIDTH`, `DESIGN_HEIGHT`, `INITIAL_REPEAT_DELAY_MS`, and `REPEAT_INTERVAL_MS`.
- Reserves project web port 3150 in `~/.config/dev-ports.md`; Vite may auto-increment on collision and the running port is recorded in `.dev/port` during manual development.

- [ ] **Step 1: Add package/config scaffolding only**

Create `package.json` with private ESM configuration, the exact engines/package-manager fields, and these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": { "phaser": "4.2.1" },
  "devDependencies": {
    "@playwright/test": "1.61.1",
    "typescript": "7.0.2",
    "vite": "8.1.4",
    "vitest": "4.1.10"
  }
}
```

Use strict TypeScript with `moduleResolution: "Bundler"`, `types: ["vite/client"]`, and `noEmit: true`. Configure Vite host `127.0.0.1`, port `3150`, `strictPort: false`; configure Vitest to include `tests/unit/**/*.test.ts`. Add only `node_modules`, `dist`, `test-results`, `playwright-report`, `.dev`, and `.superpowers` to `.gitignore`.

Claim the next free `3150–3159` project slot in `~/.config/dev-ports.md` for `hobo.berlin`, with web surface 3150. This local ledger edit is not part of the repository commit.

- [ ] **Step 2: Install reproducibly**

Run: `corepack prepare pnpm@11.13.0 --activate && pnpm install`

Expected: exit 0; `pnpm-lock.yaml` records the exact package versions.

- [ ] **Step 3: Write the failing constants test**

```ts
import { describe, expect, it } from "vitest";
import {
  CELL_SIZE,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GRID_COLUMNS,
  GRID_ROWS,
  INITIAL_REPEAT_DELAY_MS,
  REPEAT_INTERVAL_MS,
} from "../../src/game/config";

describe("Phase 0 constants", () => {
  it("derives the 768 by 512 design from a 24 by 16 grid", () => {
    expect([GRID_COLUMNS, GRID_ROWS, CELL_SIZE]).toEqual([24, 16, 32]);
    expect([DESIGN_WIDTH, DESIGN_HEIGHT]).toEqual([768, 512]);
  });

  it("pins deterministic repeat timing", () => {
    expect([INITIAL_REPEAT_DELAY_MS, REPEAT_INTERVAL_MS]).toEqual([180, 100]);
  });
});
```

- [ ] **Step 4: Establish a compilable seam, then verify behavioral RED**

Run: `pnpm test tests/unit/config.test.ts`

Expected first run: collection error because `src/game/config.ts` does not exist. Add `src/game/config.ts` exporting all seven names as `0`; this is a compilation seam, not the implementation. Re-run the same command.

Expected RED: tests execute and FAIL because the grid/timing arrays contain zeroes rather than the required values.

- [ ] **Step 5: Add the minimal constants behavior**

Export the seven numeric constants. Derive width as `GRID_COLUMNS * CELL_SIZE` and height as `GRID_ROWS * CELL_SIZE`; do not add a general configuration system.

- [ ] **Step 6: Verify GREEN and lockfile install**

Run: `pnpm test tests/unit/config.test.ts && pnpm install --frozen-lockfile`

Expected: 2 tests pass; frozen install exits 0.

- [ ] **Step 7: Commit and review**

Commit message: `chore: scaffold phase 0 toolchain`

---

### Task 2: Tiled Map Contract Parsing and Validation

**Files:**

- Create: `tests/unit/tiled-contract.test.ts`
- Create: `src/game/map/tiled-contract.ts`
- Create: `src/assets/maps/phase-0.json`

**Interfaces:**

```ts
export interface GridPosition { column: number; row: number }
export interface GridBounds { columns: number; rows: number }
export interface ParsedMapContract {
  bounds: GridBounds;
  spawn: GridPosition;
  blockedCells: ReadonlySet<string>;
}
export function blockedCellKey(position: GridPosition): string;
export function parseTiledMap(input: unknown): ParsedMapContract;
```

- [ ] **Step 1: Establish the parser seam and first behavioral RED**

Write only the valid-map test and its `validMap()` helper first. The helper contains a 24×16 orthogonal map, a `Spawn` object layer with point `player` at `(64,64)`, and a `Collision` rectangle at `(160,64)` sized `32×32`; deliberately omit all `visible` fields so the first cycle also proves Tiled's default visibility is accepted. Run the test once to confirm the missing-module collection error, then create this deliberately unimplemented seam:

```ts
export interface GridPosition { column: number; row: number }
export interface GridBounds { columns: number; rows: number }
export interface ParsedMapContract {
  bounds: GridBounds;
  spawn: GridPosition;
  blockedCells: ReadonlySet<string>;
}
export function blockedCellKey(position: GridPosition): string {
  return `${position.column},${position.row}`;
}
export function parseTiledMap(_input: unknown): ParsedMapContract {
  throw new Error("Tiled map parsing is not implemented");
}
```

Run: `pnpm test tests/unit/tiled-contract.test.ts -t "parses a valid map"`

Expected RED: the test executes and FAILS with `Tiled map parsing is not implemented`.

- [ ] **Step 2: Implement the valid-map happy path and verify GREEN**

Implement only enough guarded object access to return valid bounds, spawn, and a one-cell blocker for `validMap()`.

Run: `pnpm test tests/unit/tiled-contract.test.ts -t "parses a valid map"`

Expected: the focused test passes.

- [ ] **Step 3: Add each remaining parser behavior as its own red-green cycle**

Add one focused test (or one table of equivalent invalid variants), run it with `-t` and observe its specific assertion fail against the current implementation, add only the required validation/conversion, then re-run it to GREEN before moving to the next row:

- valid bounds, spawn `(2,2)`, and key `"5,2"`;
- a `64×64` rectangle expands to four blocked keys;
- a Collision layer with no objects is valid;
- missing/duplicate Spawn or Collision layers fail with the layer name;
- zero/multiple player points fail with `player` in the message;
- non-point player, misaligned/out-of-map player, and spawn-on-blocker fail;
- non-orthogonal, infinite, wrong dimensions, and wrong tile size fail;
- non-rectangle shapes, tile objects carrying `gid`, text objects carrying `text`, hidden layer/object, zero size, misalignment, and out-of-map Collision objects fail with the object ID when present; and
- explicitly present `visible: true` fields remain accepted.

For every cycle, RED means the test reaches its assertion and reports the wrong return value or missing expected error—not a syntax, import, fixture, or collection error.

- [ ] **Step 4: Write the checked-in map contract test and verify RED**

Assert with `existsSync` that `src/assets/maps/phase-0.json` exists, then load it with `readFile` and assert it parses, its spawn is `(2,2)`, and it contains blocker `"5,2"`.

Run: `pnpm test tests/unit/tiled-contract.test.ts -t "parses the checked-in phase 0 map"`

Expected RED: the test executes and FAILS its file-existence/read assertion because the checked-in map does not exist.

- [ ] **Step 5: Finish only the validated Tiled subset and fixture**

Use `unknown` plus local type guards; do not add a schema dependency. Validate top-level geometry first, then find exactly one required object layer by name, then validate objects. Treat a rectangle as an object with numeric `x`, `y`, `width`, and `height` and with none of Tiled's alternate-kind fields: `point`, `ellipse`, `polygon`, `polyline`, `gid`, or `text`. Build blocked cells by integer row/column loops and reject a spawn whose key is blocked.

Create the finite Tiled JSON fixture with spawn `(64,64)`, the single blocker at `(160,64)`, and one additional multi-cell blocker away from the direct browser-test route. Include standard Tiled `type: "objectgroup"`, `objects`, IDs, and `visible: true` values; do not add a tileset or tile layer.

- [ ] **Step 6: Verify full GREEN**

Run: `pnpm test tests/unit/tiled-contract.test.ts`

Expected: all parser and checked-in fixture tests pass.

- [ ] **Step 7: Commit and review**

Commit message: `feat: validate phase 0 tiled maps`

---

### Task 3: Pure Grid Movement and Collision

**Files:**

- Create: `tests/unit/movement.test.ts`
- Create: `src/game/grid/movement.ts`

**Interfaces:**

```ts
import type { GridBounds, GridPosition } from "../map/tiled-contract";
export type Direction = "up" | "down" | "left" | "right";
export function moveGridPosition(
  current: GridPosition,
  direction: Direction,
  bounds: GridBounds,
  blockedCells: ReadonlySet<string>,
): GridPosition;
```

- [ ] **Step 1: Establish the movement seam and first behavioral RED**

Write the `right` movement test first. Confirm the initial missing-module collection error, then add the typed `Direction` export and a `moveGridPosition` seam that returns `current` for every call.

Run: `pnpm test tests/unit/movement.test.ts -t "moves right"`

Expected RED: the test executes and FAILS because `(2,2)` is returned instead of `(3,2)`.

- [ ] **Step 2: Run movement behaviors as small red-green cycles**

Use bounds `{ columns: 24, rows: 16 }`. Add and focus each behavior before implementing it: right delta plus different-reference/input-immutability assertions; the other three direction deltas; all four bounds plus same-reference assertions; and a blocked destination plus same-reference/set-immutability assertions. Each RED must be an assertion failure against the current seam/implementation. Apply the smallest change, re-run the focused test to GREEN, then continue.

- [ ] **Step 3: Implement minimal movement**

Use a fixed `Record<Direction, GridPosition>` delta table, compute one candidate, test bounds, then test `blockedCellKey(candidate)`. Return `current` for rejection and the candidate for acceptance. Do not validate already type-safe inputs or add entities/commands.

- [ ] **Step 4: Verify GREEN**

Run: `pnpm test tests/unit/movement.test.ts && pnpm test`

Expected: movement tests and the full unit suite pass.

- [ ] **Step 5: Commit and review**

Commit message: `feat: add pure grid movement`

---

### Task 4: Deterministic Arrow-Key Repeat

**Files:**

- Create: `tests/unit/repeat.test.ts`
- Create: `src/game/input/repeat.ts`

**Interfaces:**

```ts
import type { Direction } from "../grid/movement";

export class ArrowRepeatController {
  keyDown(code: string, nowMs: number, nativeRepeat: boolean): Direction | undefined;
  keyUp(code: string, nowMs: number): void;
  update(nowMs: number): Direction | undefined;
}
```

- [ ] **Step 1: Establish the controller seam and first behavioral RED**

Write the ArrowRight immediate-emission test. Confirm the initial missing-module collection error, then add the class with all three methods present and returning `undefined`/doing nothing.

Run: `pnpm test tests/unit/repeat.test.ts -t "emits ArrowRight immediately"`

Expected RED: the test executes and FAILS because `keyDown` returns `undefined` rather than `right`.

- [ ] **Step 2: Run input behaviors as small red-green cycles**

With explicit millisecond timestamps, assert:

- each arrow code maps to its direction and emits immediately;
- non-arrow codes and native-repeat keydowns emit nothing;
- a held key emits nothing at 179 ms, emits at 180 ms, then at 280 ms;
- an update delayed from 180 ms to 350 ms emits once and next emits at 450 ms, discarding missed ticks;
- repeated calls at the same timestamp emit at most once;
- the most recently pressed held arrow wins;
- releasing that arrow falls back to the prior held arrow only after a restarted 180 ms delay; and
- releasing the final key stops repetition.

Add each row as a focused test after the previous row is GREEN. The first minimal implementation may return `right` for any keydown; the non-arrow/native-repeat cycle then forces filtering rather than passing against the seam. Run each new test with `-t`, observe a wrong-value/timing assertion failure, make the smallest controller change, and re-run to GREEN. A collection, syntax, or missing-method error does not count as RED.

- [ ] **Step 3: Implement the controller**

Keep a priority-ordered held-key list and one `nextRepeatAt` value. `keyDown` ignores unknown/native-repeat/already-held codes, promotes a newly pressed arrow, schedules `now + 180`, and returns its direction. `keyUp` removes the key; when removing the active key, schedule the fallback for `now + 180`. `update` emits only when an active key exists and `now >= nextRepeatAt`, then schedules `now + 100`.

- [ ] **Step 4: Verify GREEN**

Run: `pnpm test tests/unit/repeat.test.ts && pnpm test`

Expected: repeat tests and full unit suite pass.

- [ ] **Step 5: Commit and review**

Commit message: `feat: add deterministic arrow repeat`

---

### Task 5: Stage A Phaser Scene and Dedicated Browser Flow

**Files:**

- Create: `playwright.config.ts`
- Create: `tests/e2e/phase-0.spec.ts`
- Modify: `index.html`
- Create: `src/styles.css`
- Create: `src/main.ts`
- Create: `src/game/create-game.ts`
- Create: `src/game/scenes/map-scene.ts`

**Interfaces:**

```ts
export function createGame(parent: HTMLElement, map: ParsedMapContract): Phaser.Game;
export class MapScene extends Phaser.Scene {
  constructor(map: ParsedMapContract);
}
```

DOM contract:

```html
<main id="app">
  <div id="game" aria-label="Phase 0 Berlin grid"></div>
  <output id="player-position" aria-live="polite" data-column="2" data-row="2">Player: 2,2</output>
</main>
```

Boot failures replace game content with `<p role="alert">Unable to start Phase 0: …</p>` and leave no canvas.

- [ ] **Step 1: Configure the real test server**

Configure Playwright `testDir: "tests/e2e"`, base URL `http://127.0.0.1:3151`, Chromium-only, trace on first retry, and a `webServer` command `pnpm exec vite --host 127.0.0.1 --port 3151 --strictPort` with `reuseExistingServer: true` outside CI.

- [ ] **Step 2: Establish a bootable non-game shell**

Before browser behavior tests, make `index.html` load `src/main.ts`; create a minimal `main.ts` that renders the required `#app`, `#game`, and `#player-position` elements but creates no Phaser game and accepts no input. This is the compilable browser seam, not Stage A behavior. Confirm `pnpm build` exits 0.

- [ ] **Step 3: Write the initial rendering/viewport tests and verify behavioral RED**

Create helpers reading `data-column`/`data-row`. Add the initial canvas/status and viewport tests first; run each focused test and observe an assertion failure because no canvas exists.

For viewports 360×640, 768×512, and 1440×900, assert canvas width/height ratio is within 0.01 of 1.5, its box is within the viewport, and `documentElement.scrollWidth/clientWidth` plus `scrollHeight/clientHeight` show no overflow.

- [ ] **Step 4: Implement successful bootstrap and non-interactive rendering**

Import `styles.css`. Resolve the map with `new URL("./assets/maps/phase-0.json", import.meta.url)`, `fetch` it, parse it, then call `createGame`. For now, a bootstrap rejection may leave the non-game shell; the visible failure path is added only after its own RED in Step 7.

CSS sets `html`, `body`, and `#app` to a zero-margin full viewport with hidden overflow; `#app` centers a `#game` region whose maximum aspect is 3:2. Configure Phaser at 768×512 with `Phaser.Scale.FIT`, `CENTER_BOTH`, transparent antialias-disabled rendering, and one `MapScene`. Draw the grid, blockers, and player; initialize the status from authoritative map state; accept no keyboard input yet. Re-run the focused initial/viewport tests to GREEN.

- [ ] **Step 5: Write input/collision browser tests and verify each RED**

Next, add the following input/collision tests together while the shell still accepts no input. Run each one by title and observe its own position assertion fail before wiring keyboard input:

- ArrowRight moves to `(3,2)` exactly once;
- holding ArrowDown beyond 180 ms changes only the row and repeats at least once;
- after pressing and holding ArrowRight then ArrowDown, capture the position after both immediate steps, wait beyond 180 ms, and assert the row advances by at least one repeat while the column remains exactly fixed;
- repeated ArrowLeft/ArrowUp stops at `(0,0)`; and
- from a fresh page, three ArrowRight presses stop at `(4,2)` because `(5,2)` is blocked.

- [ ] **Step 6: Wire immediate and repeated input only after behavioral RED**

Wire immediate keydown through `moveGridPosition`, then re-run the focused press/edge/blocker tests to GREEN. Before wiring scene `update`, run the held-repeat and simultaneous-key tests separately and observe each fail: the simultaneous test must fail because the winning row does not repeat, not merely pass because neither axis moved. Then integrate `ArrowRepeatController.update` and make both GREEN while keeping the losing column fixed.

- [ ] **Step 7: Write the failing boot-failure browser test**

Before page load, intercept `**/phase-0*.json` and fulfill a 200 JSON response with missing `Spawn`. Assert a `role="alert"` containing `Spawn`, zero canvases, and unchanged absence of a position update after ArrowRight.

- [ ] **Step 8: Verify boot-failure RED**

Run: `pnpm exec playwright install chromium && pnpm exec playwright test`

Expected: the test executes against the bootable app and FAILS because no readable alert replaces the game shell.

- [ ] **Step 9: Implement the bootstrap failure path**

Keep a local `game` variable; on failure destroy it if assigned, clear `#game`, remove/disable the position output, and insert the readable alert using `textContent`. Re-run the focused failure test to GREEN.

- [ ] **Step 10: Finish Stage A rendering and input cleanup**

In the scene, confirm the final implementation:

- draw a 32-pixel grid with Phaser Graphics;
- fill blocked cells in a distinct color;
- draw a solid player rectangle centered in its grid cell;
- create one `ArrowRepeatController`;
- listen through Phaser keyboard events, passing `event.repeat` to `keyDown`;
- call movement once for an immediate direction and at most once from each scene `update(time)`;
- update the player visual and DOM status only from the resulting authoritative grid position; and
- remove keyboard listeners on scene shutdown.

- [ ] **Step 11: Verify full GREEN**

Run: `pnpm exec playwright test && pnpm test && pnpm build`

Expected: all browser tests pass, all unit tests pass, and the production build exits 0.

- [ ] **Step 12: Commit and review**

Commit message: `feat: render stage a grid movement`

---

### Task 6: Stage A Browser Verification and Mandatory User Checkpoint

**Classification:** Lightweight read-only verification gate. No source files or commits.

- [ ] **Step 1: Run fresh automated acceptance**

Run: `pnpm install --frozen-lockfile && pnpm test && pnpm build && pnpm exec playwright test`

Expected: every command exits 0 with no failed tests.

- [ ] **Step 2: Drive the actual app with the repository-default browser QA skill**

Start the Vite server from port 3150, accepting Vite's next free port on collision and recording the actual port in `.dev/port`. Verify the three required viewport sizes, press and hold behavior, simultaneous keys, all edges, the blocker at `(5,2)`, and the invalid-map alert. Capture one Stage A screenshot and report its absolute path; do not open it automatically.

- [ ] **Step 3: Inspect browser diagnostics**

Confirm no uncaught page errors and no project-generated console warnings. Record the canvas bounds and observed initial/blocked positions in the handoff.

- [ ] **Step 4: Stop for explicit approval**

Give the user the local URL, screenshot path, command results, and a short manual checklist. **Do not begin Task 7 until the user explicitly approves Stage A.**

---

### Task 7: Stage B Berlin Park Grid

**Precondition:** The user explicitly approved Task 6. If not, stop.

**Execution:** Implement inline in the primary session as explicitly requested; do not dispatch subagents.

**Files:**

- Create: `tests/unit/phase-b-assets.test.ts`
- Create: `tests/unit/phase-b-layout.test.ts`
- Create: `src/game/assets/phase-b-assets.ts`
- Create: `src/game/map/phase-b-layout.ts`
- Add: `src/assets/sprites/asphalt.png`
- Add: `src/assets/sprites/grass.png`
- Add: `src/assets/sprites/tree.png`
- Add: `src/assets/sprites/trash-can.png`
- Add: `src/assets/sprites/Brandenburg-Gate.png`
- Add: `src/assets/sprites/hobo.png`
- Modify: `src/assets/maps/phase-0.json`
- Modify: `src/game/create-game.ts`
- Modify: `src/game/scenes/map-scene.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`
- Modify: `tests/unit/tiled-contract.test.ts`
- Modify: `tests/e2e/phase-0.spec.ts`

**Interfaces:**

```ts
export const PHASE_B_ASSETS = {
  asphalt: { key: "asphalt", url: asphaltUrl },
  grass: { key: "grass", url: grassUrl },
  tree: { key: "tree", url: treeUrl },
  trashCan: { key: "trash-can", url: trashCanUrl },
  gate: { key: "brandenburg-gate", url: gateUrl },
  character: { key: "character", url: characterUrl },
} as const;

export type TerrainKind = "asphalt" | "grass";
export function terrainAt(column: number, row: number): TerrainKind;
```

- [ ] **Step 1: Write the failing asset-manifest and layout tests**

Assert the six exact supplied PNG paths exist and carry the PNG signature. Specify the `PHASE_B_ASSETS` keys above. Specify asphalt on rows 2–4 and 11–13 plus columns 3–5 and 16–18, with grass elsewhere. Specify trees on grass at `(1,9)`, `(8,7)`, `(8,9)`, `(11,7)`, `(13,8)`, `(21,6)`; trash cans on asphalt at `(7,3)`, `(17,7)`, `(15,12)`; Gate origin `(20,0)` and footprint 4×3; spawn `(2,2)` on asphalt; and every prop position in the checked-in blocked-cell set.

- [ ] **Step 2: Verify RED**

Run: `pnpm test tests/unit/phase-b-assets.test.ts tests/unit/phase-b-layout.test.ts`

Expected RED: test collection fails because the manifest and layout modules do not exist. Add empty typed seams, re-run, and confirm behavioral failures for the missing keys and layout values.

- [ ] **Step 3: Implement the manifest, layout, and prop-aligned Tiled collision**

Reference only the six supplied textures. Implement the fixed Option A layout without a generic map editor or asset pipeline. Replace the Stage A Collision rectangles with nine 32×32 rectangles at the six tree and three trash-can cells, and update the checked-in map test from blocker `"5,2"` to the exact nine-key set.

- [ ] **Step 4: Verify layout GREEN**

Run: `pnpm test tests/unit/phase-b-assets.test.ts tests/unit/phase-b-layout.test.ts tests/unit/tiled-contract.test.ts`

Expected: asset, layout, and parser tests pass with exact visual/collision alignment.

- [ ] **Step 5: Write the failing Stage B browser and asset-failure assertions**

Assert the real canvas boots at `(2,2)`, `#game` reports `data-presentation="berlin-placeholders"`, movement is rejected by trash can `(7,3)` and tree `(8,7)`, and a failed real texture request produces the readable boot alert with no canvas or status output.

Run: `pnpm exec playwright test tests/e2e/phase-0.spec.ts`

Expected RED: the presentation marker and new obstacle flow fail before scene changes; the texture-failure case does not yet reach the bootstrap cleanup path.

- [ ] **Step 6: Render the approved layout and route load failures**

Preload all six manifest textures. Render 384 terrain images at exact 32×32 design cells, then the Gate at native 128×96, tree/bin props, a subtle grid, and the character at the authoritative player cell. Preserve texture aspect ratios and pixel-snap coordinates. Set the presentation marker only after successful rendering. Thread a Phaser loader-failure callback through `createGame` into the existing idempotent bootstrap cleanup. Add `image-rendering: pixelated` to the canvas; keep `Phaser.Scale.FIT` and the complete-map 3:2 layout.

- [ ] **Step 7: Verify focused unit/build GREEN and prepare manual browser review**

Run: `pnpm test && pnpm build`

Expected: all unit tests and the production build pass. Keep the Stage B Playwright coverage checked in but do not run it unless the user explicitly asks. Start Vite for the manual browser checkpoint.

- [ ] **Step 8: Commit and review**

Commit message: `feat: add berlin park grid`

---

### Task 8: Final Regression, Browser Verification, and Whole-Branch Review

**Classification:** Lightweight read-only verification gate. No feature source changes unless the final review finds a defect; any defect fix returns to TDD and receives re-review.

- [ ] **Step 1: Run the complete clean verification suite**

Run: `pnpm install --frozen-lockfile && pnpm test && pnpm build`

Expected: frozen install, unit tests, and build all exit 0. Do not run Playwright unless the user explicitly asks.

- [ ] **Step 2: Verify the final app in a real browser**

Repeat the Stage A movement/collision/input checks and all three viewport checks against Stage B. Confirm the terrain, Brandenburg Gate, and character are visible; check page errors and console warnings; capture one final screenshot and report its absolute path.

- [ ] **Step 3: Audit scope and repository state**

Run `git status --short`, inspect `git diff origin/main...HEAD --stat`, and re-read the approved spec acceptance criteria. Confirm no deferred capabilities, external assets, merge, push, or PR were introduced.

- [ ] **Step 4: Run broad whole-branch review inline**

Review the complete implementation range in the primary session for specification coverage, architecture, test quality, browser evidence, and scope discipline. Fix Critical/Important findings through focused red/green cycles, then repeat the review. Do not dispatch subagents.

- [ ] **Step 5: Hand off without landing**

Report commits, exact verification output summaries, browser evidence, screenshot paths, and remaining Minor findings. Stop before merge, push, or PR.
