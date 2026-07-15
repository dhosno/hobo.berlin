# Workstream: Assets

**Status:** Draft  
**Parent:** [`../../SPEC.md`](../../SPEC.md)  
**Work packages:** WP-5 (art portion); can start after WP-0  
**Depends on:** [`app-infra.md`](./app-infra.md) WP-0 (placeholder slots / item types)  
**Does not own:** game rules, audio playback engine, dialogue text authorship (see [`sound-and-dialogue.md`](./sound-and-dialogue.md) for lines)

---

## Mission

Replace rectangles with readable Berlin-flavored visuals without changing collision or mechanics. Ship a clear placeholder → skin pipeline so art can land in parallel.

Tone: satirical, punch-up, legible on a small portrait screen. Prefer simple pixel / flat game art over photorealism.

---

## Principles

1. **Skins are data.** Item rules stay in mechanics; assets bind by `type` + optional `skinId` / `assetKey`.
2. **Placeholders first.** Colored rects + labels are valid until art lands.
3. **Footprint stays authoritative.** A 4×2 shop sprite must match its grid size (or letterbox inside the footprint).
4. **Readable at phone scale.** Icons and hearts must work at ~360 px width.
5. **No gameplay in art.** Do not encode bin outcomes, bottle counts, or hazard tells in the default bin look.

---

## Asset inventory (MVP target)

| Asset | Priority | Notes |
| --- | --- | --- |
| Player placeholder → 3 character variants | High | Prompt engineer / marketing / QA; same silhouette OK |
| Mystery bin (available / depleted) | High | No outcome preview |
| Loose bottle (1×1) | High | Small, readable |
| Bottle-return venue | High | Multi-cell; label space for config name |
| Food venue | High | Multi-cell; Döner (or config) flavor |
| Landmark / scenery (Brandenburg Gate) | Medium | Decorative collision OK |
| Extra scenery (trees, kiosk, railing) | Low | Blocking or passable per config |
| HUD icons | High | Heart full/half/empty, bottle, euro |
| Feedback icons | High | Bottle pop, burn, “not enough cash” |
| Intro / win / lose frames | Medium | Can be DOM + CSS initially |
| Touch control chrome | Low | Style D-pad / action after functional stubs exist |

---

## Pipeline

```text
config / WorldItem
  → type + assetKey
  → render atlas or image map
  → draw inside footprint (scale to cell size)
```

Suggested layout (adjust to repo):

```text
public/assets/   or   src/assets/
  characters/
  items/
  scenery/
  ui/
  feedback/
```

Export guidance:

- PNG or WebP; keep sheets small.
- Power-of-two optional, not required.
- One logical skin per file or a simple atlas JSON if needed.
- Name files by key used in config (`bin_available.png`, `player_qa.png`).

---

## Map / art direction

- First location flavor: **Brandenburger Tor** area — landmark as scenery, not a puzzle.
- Top-down 2D only (no isometric requirement for MVP).
- Grid may stay visible in early builds; hide lines when scenery is dense enough.
- Later maps (Alex, Kotti): deferred; keep skins keyed so new maps reuse the same item types.

---

## Contracts

| Other stream | Contract |
| --- | --- |
| App infra | Document `assetKey` (or equivalent) on items / characters; renderer falls back to colored rect + label |
| Game mechanics | Never wait on final art; mechanics ship with placeholders |
| Sound & dialogue | Bubble chrome / portrait frames can be supplied here; line text lives in dialogue spec |

---

## Acceptance

1. Every MVP item type has either a skin or an intentional labeled placeholder.
2. Swapping a skin file/key does not require changing collision or interaction code.
3. HUD hearts support full and half display.
4. Feedback icons exist for bottle gain and burn (even if temporary).
5. Portrait readability checked on a ~360×640 viewport.
6. No asset encodes secret bin outcomes.

---

## Out of scope

- Full Berlin open-world tileset
- Animated NPC crowds
- Photogrammetry / AI photoreal maps as the production path
- Brand-legal final packaging review (flag real logos for later legal pass)
