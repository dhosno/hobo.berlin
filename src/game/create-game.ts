import Phaser from "phaser";

import { playEventDelta, unlockAudio } from "./audio";
import {
  ACTION_DEBOUNCE_MS,
  COUNTDOWN_SECONDS,
  DAY_DURATION_MS,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  PRE_DAY_DAWN_MS,
  PRE_DAY_NIGHT_MS,
} from "./config";
import { DEV_FREEZE_TIMER, DEV_SKIP_INTRO, prefersReducedMotion } from "./env";
import type { Direction } from "./grid/movement";
import type { ParsedMapContract } from "./map/tiled-contract";
import {
  advancePrePlayPhase,
  beginDaySequence,
  continueToNextDay,
  createInitialState,
  focusOrActOnItem,
  restartRun,
  tickCountdown,
  tickPlaying,
  tryAction,
  tryMove,
} from "./mechanics/run";
import type { GameState } from "./mechanics/types";
import { MapScene } from "./scenes/map-scene";

export type GameController = {
  getState: () => GameState;
  beginGame: () => void;
  continueDay: () => void;
  restart: () => void;
  performAction: () => void;
  move: (direction: Direction) => void;
  destroy: () => void;
};

function transitionMs(base: number): number {
  return prefersReducedMotion() ? Math.min(base, 120) : base;
}

export function createGame(
  parent: HTMLElement,
  map: ParsedMapContract,
  onState: (state: GameState) => void,
): GameController {
  let state = createInitialState(map);
  let scene: MapScene | null = null;
  let transitionTimer: number | null = null;
  let countdownLeft = COUNTDOWN_SECONDS;
  let raf = 0;
  let last = performance.now();
  let lastActionAt = 0;
  let lastEvents: string[] = [...state.lastEvents];

  const clearTransition = (): void => {
    if (transitionTimer !== null) {
      window.clearTimeout(transitionTimer);
      transitionTimer = null;
    }
  };

  const jumpToPlaying = (from: GameState): GameState => ({
    ...from,
    phase: "playing",
    timeRemainingMs: DAY_DURATION_MS,
    toast: DEV_FREEZE_TIMER ? "DEV · timer frozen" : "Go!",
  });

  const manageTransitions = (): void => {
    clearTransition();
    if (state.phase === "night") {
      transitionTimer = window.setTimeout(() => {
        apply(advancePrePlayPhase(state));
        manageTransitions();
      }, transitionMs(PRE_DAY_NIGHT_MS));
      return;
    }
    if (state.phase === "dawn") {
      transitionTimer = window.setTimeout(() => {
        apply(advancePrePlayPhase(state));
        manageTransitions();
      }, transitionMs(PRE_DAY_DAWN_MS));
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
      }, prefersReducedMotion() ? 350 : 1000);
    }
  };

  const apply = (next: GameState): void => {
    const worldDirty =
      next.world.items !== state.world.items ||
      next.player.position.column !== state.player.position.column ||
      next.player.position.row !== state.player.position.row ||
      next.focusedItemId !== state.focusedItemId ||
      next.phase !== state.phase;
    const phaseChanged = next.phase !== state.phase;
    playEventDelta(lastEvents, next.lastEvents);
    lastEvents = [...next.lastEvents];
    state = next;
    if (worldDirty) scene?.syncState(state);
    else scene?.syncLight(state);
    onState(state);
    if (phaseChanged) manageTransitions();
  };

  const onMove = (direction: Direction): void => {
    apply(tryMove(state, direction));
  };
  const onAction = (): void => {
    const now = performance.now();
    if (now - lastActionAt < ACTION_DEBOUNCE_MS) return;
    lastActionAt = now;
    apply(tryAction(state));
  };
  const onItemTap = (itemId: string): void => {
    const now = performance.now();
    if (now - lastActionAt < ACTION_DEBOUNCE_MS) return;
    lastActionAt = now;
    apply(focusOrActOnItem(state, itemId));
  };

  const startDayFlow = (): void => {
    countdownLeft = COUNTDOWN_SECONDS;
    if (DEV_SKIP_INTRO) {
      apply(jumpToPlaying(beginDaySequence(state)));
      return;
    }
    apply(beginDaySequence(state));
    manageTransitions();
  };

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    backgroundColor: "#1a2118",
    antialias: false,
    scale: {
      parent,
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: DESIGN_WIDTH,
      height: DESIGN_HEIGHT,
    },
    scene: [],
    callbacks: {
      postBoot: () => {
        game.scene.add("MapScene", MapScene, true, {
          state,
          handlers: { onMove, onAction, onItemTap },
        });
        scene = game.scene.getScene("MapScene") as MapScene;
        onState(state);
      },
    },
  });

  const frame = (now: number): void => {
    const dt = Math.min(50, now - last);
    last = now;
    if (state.phase === "playing") {
      const prev = state;
      const next = tickPlaying(state, dt, {
        freezeDayTimer: DEV_FREEZE_TIMER,
      });
      if (
        next.phase !== prev.phase ||
        next.world.items !== prev.world.items ||
        next.player.bottles !== prev.player.bottles ||
        next.player.cashCents !== prev.player.cashCents ||
        next.player.healthUnits !== prev.player.healthUnits ||
        next.fedToday !== prev.fedToday ||
        next.venue.kind !== prev.venue.kind ||
        next.venue.remainingMs !== prev.venue.remainingMs ||
        Math.floor(next.timeRemainingMs / 250) !==
          Math.floor(prev.timeRemainingMs / 250)
      ) {
        apply(next);
      } else {
        state = next;
        onState(state);
      }
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    getState: () => state,
    beginGame: () => {
      if (state.phase !== "instructions") return;
      void unlockAudio();
      startDayFlow();
    },
    continueDay: () => {
      if (state.phase === "day-resolution") {
        apply(continueToNextDay(state));
        return;
      }
      if (state.phase === "day-ready") {
        void unlockAudio();
        startDayFlow();
      }
    },
    restart: () => {
      clearTransition();
      countdownLeft = COUNTDOWN_SECONDS;
      lastEvents = [];
      apply(restartRun(map));
    },
    performAction: onAction,
    move: onMove,
    destroy: () => {
      cancelAnimationFrame(raf);
      clearTransition();
      game.destroy(true);
    },
  };
}
