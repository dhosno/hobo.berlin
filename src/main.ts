import Phaser from "phaser";
import { config } from "./config";
import {
  advancePrePlayPhase,
  beginDaySequence,
  continueToNextDay,
  createInitialState,
  findPath,
  focusOrActOnItem,
  restartRun,
  tickCountdown,
  tickPlaying,
  tryAction,
  tryMove,
  tryStepTo,
} from "./game/mechanics";
import type { Direction, GameState, GridPos } from "./game/types";
import { bindInput } from "./input/controls";
import { MainScene } from "./render/MainScene";
import { renderHud, syncOverlay, type OverlayAction } from "./ui/hud";

let state: GameState = createInitialState();
let scene: MainScene | null = null;
let transitionTimer: number | null = null;
let countdownLeft = config.countdownSeconds;
let walkPath: GridPos[] = [];
let walkTimer: number | null = null;

function apply(next: GameState): void {
  const moved =
    next.player.position.x !== state.player.position.x ||
    next.player.position.y !== state.player.position.y;
  const worldDirty =
    next.world.items !== state.world.items ||
    moved ||
    next.focusedItemId !== state.focusedItemId ||
    next.phase !== state.phase;

  const phaseChanged = next.phase !== state.phase;
  state = next;

  if (worldDirty) scene?.syncState(state);
  else scene?.syncLight(state);

  renderHud(state);
  syncOverlay(state, handleOverlay);
  if (phaseChanged) manageTransitions();
}

function clearWalk(): void {
  walkPath = [];
  if (walkTimer !== null) {
    window.clearTimeout(walkTimer);
    walkTimer = null;
  }
}

function handleOverlay(action: OverlayAction): void {
  document.getElementById("overlay-btn")?.blur();

  if (action === "restart") {
    clearTransition();
    clearWalk();
    apply(restartRun());
    return;
  }

  if (action === "start-game") {
    if (state.phase !== "instructions") return;
    clearTransition();
    clearWalk();
    countdownLeft = config.countdownSeconds;
    apply(beginDaySequence(state));
    manageTransitions();
    return;
  }

  if (action === "start-day") {
    if (state.phase === "day-resolution") {
      apply(continueToNextDay(state));
      return;
    }
    if (state.phase === "day-ready") {
      clearTransition();
      clearWalk();
      countdownLeft = config.countdownSeconds;
      apply(beginDaySequence(state));
      manageTransitions();
    }
  }
}

function clearTransition(): void {
  if (transitionTimer !== null) {
    window.clearTimeout(transitionTimer);
    transitionTimer = null;
  }
}

function manageTransitions(): void {
  clearTransition();

  if (state.phase === "night") {
    transitionTimer = window.setTimeout(() => {
      apply(advancePrePlayPhase(state));
      manageTransitions();
    }, config.preDayNightMs);
    return;
  }

  if (state.phase === "dawn") {
    transitionTimer = window.setTimeout(() => {
      apply(advancePrePlayPhase(state));
      manageTransitions();
    }, config.preDayDawnMs);
    return;
  }

  if (state.phase === "countdown") {
    transitionTimer = window.setTimeout(() => {
      countdownLeft -= 1;
      if (countdownLeft > 0) {
        apply(tickCountdown(state, countdownLeft));
        manageTransitions();
      } else {
        apply(tickCountdown(state, 0));
      }
    }, 1000);
  }
}

function onMove(dir: Direction): void {
  clearWalk();
  apply(tryMove(state, dir));
}

function onAction(): void {
  clearWalk();
  apply(tryAction(state));
}

function onItemTap(itemId: string): void {
  clearWalk();
  apply(focusOrActOnItem(state, itemId));
}

function pumpWalk(): void {
  walkTimer = null;
  if (state.phase !== "playing" || walkPath.length === 0) {
    clearWalk();
    return;
  }
  const next = walkPath.shift()!;
  const before = state.player.position;
  apply(tryStepTo(state, next));
  if (
    state.player.position.x === before.x &&
    state.player.position.y === before.y
  ) {
    clearWalk();
    return;
  }
  if (walkPath.length > 0) {
    walkTimer = window.setTimeout(pumpWalk, config.movementRepeatMs);
  }
}

function onCellTap(pos: GridPos): void {
  if (state.phase !== "playing") {
    apply({ ...state, toast: "Press Start first" });
    return;
  }
  clearWalk();
  const path = findPath(state, pos);
  if (path.length === 0) {
    apply({ ...state, toast: "Can't walk there" });
    return;
  }
  walkPath = path;
  pumpWalk();
}

function measureFrame(): { width: number; height: number } {
  const root = document.getElementById("game-root");
  return {
    width: Math.max(320, root?.clientWidth ?? 360),
    height: Math.max(480, root?.clientHeight ?? 640),
  };
}

function fitCamera(): void {
  if (!scene) return;
  const { width: viewW, height: viewH } = measureFrame();
  const worldW = config.gridColumns * config.cellSize;
  const worldH = config.gridRows * config.cellSize;
  const zoom = Math.min(viewW / worldW, viewH / worldH) * 0.98;
  scene.cameras.main.setZoom(Math.min(Math.max(zoom, 0.35), 2.5));
  scene.cameras.main.stopFollow();
  scene.cameras.main.centerOn(worldW / 2, worldH / 2);
}

const size = measureFrame();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  backgroundColor: "#2a3326",
  width: size.width,
  height: size.height,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
  input: {
    keyboard: false,
    mouse: true,
    touch: true,
  },
  callbacks: {
    postBoot: () => {
      game.scene.add("main", MainScene, true, {
        state,
        onItemTap,
        onCellTap,
      });
      scene = game.scene.getScene("main") as MainScene;
      renderHud(state);
      syncOverlay(state, handleOverlay);
      requestAnimationFrame(() => fitCamera());
    },
  },
});

bindInput({ onMove, onAction });

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(50, now - last);
  last = now;
  if (state.phase === "playing") {
    const prev = state;
    const next = tickPlaying(state, dt);
    if (next.phase !== prev.phase || next.world.items !== prev.world.items) {
      apply(next);
    } else {
      state = next;
      renderHud(state);
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.addEventListener("resize", fitCamera);
