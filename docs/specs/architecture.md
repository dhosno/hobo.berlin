# Architecture


## Proposed Stack

| Layer | Recommendation | Why |
|---|---|---|
| Game engine | **[Phaser](https://phaser.io/)** | Fastest path to a playable 2D browser game with movement, maps, collisions, collectibles, UI, and audio. |
| Language | **TypeScript** | Keeps game state, interactions, and object types manageable as the prototype grows. |
| Build tool | **Vite** | Simple local dev server, fast reload, easy deploy to Netlify/Vercel/GitHub Pages. |
| Map editor | **[Tiled](https://www.mapeditor.org/)** | Build Berlin maps as tile grids, place bins/Rewe stores/NPCs as object layers, and load them into Phaser. |
| Art style | **Pixel art or flat vector tiles** | Much faster than custom illustrated scenes. Easier to generate, remix, and keep visually consistent. |
| Audio | **[Phaser](https://phaser.io/) Sound first; [Howler.js](https://howlerjs.com/) if needed** | Phaser’s built-in sound is enough for background loops and SFX. Add Howler only if you need more advanced audio control. |
| Assets | **[Kenney](https://kenney.nl/)/[OpenGameArt](https://opengameart.org/) + custom Berlin overlays** | Reduces your highest risk: asset production. Use simple silhouettes/icons for landmarks. |
| Deployment | **Static web app**/ [Vercel](https://vercel.com/) | No backend needed for the MVP. |


## Alternative Solutions

For the gaming engines, the following alternatives where discarded.

### Why not Godot?
Godot is a strong 2D engine, but for this specific project I would not pick it for a rapid web demo unless your team already knows it. Godot web export works, but current docs note browser requirements such as WebAssembly and WebGL 2.0, and Godot 4 C# projects currently cannot export to web. Godot Engine documentation
Godot is better if you want a more “real game engine” workflow, a desktop build, or complex animation tooling. For a lightweight, shareable, hackathon-style browser game, Phaser is lower friction.

### Why not Kaboom.js?
Kaboom would normally be tempting for a tiny prototype, but its own site currently says it is no longer maintained, so I would avoid it for anything you may need to extend. Kaboom.js

### Why not PixiJS alone?
PixiJS is excellent for rendering, and the current stable docs are active, but it is mainly a rendering library rather than a full game framework. You would need to build or add your own systems for input, collision, scenes, tilemap logic, and interaction flow. PixiJS
Use PixiJS if you care more about custom visuals than game mechanics. Use Phaser if you want a playable game quickly.