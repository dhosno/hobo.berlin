# Workstream: Sound & dialogue

**Status:** Draft  
**Parent:** [`../../SPEC.md`](../../SPEC.md)  
**Work packages:** WP-5 (audio / bubbles portion); can start after WP-0  
**Depends on:** [`app-infra.md`](./app-infra.md) WP-0 event hooks (or can stub a bus)  
**Does not own:** game rules, visual sprites (see [`assets.md`](./assets.md))

---

## Mission

Add juice and Berlin humor through short sound effects, light ambience, and 90s-RPG-style text bubbles. Gameplay must remain fully understandable with sound off — feedback is never audio-only.

---

## Principles

1. **Events in, content out.** Mechanics emit named events; this stream maps them to SFX + optional bubble lines.
2. **Mute-safe.** Icons/HUD/text already communicate the same state changes.
3. **Short and funny.** One-liners over cutscenes; punch up at bureaucracy / AI layoffs / Berlin absurdity.
4. **No VO required.** Bubbles are text; optional TTS is not MVP.
5. **Tiny footprint.** Prefer short `.ogg`/`.mp3`/`.wav` stingers; keep total download small.

---

## Sound design

### SFX map (MVP)

| Event ID | Intent | Notes |
| --- | --- | --- |
| `loose-bottle-collected` | Light pickup “ding” | Positive, short |
| `bin-bottles` | Slightly bigger reward | Distinct from loose bottle |
| `bin-burn` | Negative sting | Not scary; comic pain |
| `bottles-redeemed` | Cash / Pfand confirm | “doo-ding” machine feel |
| `food-bought` | Satisfied chomp / till beep | Clear success |
| `food-denied` | Soft fail | Insufficient funds |
| `day-failed` | Heart lost | Short, readable |
| `day-survived` | Soft relief | Optional |
| `won` | Small fanfare | Benefits approved |
| `lost` | Soft game-over | Not punishingly long |
| `ui-start` | Menu confirm | Optional |
| `step` | Footstep | Optional; easy to overdo — default off or very quiet |

### Ambience

| Track | Priority | Notes |
| --- | --- | --- |
| Soft city loop | Nice-to-have | Berlin street bed; duck under SFX |
| Day/night sting | Optional | 1–2 s transition whoosh |

### Implementation notes

- Central `audio` module: `play(eventId)`, master mute, SFX volume.
- Do not block the game loop on loading; lazy-load OK.
- Generation tools (e.g. ElevenLabs SFX) are allowed for drafts; commit final assets in-repo.
- Respect browser autoplay rules: unlock audio on first user gesture (Start).

---

## Dialogue / text bubbles

### Format

- Short bubble above player or near interactable (DOM or canvas).
- Auto-dismiss after ~1.5–2.5 s or on next action.
- No branching dialogue trees in MVP.

### Line buckets

Keep copy in config/JSON keyed by event + optional character:

```ts
type BubbleLine = {
  id: string;
  event: string;
  text: string;
  characterId?: string; // optional variant
  weight?: number;      // for random pick
};
```

### Seed lines (edit freely)

| Event | Example lines |
| --- | --- |
| `bin-burn` | “Ow. Cigarette. Classic.” / “Half a heart for science.” |
| `bin-bottles` | “Pfand gods smiled.” / “Liquid gold. Kind of.” |
| `food-bought` | “Calories acquired.” / “Döner diplomacy works.” |
| `food-denied` | “Wallet says nein.” / “Need more Flaschen.” |
| `day-failed` | “Agentur still buffering…” / “One heart closer to the ticket.” |
| `won` | “Benefits approved. Touch grass? Later.” |
| `lost` | “Run ended. Loop engineering wins again.” |
| Character intro | Use the three layoff jokes from `SPEC.md` |

Tone check: funny about the system and the tech satire — not mocking real homelessness.

---

## Contracts

| Other stream | Contract |
| --- | --- |
| Game mechanics | Stable event IDs (table above); payload may include `{ amount, characterId }` |
| App infra | Call `audio.unlock()` on Start; allow mute toggle in UI later |
| Assets | Optional bubble frame / font; this stream owns the strings |

---

## Acceptance

1. At least the high-priority SFX exist and fire on the matching events (or logged no-ops if assets pending).
2. Mute / missing audio never breaks mechanics.
3. Bubbles (or temporary toasts) show for burn, bottle gain, food denied, and end states.
4. Audio unlocks after first Start tap/click.
5. Copy lives in data files, not scattered string literals inside rule code.

---

## Out of scope

- Full voice acting
- Dynamic music systems / adaptive stems
- NPC conversation graphs
- Localization (can structure keys for later i18n)
- Microtransaction “skip wait” VO jokes as real monetization
