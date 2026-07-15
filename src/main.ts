import "./styles.css";

import { ACTIVE_MAP_URL, INITIAL_REPEAT_DELAY_MS, REPEAT_INTERVAL_MS } from "./game/config";
import { createGame, type GameController } from "./game/create-game";
import type { Direction } from "./game/grid/movement";
import { parseTiledMap } from "./game/map/tiled-contract";
import { renderHud, syncOverlay, type OverlayAction } from "./ui/hud";

const app = document.querySelector<HTMLElement>("#app");
if (app === null) {
  throw new Error("Missing #app root element");
}

app.innerHTML = `
  <div id="frame">
    <header id="hud">
      <div class="hud-grid">
        <div class="hud-cell hud-cell-day">
          <span class="hud-label">Day</span>
          <span id="hud-day">1 / 7</span>
        </div>
        <div class="hud-cell hud-cell-timer">
          <span class="hud-label">Time</span>
          <span id="hud-timer">—</span>
        </div>
        <div class="hud-cell hud-cell-hearts">
          <span class="hud-label">Hearts</span>
          <span id="hud-hearts">♥♥♥</span>
        </div>
        <div class="hud-cell hud-cell-bottles">
          <span class="hud-label">Bottles</span>
          <span id="hud-bottles">0</span>
        </div>
        <div class="hud-cell hud-cell-cash">
          <span class="hud-label">Cash</span>
          <span id="hud-cash">€0.00</span>
        </div>
        <div class="hud-cell hud-cell-meal">
          <span class="hud-label">Meal</span>
          <span id="hud-meal">kebap with Attitude €—</span>
        </div>
        <div class="hud-cell hud-cell-fed">
          <span class="hud-label">Status</span>
          <span id="hud-fed">Hungry</span>
        </div>
      </div>
      <div class="hud-meta">
        <span id="hud-phase">Ready</span>
        <span id="hud-need"></span>
      </div>
      <div id="hud-toast"></div>
      <div id="queue-bar" class="hidden" aria-hidden="true">
        <div id="queue-track"><div id="queue-fill"></div></div>
        <span id="queue-label"></span>
      </div>
    </header>
    <div id="playfield">
      <div id="dev-badge" class="hidden">DEV · timer frozen</div>
      <div id="game" aria-label="hobo.berlin grid"></div>
      <div id="stage" class="hidden" aria-live="polite">
        <div id="stage-veil"></div>
        <div id="stage-content">
          <div id="stage-asset" class="hidden" aria-hidden="true">
            <img id="stage-moon" alt="" width="128" height="128" decoding="async" />
            <img id="stage-sun" alt="" width="128" height="128" decoding="async" />
          </div>
          <span id="stage-text"></span>
        </div>
      </div>
      <div id="bottom-toast" class="hidden" aria-live="polite"></div>
      <button id="end-day-btn" class="hidden" type="button">End day</button>
      <div id="speech-bubble" class="hidden" aria-live="polite">
        <div class="speech-portrait" aria-hidden="true">
          <img id="speech-portrait-img" alt="" width="72" height="72" decoding="async" />
        </div>
        <div class="speech-copy">
          <div id="speech-name"></div>
          <div id="speech-text"></div>
        </div>
      </div>
      <output id="player-position" aria-live="polite" data-column="0" data-row="0">Player: 0,0</output>
      <div id="touch">
        <div id="dpad" aria-label="D-pad">
          <button type="button" data-dir="up">▲</button>
          <div class="mid">
            <button type="button" data-dir="left">◀</button>
            <button type="button" data-dir="right">▶</button>
          </div>
          <button type="button" data-dir="down">▼</button>
        </div>
        <button id="action-btn" type="button">ACT</button>
      </div>
    </div>
    <div id="overlay">
      <div id="overlay-card">
        <h1 id="overlay-title">hobo.berlin</h1>
        <div id="overlay-body"></div>
        <button id="overlay-btn" type="button">Start game</button>
      </div>
    </div>
  </div>
`;

const gameParentElement = document.querySelector<HTMLElement>("#game");
if (gameParentElement === null) {
  throw new Error("Unable to create game shell");
}
const gameParent = gameParentElement;

let controller: GameController | undefined;

function handleOverlay(action: OverlayAction): void {
  document.getElementById("overlay-btn")?.blur();
  if (!controller) return;
  if (action === "restart") controller.restart();
  if (action === "start-game") controller.beginGame();
  if (action === "start-day") controller.continueDay();
}

function bindTouch(): void {
  const endDayBtn = document.getElementById("end-day-btn");
  endDayBtn?.addEventListener("click", () => {
    controller?.endDayEarly();
  });

  const actionBtn = document.getElementById("action-btn");
  actionBtn?.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    controller?.performAction();
  });

  let held: Direction | null = null;
  let nextRepeatAt = 0;
  let holdRaf = 0;

  const stopHold = (): void => {
    held = null;
    cancelAnimationFrame(holdRaf);
    holdRaf = 0;
  };

  const tickHold = (now: number): void => {
    if (!held) return;
    if (now >= nextRepeatAt) {
      controller?.move(held);
      nextRepeatAt = now + REPEAT_INTERVAL_MS;
    }
    holdRaf = requestAnimationFrame(tickHold);
  };

  document.querySelectorAll<HTMLButtonElement>("#dpad button[data-dir]").forEach((btn) => {
    const dir = btn.dataset.dir as Direction;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      stopHold();
      held = dir;
      controller?.move(dir);
      nextRepeatAt = performance.now() + INITIAL_REPEAT_DELAY_MS;
      holdRaf = requestAnimationFrame(tickHold);
    });
    btn.addEventListener("pointerup", stopHold);
    btn.addEventListener("pointercancel", stopHold);
    btn.addEventListener("lostpointercapture", stopHold);
  });
}

async function bootstrap(): Promise<void> {
  try {
    const response = await fetch(ACTIVE_MAP_URL);
    if (!response.ok) {
      throw new Error(`Map request failed with status ${response.status}`);
    }
    const map = parseTiledMap(await response.json());
    controller = createGame(gameParent, map, (state) => {
      renderHud(state);
      syncOverlay(state, handleOverlay);
    });
    bindTouch();
  } catch (error) {
    controller?.destroy();
    controller = undefined;
    gameParent.replaceChildren();
    document.getElementById("player-position")?.remove();
    document.getElementById("overlay")?.classList.add("hidden");

    const alert = document.createElement("p");
    alert.setAttribute("role", "alert");
    alert.textContent = `Unable to start: ${error instanceof Error ? error.message : String(error)}`;
    gameParent.append(alert);
  }
}

void bootstrap();
