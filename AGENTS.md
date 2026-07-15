# Hobo Berlin

Phase 0 builds one small, testable grid-movement scene. Keep changes inside that slice unless an approved spec expands it.

## Read First

Before editing, use this source-of-truth order:

1. The approved Phase 0 design in `docs/superpowers/specs/`.
2. `docs/specs/architecture.md` for the project stack.
3. `docs/specs/app-infra.md` for future infrastructure context that does not conflict with Phase 0.
4. `docs/specs/game-mechanics.md` for future-phase context only.

`CONTEXT.md` defines shared terms; it does not define implementation behavior.

## Invariants

- Use Phaser 4, TypeScript, Vite, Tiled maps, and pnpm exclusively.
- Treat grid state as the movement and collision source of truth; rendering must not own gameplay state.
- Keep the complete 24×16 map visible responsively at a 768×512 design resolution.
- Follow test-driven development: observe each behavior test fail before adding its production code.
- Add dedicated browser-level coverage for the complete movement flow, then verify non-trivial behavior in a real browser.
- Stage B placeholder art must not begin until the user manually approves the Stage A debug proof of concept.

## Scope Guard

Bins, REWE interactions, collection, economy, audio, dialogue, touch controls, camera following, multiple scenes, and character customization are deferred. Do not add speculative abstractions for them.
