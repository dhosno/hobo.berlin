import { expect, test, type Page } from "@playwright/test";

interface Position {
  column: number;
  row: number;
}

async function readPosition(page: Page): Promise<Position> {
  const output = page.locator("#player-position");
  return {
    column: Number(await output.getAttribute("data-column")),
    row: Number(await output.getAttribute("data-row")),
  };
}

async function pressMany(page: Page, key: string, count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await page.keyboard.press(key);
  }
}

async function openGame(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator("#game canvas")).toBeVisible();
  await page.locator("#overlay-btn").click();
  await expect(page.locator("#hud-phase")).toHaveText("Playing", { timeout: 8_000 });
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

test("renders the canvas, HUD hearts, and spawn status", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#game canvas")).toHaveCount(1);
  await expect(page.locator("#hud-hearts")).toContainText("♥");
  await expect(page.locator("#player-position")).toHaveText("Player: 4,13");
  await expect.poll(() => readPosition(page)).toEqual({ column: 4, row: 13 });
});

for (const viewport of [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
]) {
  test(`fits the portrait canvas at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator("#game canvas")).toBeVisible();

    const frame = page.locator("#frame");
    const box = await frame.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box!.width / box!.height - 18 / 28)).toBeLessThanOrEqual(0.03);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);

    const overflow = await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    }));
    expect(overflow).toEqual({ horizontal: 0, vertical: 0 });
  });
}

test("ArrowRight moves one cell exactly once after start", async ({ page }) => {
  await openGame(page);
  await page.keyboard.press("ArrowRight");

  await expect.poll(() => readPosition(page)).toEqual({ column: 3, row: 25 });
  await page.waitForTimeout(120);
  expect(await readPosition(page)).toEqual({ column: 3, row: 25 });
});

test("holding ArrowDown repeats after the initial delay", async ({ page }) => {
  await openGame(page);
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(340);
  await page.keyboard.up("ArrowDown");

  const position = await readPosition(page);
  expect(position.column).toBe(2);
  expect(position.row).toBeGreaterThanOrEqual(26);
});

test("the most recently held arrow wins without diagonal movement", async ({ page }) => {
  await openGame(page);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(20);
  await page.keyboard.down("ArrowUp");
  const afterImmediateMoves = await readPosition(page);

  await page.waitForTimeout(240);
  await page.keyboard.up("ArrowUp");
  await page.keyboard.up("ArrowRight");
  const afterRepeat = await readPosition(page);

  expect(afterImmediateMoves).toEqual({ column: 3, row: 24 });
  expect(afterRepeat.column).toBe(afterImmediateMoves.column);
  expect(afterRepeat.row).toBeLessThan(afterImmediateMoves.row);
});

test("repeated ArrowLeft and ArrowUp stop at the top-left map edge", async ({ page }) => {
  await openGame(page);
  await pressMany(page, "ArrowLeft", 10);
  await pressMany(page, "ArrowUp", 40);

  await expect.poll(() => readPosition(page)).toEqual({ column: 0, row: 0 });
});

test("three ArrowRight presses stop before the blocker", async ({ page }) => {
  await openGame(page);
  await pressMany(page, "ArrowRight", 3);

  await expect.poll(() => readPosition(page)).toEqual({ column: 4, row: 25 });
});

test("an invalid map shows a readable failure and does not start gameplay", async ({ page }) => {
  await page.route("**/phase-1.json", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        orientation: "orthogonal",
        infinite: false,
        width: 18,
        height: 28,
        tilewidth: 28,
        tileheight: 28,
        layers: [
          { name: "Collision", type: "objectgroup", visible: true, objects: [] },
        ],
      }),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("alert")).toContainText("Spawn");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator("#player-position")).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#player-position")).toHaveCount(0);
});
