# Hobo Berlin — Workstream specs

Parent product/tech spec: [`../../SPEC.md`](../../SPEC.md)  
Product design summary: [`../../pdd.md`](../../pdd.md)

These files split ownership so the team can work in parallel after **WP-0** lands. Product rules in `SPEC.md` win if anything conflicts.

## Workstreams

| Spec | Owns | Maps to work packages |
| --- | --- | --- |
| [`app-infra.md`](./app-infra.md) | Project bootstrap, portrait shell, canvas/grid, input, module layout, HUD shell, intro/end UI | WP-0, WP-4 |
| [`game-mechanics.md`](./game-mechanics.md) | Collectibles, economy, timer, hearts, 7-day run, win/lose | WP-1, WP-2, WP-3 |
| [`assets.md`](./assets.md) | Visual art, sprites, landmarks, icons, placeholder→skin pipeline | WP-5 (art) |
| [`sound-and-dialogue.md`](./sound-and-dialogue.md) | SFX, ambience, text bubbles, line copy | WP-5 (audio/dialogue) |

## Dependency order

```text
app-infra (WP-0)  ──►  share with team
        │
        ├── game-mechanics (WP-1 … WP-3)     parallel
        ├── app-infra shell UI (WP-4)        parallel
        ├── assets (WP-5 art)                parallel
        └── sound-and-dialogue (WP-5 audio)  parallel
```

## Claiming work

1. Pull the tagged foundation (`foundation-v0` or equivalent).
2. Claim a workstream in the team channel / board.
3. Implement against that workstream’s acceptance criteria.
4. Keep balance numbers and venue labels in `config` — do not hard-code in systems.
