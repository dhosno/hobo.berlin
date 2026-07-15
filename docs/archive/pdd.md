# Hobo Berlin — Product Design Document (PDD)

Source: team ideation transcript (`transcript.md`).  
Status: draft for MVP build. Decisions marked **Locked**, **Deferred**, or **Open**.

**Implementation & work packages:** see [`SPEC.md`](./SPEC.md) — start with **WP-0 Foundation**, then share with the team before parallelizing WP-1–WP-5.

**Workstream specs:** [`docs/specs/`](./docs/specs/) — app infra · game mechanics · assets · sound & dialogue.

---

## 1. Problem statement

Build a short, funny, playable browser game about surviving a week as a newly homeless tech worker in Berlin.

Players scrape Pfand bottles, cash them in, eat, and try not to die before *Agentur für Arbeit* approves their money. The satire is the premise; the product is a real win/lose game loop, not an exploratory art piece.

**Success for the first build:** someone can open the page, move a hobo on a Berlin-themed grid, interact with items, and feel win/lose pressure — even if art and polish are rough.

---

## 2. Product overview

| Field | Value |
| --- | --- |
| Working title | **Hobo Berlin** (alt: Hobo AI) |
| Genre | Top-down 2D survival / resource scramble |
| Tone | Dark comedy, Berlin local jokes, AI-layoff satire |
| Platform | Responsive web app; **mobile-first vertical frame** (phone play; desktop may letterbox to the same portrait canvas) |
| Stack (MVP) | TypeScript frontend only — no backend, no SSO |
| Session length | ~7 short rounds (~1 minute each target); full run under ~10 minutes |

### Fantasy

You are a fired AI-era worker dumped onto the street. Survive seven nights. Collect bottles. Get cash. Eat. Don’t burn yourself in the bins. Wait for the bureaucracy to save you.

---

## 3. Characters (start screen)

Player starts as one of three randomized characters (different starting cash / vibe; stinkiness stats **Deferred**).

| Character | Backstory hook |
| --- | --- |
| Former prompt engineer | Fired because “loop engineering” is all the rage |
| Former head of marketing | Replaced by an end-to-end workflow |
| Former QA engineer | Nobody needed; Playwright scripts generate in three seconds |

**Locked:** three selectable/randomized archetypes with different starting cash.  
**Deferred:** stinkiness per character; visual customization (beard, etc.).

---

## 4. Core game loop

### Goal

Survive **7 days/nights** with at least **1 heart** remaining until *Agentur für Arbeit* approves money → **Win**.

Reach **0 hearts** → **Game Over**.

### Per-day loop

1. Round starts (player presses Start); countdown timer begins.
2. Move on the grid; find and interact with bins / loose bottles / landmarks.
3. Convert bottles → euros at a deposit location.
4. Spend euros on food (and optionally other recovery interactions).
5. When the timer ends:
   - If daily survival condition is met → keep hearts, advance to next day.
   - If not → lose **1 heart**, then next day (or game over if hearts = 0).
6. Next morning: bins / collectibles respawn; **money and hearts persist**.

### Daily survival condition (MVP recommendation)

**Locked intent:** each day has a clear fail condition tied to eating / spending a minimum amount of money before the timer ends.

**MVP rule (proposed, implementable):**

- Player must spend at least **€X on food** before the day timer ends (suggested starting value: **€5**; tune later).
- Fail → −1 heart at day end.
- Burn / hazard outcomes can also reduce hearts mid-day (see Interactions).

**Rejected for MVP complexity:** separate hunger bar + energy bar + shelter night check all at once. Prefer **hearts + timer + spend-to-survive**.

---

## 5. Presentation & camera

| Decision | Status |
| --- | --- |
| Top-down **2D grid**, whole map visible | **Locked** |
| Not Mario side-scroller, not Doom corridor, not multi-angle camera | **Locked** |
| Isometric optional later | **Deferred** |
| Grid size power-of-two friendly; portrait-friendly (e.g. ~64 tall × ~120 wide, or similar non-square) | **Locked direction** |
| One landmark location for MVP | **Locked** — start with **Brandenburger Tor** |
| Later locations: Alexanderplatz, Kottbusser Tor (Kotti) | **Deferred** |
| Landmark is mostly flavor (gate/tower decoration), not heavy simulation | **Locked** |

---

