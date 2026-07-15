import type { Direction } from "../grid/movement";
import {
  INITIAL_REPEAT_DELAY_MS,
  REPEAT_INTERVAL_MS,
} from "../config";

const ARROW_DIRECTIONS: Readonly<Record<string, Direction>> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export class ArrowRepeatController {
  private readonly heldCodes: string[] = [];
  private nextRepeatAt: number | undefined;

  keyDown(code: string, nowMs: number, nativeRepeat: boolean): Direction | undefined {
    const direction = ARROW_DIRECTIONS[code];
    if (direction === undefined || nativeRepeat || this.heldCodes.includes(code)) {
      return undefined;
    }

    this.heldCodes.push(code);
    this.nextRepeatAt = nowMs + INITIAL_REPEAT_DELAY_MS;
    return direction;
  }

  keyUp(code: string, nowMs: number): void {
    const index = this.heldCodes.indexOf(code);
    if (index === -1) {
      return;
    }

    const wasActive = index === this.heldCodes.length - 1;
    this.heldCodes.splice(index, 1);
    if (wasActive) {
      this.nextRepeatAt = this.heldCodes.length > 0
        ? nowMs + INITIAL_REPEAT_DELAY_MS
        : undefined;
    }
  }

  update(nowMs: number): Direction | undefined {
    const activeCode = this.heldCodes.at(-1);
    if (
      activeCode === undefined ||
      this.nextRepeatAt === undefined ||
      nowMs < this.nextRepeatAt
    ) {
      return undefined;
    }

    this.nextRepeatAt = nowMs + REPEAT_INTERVAL_MS;
    return ARROW_DIRECTIONS[activeCode];
  }
}
