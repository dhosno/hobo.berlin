import {
  DAYS_PER_RUN,
  MEAL_VENDOR_NAME,
  MINIMUM_BOTTLES_TO_REDEEM,
} from "../game/config";
import { DEV_FREEZE_TIMER, prefersReducedMotion } from "../game/env";
import {
  bottlesNeededForMeal,
  characterBlurb,
  characterName,
  formatCash,
  formatHearts,
  phaseLabel,
} from "../game/mechanics/run";
import type { GameState } from "../game/mechanics/types";

export type OverlayAction = "start-game" | "start-day" | "restart";

const PICKUP_EVENTS = new Set([
  "bottle-collected",
  "bottles-depositing",
  "cash-received",
  "food-bought",
]);

const els = {
  day: () => document.getElementById("hud-day"),
  phase: () => document.getElementById("hud-phase"),
  timer: () => document.getElementById("hud-timer"),
  hearts: () => document.getElementById("hud-hearts"),
  bottles: () => document.getElementById("hud-bottles"),
  cash: () => document.getElementById("hud-cash"),
  meal: () => document.getElementById("hud-meal"),
  need: () => document.getElementById("hud-need"),
  fed: () => document.getElementById("hud-fed"),
  toast: () => document.getElementById("hud-toast"),
  bottomToast: () => document.getElementById("bottom-toast"),
  queue: () => document.getElementById("queue-bar"),
  queueFill: () => document.getElementById("queue-fill"),
  queueLabel: () => document.getElementById("queue-label"),
  stage: () => document.getElementById("stage"),
  stageAsset: () => document.getElementById("stage-asset"),
  stageMoon: () => document.getElementById("stage-moon") as HTMLImageElement | null,
  stageSun: () => document.getElementById("stage-sun") as HTMLImageElement | null,
  stageText: () => document.getElementById("stage-text"),
  devBadge: () => document.getElementById("dev-badge"),
  pos: () => document.querySelector<HTMLOutputElement>("#player-position"),
  overlay: () => document.getElementById("overlay"),
  overlayTitle: () => document.getElementById("overlay-title"),
  overlayBody: () => document.getElementById("overlay-body"),
  overlayBtn: () =>
    document.getElementById("overlay-btn") as HTMLButtonElement | null,
};

const MOON_SRC = new URL("../assets/ui/moon-placeholder.svg", import.meta.url).href;
const SUN_SRC = new URL("../assets/ui/sun-placeholder.svg", import.meta.url).href;

let stageAssetsReady = false;

function ensureStageAssets(): void {
  if (stageAssetsReady) return;
  const moon = els.stageMoon();
  const sun = els.stageSun();
  if (moon) moon.src = MOON_SRC;
  if (sun) sun.src = SUN_SRC;
  stageAssetsReady = true;
}

/** Last state totals we started animating toward (not mid-tween display). */
let syncedBottles = -1;
let syncedCash = -1;
let displayBottles = 0;
let displayCash = 0;
let animFrame = 0;
let lastPickupKey = "";
let bottomToastTimer = 0;

function setText(el: HTMLElement | null, value: string): void {
  if (el) el.textContent = value;
}

function paintCounters(): void {
  setText(els.bottles(), `🍾 ${displayBottles}`);
  setText(els.cash(), formatCash(displayCash));
}

function animateCounters(targetBottles: number, targetCash: number): void {
  if (prefersReducedMotion()) {
    displayBottles = targetBottles;
    displayCash = targetCash;
    paintCounters();
    return;
  }

  cancelAnimationFrame(animFrame);
  const startB = displayBottles;
  const startC = displayCash;
  const start = performance.now();
  const duration = 420;

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const ease = 1 - (1 - t) * (1 - t);
    displayBottles = Math.round(startB + (targetBottles - startB) * ease);
    displayCash = Math.round(startC + (targetCash - startC) * ease);
    paintCounters();
    if (t < 1) animFrame = requestAnimationFrame(step);
    else {
      displayBottles = targetBottles;
      displayCash = targetCash;
      paintCounters();
    }
  };
  animFrame = requestAnimationFrame(step);
}

