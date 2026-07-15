# Phase 0 Grid Movement Design

**Status:** Approved
**Date:** 2026-07-15
**Audience:** Contributors implementing and reviewing the first playable browser slice

## Goal

Ship one responsive Phaser scene in which a placeholder player moves one cell at a time around a complete 24×16 Berlin-themed map, cannot cross its bounds or configured blockers, and can be verified through pure unit tests and a browser-level user flow.

Phase 0 proves the project toolchain, the Tiled-to-grid contract, deterministic movement, responsive whole-map presentation, and the browser test path. It is not the game loop.

## Scope

Phase 0 contains:

- a pnpm-managed Phaser 4 + TypeScript + Vite application;
- one finite, orthogonal Tiled map with a 32-pixel tile grid;
- one player spawn and rectangle-defined collision cells;
- pure orthogonal grid movement driven by arrow keys;
- responsive rendering of the entire map without camera following;
- a Stage A debug proof of concept followed, only after manual approval, by Stage B local Berlin placeholders; and
- Vitest unit tests plus a Playwright end-to-end movement flow.

The following are deferred: bins, REWE interactions, bottle collection, economy, audio, dialogue, touch controls, WASD, context actions, HUD, camera following, multiple scenes, persistence, random maps, character selection, and customization.

## Toolchain and Architecture

Pin these verified package versions in `package.json` and commit `pnpm-lock.yaml`:

| Tool | Version | Role |
| --- | ---: | --- |
| pnpm | 11.13.0 | sole package manager |
| Phaser | 4.2.1 | scene, rendering, scaling, and keyboard integration |
| Vite | 8.1.4 | development and production build |
| TypeScript | 7.0.2 | application and test types |
| Vitest | 4.1.10 | pure unit tests |
| Playwright | 1.61.1 | browser integration tests |

Support Node.js `>=24 <26`. Declare that range in `engines.node` and declare `pnpm@11.13.0` in `packageManager` so Corepack and CI use the same package manager version.

Use small modules with one responsibility:

```text
src/
  main.ts                 # browser bootstrap and visible boot failure
  game/config.ts          # fixed design and input timing constants
  game/create-game.ts     # Phaser Game configuration
  game/scenes/map-scene.ts
  game/grid/movement.ts   # pure movement decision
  game/input/repeat.ts    # deterministic arrow repeat state
  game/map/tiled-contract.ts
  assets/maps/phase-0.json
tests/
  unit/
  e2e/
```

The grid model is authoritative. Phaser objects reflect grid positions; their pixel coordinates never decide whether movement is allowed. Keep Phase 0 state local to the single scene rather than introducing a generic store, command bus, or future-game interfaces.

## Coordinate and Map Contracts

```ts
interface GridPosition {
  column: number;
  row: number;
}

interface GridBounds {
  columns: number;
  rows: number;
}

type Direction = "up" | "down" | "left" | "right";
```

`GridPosition` values are zero-based integers. The map is exactly 24 columns × 16 rows, each tile is 32×32 pixels, and the design resolution is therefore 768×512 pixels.

The checked-in Tiled JSON must be a finite orthogonal map with `width: 24`, `height: 16`, `tilewidth: 32`, and `tileheight: 32`. It must contain:

- exactly one object layer named `Spawn`;
- exactly one point object named `player` on `Spawn`; and
- exactly one object layer named `Collision`, containing zero or more rectangle objects.

The `player` point coordinates must be non-negative multiples of 32 and fall within the map. Its grid cell is `(x / 32, y / 32)`.

Every Collision object must have `x`, `y`, `width`, and `height` that are non-negative multiples of 32; width and height must be greater than zero; and its rectangle must fit wholly inside the map. A layer or object with `visible: false` is rejected; omitted `visible` means visible, matching Tiled's default. Each covered tile becomes a blocked cell. Object IDs, layer order, drawing order, and object labels other than `player` do not affect gameplay.

The generic parser permits an empty Collision layer. The checked-in Phase 0 map must contain at least one blocker reachable from the spawn by an otherwise walkable orthogonal route so the real browser flow can exercise blocker rejection.

The parser returns the map bounds, spawn, and a set of blocked cell keys. It rejects duplicate required layers, extra `player` points, missing layers, invalid geometry, a spawn inside collision, and any unsupported map dimensions or orientation.

## Movement

Movement is a pure decision with this behavioral interface:

```ts
function moveGridPosition(
  current: GridPosition,
  direction: Direction,
  bounds: GridBounds,
  blockedCells: ReadonlySet<string>,
): GridPosition;
```

One call proposes the adjacent orthogonal cell. If that cell is outside `0 <= column < columns` or `0 <= row < rows`, or its `"column,row"` key is blocked, return the same `current` object reference. Otherwise return a new adjacent position. Inputs are not mutated.

Only ArrowUp, ArrowDown, ArrowLeft, and ArrowRight are accepted. A keydown moves immediately. Holding a key starts repetition after 180 ms and then requests one move every 100 ms. Browser-native repeated keydown events are ignored so cadence does not depend on the operating system.

At most one move is emitted in an input update. A delayed update discards missed repeat intervals: after emitting, the next move becomes due 100 ms after the actual emission time. If more than one arrow is held, the most recently pressed still-held key wins. Releasing it hands control to the next most recently pressed held key, whose 180 ms repeat delay restarts. This makes diagonal movement impossible and produces deterministic behavior.