## 6. Player actions

| Action | Notes |
| --- | --- |
| Move | Up / down / left / right on the grid |
| Interact | Adjacent / on-tile interact with items (bins, shops, food, dealer, etc.) |
| Collect | Bottles from mystery bins or loose street spawns |
| Deposit | Exchange bottles for euros (Pfand) |
| Buy / consume | Food (and later recovery items) |
| Wait | Shop queues / river wash — **Deferred** for MVP |

### Controls

| Input | MVP |
| --- | --- |
| Keyboard | Arrow keys / WASD; hold to keep walking |
| Touch D-pad / action button | Nice-to-have; Game Boy–style overlay discussed |
| Tap-to-walk pathfinding | **Deferred** |

Desktop presentation can still use the portrait “phone frame.” Touch polish is iterative.

---

## 7. World entities

### Grid & items

- World is a grid of cells.
- **Items** occupy one or more cells (e.g. 1×1 bottle pile, 4×2 shop).
- Items have identity + size config; art skins can be swapped later.
- Character **cannot walk through** blocking items (blocking can start simple: occupied = blocked).
- Cells/items can carry state (empty / interactable / depleted / blocked).

### Interactables (MVP set)

| Entity | Role |
| --- | --- |
| Mystery bin | Primary collect interaction; outcome unknown until interact |
| Loose bottles | Small yields near flavor spots (e.g. döner); may respawn |
| Deposit point | Cash bottles → euros (Rewe / Pfand machine flavor) |
| Food point | Spend euros to satisfy daily eat condition (döner or supermarket — see Open) |
| Landmark | Visual anchor (Brandenburger Tor) |

### Interactables (later / optional)

| Entity | Role |
| --- | --- |
| Shelter / night location | Reach before night; −1 heart if missed — **Deferred** (can start without) |
| Dealer / park point | Pay ~€10, +1 heart, −time (funny recovery) — **Nice-to-have** |
| River / wash | Wait time to reduce stink — **Deferred** with stinkiness |
| NPCs | Flavor dialogue / rare bottle gift — **Deferred** |
| Medicine / hospital | Heart restore — superseded by funnier dealer idea if used |

---

## 8. Economy & numbers (starting values — tune in playtest)

| Parameter | Starting suggestion | Notes |
| --- | --- | --- |
| Hearts | 3 | Half-heart damage allowed from burns |
| Days to win | 7 | Until ALG / AfA money arrives (flavor) |
| Day length | ~60 seconds | Fast, “TikTok paced”; 3 min mentioned as upper bound |
| Plastic bottle Pfand | €0.25 | Real-ish; glass can wait |
| Bin yield | Random **1–5** bottles | Not huge piles |
| Burn chance | Low, limited | e.g. ~10% of bins “dangerous”; capped burns per map so early death isn’t guaranteed |
| Burn effect | −0.5 heart | Exclusive outcome: burn **or** bottles, not both |
| Food cost / day gate | ~€5 | Must spend to clear the day |
| Dealer heal | €10, −10s | Optional comedy heal |

**Locked:** Pfand → cash → food chain exists in the design.  
**Provisional default (SPEC):** split venues — bottle-return only + food only — so each interaction has one purpose. Labels configurable.

---

## 9. Mystery bin interaction

1. Player interacts with a bin.
2. Resolve **one** outcome (slot-machine feel, still unknown):
   - **Bottles:** random count added to inventory; SFX + small icon feedback.
   - **Burn:** −0.5 heart; burn icon feedback; no bottles.
3. Bin becomes depleted / non-interactive for the rest of the day (or until next day respawn).
4. Do **not** preview bottle counts on the map; uncertainty is the challenge.

Loose street bottles are the predictable small yield; bins are the risk/reward.

---

## 10. HUD

Top bar (placeholders OK for architecture spike):

- Character name
- Hearts (support half-heart display)
- Bottles count
- Money in **€**
- Day number (1–7)
- Countdown timer

Optional later: stinkiness meter, hunger bar, text bubbles.

---

## 11. Win / lose (non-negotiable)

**Locked:** the product is a **game**. Win and lose states are required. Atmosphere (sounds, bubbles, landmarks) is secondary.

| Outcome | Condition |
| --- | --- |
| Win | Survive 7 days with ≥1 heart |
| Lose | Hearts reach 0 |
| Day fail | Timer ends without meeting eat/spend gate → −1 heart |