function syncCounters(state: GameState): void {
  const targetBottles = state.player.bottles;
  const targetCash = state.player.cashCents;
  if (targetBottles === syncedBottles && targetCash === syncedCash) {
    return;
  }
  syncedBottles = targetBottles;
  syncedCash = targetCash;
  animateCounters(targetBottles, targetCash);
}

function showBottomToast(message: string, key: string): void {
  const el = els.bottomToast();
  if (!el || !message) return;
  if (key === lastPickupKey) return;
  lastPickupKey = key;
  el.textContent = message;
  el.classList.remove("hidden", "fade");
  window.clearTimeout(bottomToastTimer);
  bottomToastTimer = window.setTimeout(() => {
    el.classList.add("fade");
    bottomToastTimer = window.setTimeout(() => {
      el.classList.add("hidden");
      el.classList.remove("fade");
    }, 280);
  }, 1600);
}

function latestPickupToast(state: GameState): string | null {
  if (!state.toast) return null;
  const last = state.lastEvents.at(-1);
  if (!last || !PICKUP_EVENTS.has(last)) return null;
  return state.toast;
}

function renderStage(state: GameState): void {
  ensureStageAssets();
  const stage = els.stage();
  const asset = els.stageAsset();
  const moon = els.stageMoon();
  const sun = els.stageSun();
  const text = els.stageText();
  if (!stage || !text) return;

  const reduced = prefersReducedMotion();
  const show =
    state.phase === "night" ||
    state.phase === "dawn" ||
    state.phase === "countdown";

  const prevPhase = stage.dataset.phase;
  stage.classList.toggle("hidden", !show);
  stage.classList.toggle("reduced", reduced);
  stage.dataset.phase = state.phase;

  if (show && prevPhase !== state.phase) {
    stage.classList.remove("stage-enter");
    // Force reflow so the enter animation restarts per phase.
    void stage.offsetWidth;
    stage.classList.add("stage-enter");
  }
  if (!show) stage.classList.remove("stage-enter");

  if (asset && moon && sun) {
    const showCelestial =
      state.phase === "night" || state.phase === "dawn";
    asset.classList.toggle("hidden", !showCelestial);
    moon.classList.toggle("hidden", state.phase !== "night");
    sun.classList.toggle("hidden", state.phase !== "dawn");
  }

  if (state.phase === "night") {
    text.textContent = reduced ? "Night" : "Night falls…";
    text.classList.remove("countdown");
  } else if (state.phase === "dawn") {
    text.textContent = reduced ? "Dawn" : "Dawn over Berlin";
    text.classList.remove("countdown");
  } else if (state.phase === "countdown") {
    text.textContent = state.toast || "3";
    text.classList.add("countdown");
  } else {
    text.classList.remove("countdown");
  }
}

export function renderHud(state: GameState): void {
  const seconds = Math.max(0, Math.ceil(state.timeRemainingMs / 1000));
  const timerText =
    state.phase === "playing"
      ? DEV_FREEZE_TIMER
        ? `DEV ∞ · ${seconds}s`
        : `${seconds}s`
      : state.phase === "countdown"
        ? state.toast || "…"
        : "—";

  setText(els.day(), `Day ${state.day} / ${DAYS_PER_RUN}`);
  setText(els.phase(), phaseLabel(state));
  setText(els.timer(), timerText);
  setText(els.hearts(), formatHearts(state.player.healthUnits));
  setText(els.meal(), `${MEAL_VENDOR_NAME} ${formatCash(state.mealPriceCents)}`);
  setText(els.fed(), state.fedToday ? "Fed" : "Hungry");

  const pickup = latestPickupToast(state);
  const topToast =
    pickup && state.toast === pickup
      ? ""
      : state.phase === "countdown"
        ? ""
        : state.toast;
  setText(els.toast(), topToast);

  if (pickup) {
    const key = `${state.lastEvents.join("|")}|${pickup}`;
    showBottomToast(pickup, key);
  }

  const need = bottlesNeededForMeal(state);
  setText(
    els.need(),
    need === 0 ? "Meal covered" : `Need ~${need} more bottles`,
  );

  syncCounters(state);

  const queue = els.queue();
  const fill = els.queueFill();
  const qLabel = els.queueLabel();
  if (queue && fill && qLabel) {
    if (state.venue.kind !== "none" && state.venue.totalMs > 0) {
      queue.classList.remove("hidden");
      const pct =
        ((state.venue.totalMs - state.venue.remainingMs) / state.venue.totalMs) *
        100;
      fill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
      qLabel.textContent =
        state.venue.kind === "rewe-wait"
          ? `REWE queue · ${Math.ceil(state.venue.remainingMs / 1000)}s`
          : `${MEAL_VENDOR_NAME} · ${Math.ceil(state.venue.remainingMs / 1000)}s`;
    } else {
      queue.classList.add("hidden");
      fill.style.width = "0%";
    }
  }

  const badge = els.devBadge();
  if (badge) {
    badge.classList.toggle("hidden", !DEV_FREEZE_TIMER);
    badge.textContent = "DEV · timer frozen";
  }

  renderStage(state);

  const pos = els.pos();
  if (pos) {
    pos.dataset.column = String(state.player.position.column);
    pos.dataset.row = String(state.player.position.row);
    pos.textContent = `Player: ${state.player.position.column},${state.player.position.row}`;
  }
}