## Rendering and Responsive Presentation

Phaser uses a 768×512 game canvas, `Phaser.Scale.FIT`, and centered alignment within a full-viewport page. The canvas may scale up or down while preserving its 3:2 aspect ratio. No camera scroll or zoom is allowed: all 24×16 cells remain visible at once at viewport sizes 360×640, 768×512, and 1440×900 without document overflow.

Each accepted movement synchronously updates the player's grid position and then places the visual at the center of that 32-pixel cell. Rejected movement leaves both state and visual unchanged.

### Stage A — Debug proof of concept

Stage A uses Phaser graphics primitives only:

- a visible 24×16 grid;
- a solid player marker;
- visibly distinct blocked cells; and
- a small DOM status readout exposing the current `column,row` for human and Playwright verification.

The user must run and manually approve Stage A after the automated suite passes and browser behavior is demonstrated. No Stage B files or artwork may be created before that approval.

### Stage B — Berlin placeholders

After Stage A approval, replace only the debug presentation with locally owned, intentionally temporary placeholders:

- grass and asphalt terrain;
- blocking trees on grass and blocking trash cans on asphalt;
- one Brandenburg Gate landmark; and
- a character sprite.

Use the supplied PNG files in `src/assets/sprites/`: `grass.png`, `asphalt.png`, `tree.png`, `trash-can.png`, `Brandenburg-Gate.png`, and `hobo.png`. Do not use the opaque alternate Gate or the bench. Phaser loads these textures directly; no Tiled tileset, external asset search, generated art, or reusable asset pipeline belongs in Phase 0.

The approved Option A layout uses asphalt on rows 2–4 and 11–13 plus columns 3–5 and 16–18; every other terrain cell is grass. Trees occupy `(1,9)`, `(8,7)`, `(8,9)`, `(11,7)`, `(13,8)`, and `(21,6)`. Trash cans occupy `(7,3)`, `(17,7)`, and `(15,12)`. Those nine prop cells are the checked-in Collision cells. Grass remains walkable. The Gate starts at `(20,0)`, uses its native 128×96 four-by-three-cell footprint, renders once, and is decorative rather than blocking.

Stage B preserves the map geometry contract, spawn `(2,2)`, movement rules, input cadence, whole-map scaling, status readout, and visible failure behavior. It intentionally replaces the Stage A blocker fixture with the prop-aligned Collision cells. All assets are sized once in the fixed 768×512 design space with preserved aspect ratios; Phaser scales the complete canvas uniformly for desktop and mobile without camera following.

## Failure Behavior

Map validation errors throw an `Error` whose message names the violated layer or geometry contract and the offending object when available. The scene does not start with a partially valid map.

Bootstrap catches an asset-load or map-contract failure, destroys any partial game instance, and renders a readable `role="alert"` message in the page. It does not silently substitute a map, spawn, or empty collision layer.

Invalid runtime movement inputs are prevented by TypeScript and the input adapter; the pure movement function assumes a valid current position, direction, and positive bounds. Rejected legal moves are normal outcomes, not errors.

## Test Strategy

Development follows red-green-refactor. Every behavior test is observed failing for the expected missing behavior before production code is added.

Vitest covers:

- each direction and input immutability;
- bounds and blocked-cell rejection;
- valid Tiled contract conversion, including multi-cell rectangles;
- every map rejection listed above; and
- immediate press, 180 ms initial delay, 100 ms repeat, key priority, release fallback, and no multi-move update.

Playwright starts the real Vite application and verifies the successful movement flow against the real Phaser canvas and status readout:

1. the complete canvas fits the viewport at desktop and mobile sizes with a 3:2 ratio and no page overflow;
2. one arrow press moves exactly one cell;
3. a held arrow repeats without browser-native key repetition;
4. simultaneous arrows never produce a diagonal step;
5. movement stops at a map edge; and
6. movement stops before a configured blocker.

A second Playwright test intercepts the real map request and returns a contract-invalid map. It verifies that the page contains a readable `role="alert"`, no Phaser canvas remains, and no gameplay input is accepted. This exercises the production bootstrap failure path without adding a test-only application API.

Use the status readout for position assertions and screenshots/canvas bounds for presentation assertions. Do not expose test-only production APIs or assert on mocked Phaser behavior.

## Acceptance Criteria

Stage A is ready for the manual checkpoint only when all of the following are true:

1. `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build`, and `pnpm exec playwright test` exit successfully.
2. The app loads with no uncaught browser errors or console warnings produced by project code.
3. Arrow press and held repetition match the defined timing, and simultaneous keys never move diagonally.
4. The player cannot cross any map edge or Collision cell.
5. Invalid checked-in map contracts fail visibly rather than booting partial gameplay.
6. The entire 24×16 map is visible and centered at all three required viewport sizes without horizontal or vertical document overflow.
7. A human verifies Stage A in the browser and explicitly approves beginning Stage B.

Phase 0 is complete only after that approval, all six Stage B textures render in the approved layout, the prop-aligned collision flow passes, all unchanged Stage A behavior remains green, and the final app is verified in a real browser at the required viewport sizes.

## Delivery Gates

1. Approve this design specification.
2. Commit the approved specification, implementation plan, root intent files, and aligned app-infra guidance as one documentation unit.
3. Implement and verify Stage A.
4. Stop for explicit manual Stage A approval.
5. Implement and verify Stage B.
6. Stop before merging, pushing, or opening a pull request.
