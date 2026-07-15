# Hobo Berlin

Phase 1 builds the survival loop on the Phase 0 Phaser 4 + Tiled foundation: portrait grid, smaller tiles, HUD, collectibles, REWE/Döner, and a seven-day run.

## Read First

1. `docs/specs/game-mechanics.md` for Phase 1 gameplay rules.
2. `docs/specs/architecture.md` for stack (Phaser, Vite, Tiled, TypeScript).
3. `docs/superpowers/specs/2026-07-15-phase-0-grid-movement-design.md` for grid/movement invariants that still apply (pure movement, Tiled collision, repeat timing).
4. `docs/specs/app-infra.md` for shell/HUD context.

`CONTEXT.md` defines shared terms.

## Invariants

- Use Phaser 4, TypeScript, Vite, Tiled maps, and pnpm exclusively.
- Treat grid state as the movement and collision source of truth; rendering must not own gameplay state.
- Portrait shell matching the **18×28** vertical sketch grid at **28px** tiles (504×784). Full map FIT inside the frame.
- Keep `moveGridPosition` and `ArrowRepeatController` as pure/shared utilities.
- Pure mechanics live under `src/game/mechanics/` with no Phaser imports.
- Follow test-driven coverage for non-trivial rules; keep Playwright flows green.

## Scope

**In Phase 1:** instructions overlay, day phases, bins, loose bottles, REWE, food, hearts HUD, timer, win/lose.

**Still deferred:** Stage B placeholder art, audio assets, click-to-walk pathfinding polish, multiple maps beyond phase-1, PvP.
