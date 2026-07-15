import {
  DAYS_PER_RUN,
  MINIMUM_BOTTLES_TO_REDEEM,
} from "../game/config";
import {
  characterBlurb,
  characterName,
  formatCash,
  formatHearts,
  phaseLabel,
} from "../game/mechanics/run";
import type { GameState } from "../game/mechanics/types";

export type OverlayAction = "start-game" | "start-day" | "restart";

const els = {
  day: () => document.getElementById("hud-day"),
  phase: () => document.getElementById("hud-phase"),
  timer: () => document.getElementById("hud-timer"),
  hearts: () => document.getElementById("hud-hearts"),
  bottles: () => document.getElementById("hud-bottles"),
  cash: () => document.getElementById("hud-cash"),
  meal: () => document.getElementById("hud-meal"),
  fed: () => document.getElementById("hud-fed"),
  toast: () => document.getElementById("hud-toast"),
  pos: () => document.querySelector<HTMLOutputElement>("#player-position"),
  overlay: () => document.getElementById("overlay"),
  overlayTitle: () => document.getElementById("overlay-title"),
  overlayBody: () => document.getElementById("overlay-body"),
  overlayBtn: () =>
    document.getElementById("overlay-btn") as HTMLButtonElement | null,
};

function setText(el: HTMLElement | null, value: string): void {
  if (el) el.textContent = value;
}

export function renderHud(state: GameState): void {
  const seconds = Math.max(0, Math.ceil(state.timeRemainingMs / 1000));
  const timerText =
    state.phase === "playing"
      ? state.venue.kind !== "none"
        ? `${seconds}s · queue ${Math.ceil(state.venue.remainingMs / 1000)}s`
        : `${seconds}s`
      : state.phase === "countdown"
        ? state.toast || "…"
        : "—";

  setText(els.day(), `Day ${state.day} / ${DAYS_PER_RUN}`);
  setText(els.phase(), phaseLabel(state));
  setText(els.timer(), timerText);
  setText(els.hearts(), formatHearts(state.player.healthUnits));
  setText(els.bottles(), `🍾 ${state.player.bottles}`);
  setText(els.cash(), formatCash(state.player.cashCents));
  setText(els.meal(), `Döner ${formatCash(state.mealPriceCents)}`);
  setText(els.fed(), state.fedToday ? "Fed" : "Hungry");
  setText(els.toast(), state.toast);

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
        <li>Survive seven days until Agentur für Arbeit pays.</li>
        <li>Each day ≈ one minute. Eat or lose a heart.</li>
        <li>Move with arrows / WASD. ACT / Space to interact.</li>
        <li>Walk onto bottles. Search mystery bins beside them.</li>
        <li>Redeem ≥${MINIMUM_BOTTLES_TO_REDEEM} at REWE, buy Döner, beat the clock.</li>
      </ol>
    `;
    btn.textContent = "Start game";
    btn.onclick = () => onAction("start-game");
    return;
  }

  if (state.phase === "day-ready") {
    show(true);
    title.textContent = `Day ${state.day}`;
    body.innerHTML = `<p>Today’s Döner is <strong>${formatCash(state.mealPriceCents)}</strong>.</p>`;
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
    btn.textContent = `Continue`;
    btn.onclick = () => onAction("start-day");
    return;
  }

  if (state.phase === "won") {
    show(true);
    title.textContent = "Benefits approved";
    body.innerHTML = `<p>Seven days on Pfand and Döner. Touch grass? Later.</p>`;
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
