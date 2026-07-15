# hobo.berlin

Satirical Berlin survival game: collect Pfand bottles, redeem at REWE, buy a Döner, survive seven days.

## Run

```bash
npm install
npm run dev
```

Open the local URL (default `http://localhost:5173`). Portrait phone frame on desktop.

## Controls

- **Move:** Arrow keys / WASD, or on-screen D-pad
- **Act:** Space / Enter, or **ACT** button (search bin, REWE, Döner)
- Tap a nearby bin once to focus, again to confirm

## Layout

```text
src/
  config.ts          balance + sketch grid size
  game/
    mechanics.ts     authoritative rules (pure-ish updates)
    world.ts         grid helpers + daily spawns
    rng.ts           seedable PRNG
    types.ts
  input/controls.ts
  render/MainScene.ts
  ui/hud.ts
```

## Specs

- [`docs/specs/game-mechanics.md`](docs/specs/game-mechanics.md)
- [`docs/specs/architecture.md`](docs/specs/architecture.md) — Phaser + Vite + TypeScript
