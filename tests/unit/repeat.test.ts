import { describe, expect, it } from "vitest";

import { ArrowRepeatController } from "../../src/game/input/repeat";

describe("ArrowRepeatController", () => {
  it.each([
    ["ArrowUp", "up"],
    ["ArrowDown", "down"],
    ["ArrowLeft", "left"],
    ["ArrowRight", "right"],
  ] as const)("emits %s immediately as %s", (code, direction) => {
    const controller = new ArrowRepeatController();

    expect(controller.keyDown(code, 0, false)).toBe(direction);
  });

  it("ignores non-arrow and browser-native repeat keydowns", () => {
    const controller = new ArrowRepeatController();

    expect(controller.keyDown("KeyW", 0, false)).toBeUndefined();
    expect(controller.keyDown("ArrowRight", 0, true)).toBeUndefined();
    expect(controller.update(1_000)).toBeUndefined();
  });

  it("repeats after 180 ms and then every 100 ms", () => {
    const controller = new ArrowRepeatController();

    controller.keyDown("ArrowDown", 0, false);

    expect(controller.update(179)).toBeUndefined();
    expect(controller.update(180)).toBe("down");
    expect(controller.update(279)).toBeUndefined();
    expect(controller.update(280)).toBe("down");
  });

  it("discards missed repeat ticks after a delayed update", () => {
    const controller = new ArrowRepeatController();

    controller.keyDown("ArrowRight", 0, false);

    expect(controller.update(350)).toBe("right");
    expect(controller.update(449)).toBeUndefined();
    expect(controller.update(450)).toBe("right");
  });

  it("emits at most once at the same timestamp", () => {
    const controller = new ArrowRepeatController();

    controller.keyDown("ArrowLeft", 0, false);

    expect(controller.update(180)).toBe("left");
    expect(controller.update(180)).toBeUndefined();
  });

  it("gives the most recently pressed held arrow priority", () => {
    const controller = new ArrowRepeatController();

    controller.keyDown("ArrowRight", 0, false);
    expect(controller.keyDown("ArrowDown", 20, false)).toBe("down");

    expect(controller.update(199)).toBeUndefined();
    expect(controller.update(200)).toBe("down");
  });

  it("falls back after a restarted initial delay when the active key is released", () => {
    const controller = new ArrowRepeatController();

    controller.keyDown("ArrowRight", 0, false);
    controller.keyDown("ArrowDown", 20, false);
    controller.keyUp("ArrowDown", 100);

    expect(controller.update(279)).toBeUndefined();
    expect(controller.update(280)).toBe("right");
  });

  it("stops repetition after the final arrow is released", () => {
    const controller = new ArrowRepeatController();

    controller.keyDown("ArrowUp", 0, false);
    controller.keyUp("ArrowUp", 50);

    expect(controller.update(500)).toBeUndefined();
  });

  it("ignores duplicate held-key keydowns", () => {
    const controller = new ArrowRepeatController();

    expect(controller.keyDown("ArrowRight", 0, false)).toBe("right");
    expect(controller.keyDown("ArrowRight", 50, false)).toBeUndefined();
    expect(controller.update(179)).toBeUndefined();
    expect(controller.update(180)).toBe("right");
  });
});