Day transition can be a short day→night→morning animation (~3s). Shelter is not required for this.

---

## 12. Audio & juice

| Feature | Priority |
| --- | --- |
| Short SFX on collect / deposit / fail / burn | Nice-to-have parallel track |
| Text bubbles (90s RPG style, not full VO) | Nice-to-have |
| Background city ambience / music | Nice-to-have |
| ElevenLabs-style SFX generation | Tooling option, not product requirement |

---

## 13. Technical architecture

Canonical architecture, state model, and **WP-0 Foundation** acceptance criteria live in [`SPEC.md`](./SPEC.md) (Work packages section).

| Topic | Choice |
| --- | --- |
| Language | TypeScript |
| Runtime | Browser SPA |
| World render | HTML Canvas 2D |
| HUD / controls | DOM layered on the canvas |
| Backend | None for MVP |

---

## 14. Scope

### Must-have (playable MVP)

- [ ] Title / start + short rules (“Survive 7 nights in Berlin”)
- [ ] One character (or three with different starting cash)
- [ ] One map (Brandenburger Tor flavor)
- [ ] Grid movement
- [ ] Mystery bins + loose bottles
- [ ] Bottle inventory + euro balance
- [ ] Deposit bottles → money
- [ ] Buy food / clear daily spend gate
- [ ] Hearts + timer + 7-day progression
- [ ] Win and Game Over screens
- [ ] Day respawn of collectibles; persist money/hearts

### Nice-to-have (parallel after base)

- [ ] Touch controls overlay
- [ ] SFX + ambience
- [ ] Text bubbles / funny lines
- [ ] Half-heart burn polish + limited dangerous bins
- [ ] Dealer heal comedy beat
- [ ] Better pixel art / landmark assets
- [ ] Multiple locations (Alex, Kotti)
- [ ] Character select screen polish

### Explicitly deferred

- Full Berlin open world / RTS / heavy RPG interiors
- Shelter / night pathfinding as a hard requirement
- Stinkiness gating shops/shelters
- Wait-time queues / microtransactions to skip queues
- PVP bottle stealing
- Hunger + energy bars in addition to hearts (unless hearts prove insufficient)
- Native app / React Native
- Backend, accounts, SSO

---

## 15. Acceptance criteria

### Playable demo

1. Opening the site shows a portrait game frame and a Start action.
2. Player can move the character on the grid with keyboard.
3. Player can interact with at least one bin and receive bottles **or** a negative outcome.
4. Player can deposit bottles and see euros increase.
5. Player can spend euros on food and see the daily condition clear (or hearts drop if they don’t).
6. Timer ending advances the day and can reduce hearts.
7. Reaching day 7 success shows **Win**; hearts at 0 shows **Game Over**.
8. Experience is understandable without reading this PDD (minimal on-screen rules).

Art quality is not a gate. **Playability is.**

---

## 16. Open questions

1. **Shop model:** single supermarket (deposit + buy) vs split deposit vs döner-only food?
2. Exact **€/day** threshold and bottle economy so a competent player can win ~50% of the time?
3. Are **half-hearts** in MVP or integer hearts only until burn ships?
4. Day length: **60s** vs **90s** after first playtest?
5. Character start differences: cash only, or also starting hearts / map seed?

Resolve these during implementation; do not block the architecture spike.

---

## 17. Build plan

See **Work packages** in [`SPEC.md`](./SPEC.md):

1. **WP-0 Foundation** — project, canvas, grid, items, movement, collision, action hook, HUD shell → merge and share.
2. Parallel: **WP-1** collectibles · **WP-2** economy · **WP-3** run loop · **WP-4** shell UI.
3. **WP-5** polish (art/SFX/bubbles) anytime after WP-0.
4. Ship ugly-but-playable; juice last.

---

## 18. Design principles

1. **Win and lose first** — flavor without stakes is not the product.
2. **Uncertainty on bins** — don’t spoil the map into a solved fetch quest.
3. **Few mechanics, clear loop** — bottles → money → food → survive the day × 7.
4. **Berlin jokes over simulation realism** — funny beats realism when they conflict.
5. **Mobile vertical frame** — design for phone; present the same on desktop.
6. **Placeholders over perfection** — architecture enables parallel work; skins come later.
