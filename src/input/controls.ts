import type { Direction } from "../game/types";
import { config } from "../config";

type Handlers = {
  onMove: (dir: Direction) => void;
  onAction: () => void;
};

export function bindInput(handlers: Handlers): () => void {
  const held = new Map<Direction, number>();
  let repeatAcc = new Map<Direction, number>();

  const keyToDir = (code: string): Direction | null => {
    switch (code) {
      case "ArrowUp":
      case "KeyW":
        return "up";
      case "ArrowDown":
      case "KeyS":
        return "down";
      case "ArrowLeft":
      case "KeyA":
        return "left";
      case "ArrowRight":
      case "KeyD":
        return "right";
      default:
        return null;
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      handlers.onAction();
      return;
    }
    const dir = keyToDir(e.code);
    if (!dir || e.repeat) return;
    e.preventDefault();
    held.set(dir, performance.now());
    repeatAcc.set(dir, 0);
    handlers.onMove(dir);
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const dir = keyToDir(e.code);
    if (!dir) return;
    held.delete(dir);
    repeatAcc.delete(dir);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const dpad = document.getElementById("dpad");
  const actionBtn = document.getElementById("action-btn");

  const touchDirs = new Map<number, Direction>();

  const pressDir = (dir: Direction, pointerId: number) => {
    touchDirs.set(pointerId, dir);
    held.set(dir, performance.now());
    repeatAcc.set(dir, 0);
    handlers.onMove(dir);
    dpad?.classList.add("pressed");
  };

  const releasePointer = (pointerId: number) => {
    const dir = touchDirs.get(pointerId);
    touchDirs.delete(pointerId);
    if (!dir) return;
    // Only release if no other pointer holds same dir
    const still = [...touchDirs.values()].includes(dir);
    if (!still) {
      held.delete(dir);
      repeatAcc.delete(dir);
    }
    if (touchDirs.size === 0) dpad?.classList.remove("pressed");
  };

  dpad?.querySelectorAll<HTMLButtonElement>("button[data-dir]").forEach((btn) => {
    const dir = btn.dataset.dir as Direction;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      pressDir(dir, e.pointerId);
    });
    btn.addEventListener("pointerup", (e) => releasePointer(e.pointerId));
    btn.addEventListener("pointercancel", (e) => releasePointer(e.pointerId));
  });

  actionBtn?.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    actionBtn.classList.add("pressed");
    handlers.onAction();
  });
  actionBtn?.addEventListener("pointerup", () => {
    actionBtn.classList.remove("pressed");
  });
  actionBtn?.addEventListener("pointercancel", () => {
    actionBtn.classList.remove("pressed");
  });

  let raf = 0;
  let last = performance.now();

  const loop = (now: number) => {
    const dt = now - last;
    last = now;
    for (const [dir, since] of held) {
      const heldFor = now - since;
      if (heldFor < config.movementInitialRepeatDelayMs) continue;
      const acc = (repeatAcc.get(dir) ?? 0) + dt;
      if (acc >= config.movementRepeatMs) {
        handlers.onMove(dir);
        repeatAcc.set(dir, acc - config.movementRepeatMs);
      } else {
        repeatAcc.set(dir, acc);
      }
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
}