export function syncOverlay(
  state: GameState,
  onAction: (action: OverlayAction) => void,
): void {
  const overlay = els.overlay();
  const title = els.overlayTitle();
  const body = els.overlayBody();
  const btn = els.overlayBtn();
  if (!overlay || !title || !body || !btn) return;

  const show = (visible: boolean) => {
    overlay.classList.toggle("hidden", !visible);
  };

  if (state.phase === "instructions") {
    show(true);
    title.textContent = "hobo.berlin";
    body.innerHTML = `
      <p><strong>${characterName(state.player.characterId)}</strong> — ${characterBlurb(state.player.characterId)}</p>
      <ol>
        <li>Survive seven days until the Agentur für Arbeit approves your money.</li>
        <li>Each day gives you about one minute.</li>
        <li>Move one grid square at a time with the D-pad, arrow keys, or WASD.</li>
        <li>Search garbage bins for returnable bottles.</li>
        <li>A bin contains bottles or a burn hazard; the result is hidden.</li>
        <li>A burn costs half a heart.</li>
        <li>Collect enough bottles and redeem them at REWE for cash (≥${MINIMUM_BOTTLES_TO_REDEEM}).</li>
        <li>REWE queues take time while the day timer keeps running.</li>
        <li>Spend the cash at ${MEAL_VENDOR_NAME} and wait for the food.</li>
        <li>Eat before time runs out or lose one heart.</li>
      </ol>
    `;
    btn.textContent = "Start game";
    btn.onclick = () => onAction("start-game");
    return;
  }

  if (state.phase === "day-ready") {
    show(true);
    title.textContent = `Day ${state.day}`;
    body.innerHTML = `<p>Today’s ${MEAL_VENDOR_NAME} is <strong>${formatCash(state.mealPriceCents)}</strong>. Eat before the timer ends.</p>`;
    btn.textContent = `Start day ${state.day}`;
    btn.onclick = () => onAction("start-day");
    return;
  }

  if (state.phase === "day-resolution") {
    show(true);
    title.textContent = state.fedToday ? "Day survived" : "Hungry night";
    body.innerHTML = `
      <p>${state.fedToday ? "You ate. Hearts stay." : "No food — lost a heart."}</p>
      <p>${formatCash(state.player.cashCents)} · ${state.player.bottles} bottles · ${formatHearts(state.player.healthUnits)}</p>
    `;
    btn.textContent = "Continue";
    btn.onclick = () => onAction("start-day");
    return;
  }

  if (state.phase === "won") {
    show(true);
    title.textContent = "Benefits approved";
    body.innerHTML = `<p>Seven days on Pfand and ${MEAL_VENDOR_NAME}. Touch grass? Later.</p>`;
    btn.textContent = "Play again";
    btn.onclick = () => onAction("restart");
    return;
  }

  if (state.phase === "lost") {
    show(true);
    title.textContent = "Run over";
    body.innerHTML = `<p>Zero hearts. Loop engineering wins again.</p>`;
    btn.textContent = "Restart";
    btn.onclick = () => onAction("restart");
    return;
  }

  show(false);
}
