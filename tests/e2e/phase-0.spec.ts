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
    await page.waitForTimeout(20);
  }
}

async function openGame(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator("#game canvas")).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

test("renders the Stage B canvas and spawn status", async ({ page }) => {
  await openGame(page);

  await expect(page.locator("#game canvas")).toHaveCount(1);
  await expect(page.locator("#game")).toHaveAttribute(
    "data-presentation",
    "berlin-placeholders",
  );
  await expect(page.locator("#player-position")).toHaveText("Player: 2,2");
  await expect.poll(() => readPosition(page)).toEqual({ column: 2, row: 2 });
});

for (const viewport of [
  { width: 360, height: 640 },
  { width: 768, height: 512 },
  { width: 1440, height: 900 },
]) {
  test(`fits the complete canvas at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openGame(page);

    const canvas = page.locator("#game canvas");
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box!.width / box!.height - 1.5)).toBeLessThanOrEqual(0.01);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 0.01);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 0.01);
    await expect(canvas).toHaveCSS("image-rendering", "pixelated");

    const overflow = await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    }));
    expect(overflow).toEqual({ horizontal: 0, vertical: 0 });
  });
}

test("ArrowRight moves one cell exactly once", async ({ page }) => {
  await openGame(page);
  await page.keyboard.press("ArrowRight");

  await expect.poll(() => readPosition(page)).toEqual({ column: 3, row: 2 });
  await page.waitForTimeout(120);
  expect(await readPosition(page)).toEqual({ column: 3, row: 2 });
});

test("holding ArrowDown repeats after the initial delay", async ({ page }) => {
  await openGame(page);
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(340);
  await page.keyboard.up("ArrowDown");

  const position = await readPosition(page);
  expect(position.column).toBe(2);
  expect(position.row).toBeGreaterThanOrEqual(4);
});

test("the most recently held arrow wins without diagonal movement", async ({ page }) => {
  await openGame(page);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(20);
  await page.keyboard.down("ArrowDown");
  const afterImmediateMoves = await readPosition(page);

  await page.waitForTimeout(240);
  await page.keyboard.up("ArrowDown");
  await page.keyboard.up("ArrowRight");
  const afterRepeat = await readPosition(page);

  expect(afterImmediateMoves).toEqual({ column: 3, row: 3 });
  expect(afterRepeat.column).toBe(afterImmediateMoves.column);
  expect(afterRepeat.row).toBeGreaterThan(afterImmediateMoves.row);
});

test("repeated ArrowLeft and ArrowUp stop at the top-left map edge", async ({ page }) => {
  await openGame(page);
  await pressMany(page, "ArrowLeft", 10);
  await pressMany(page, "ArrowUp", 10);

  await expect.poll(() => readPosition(page)).toEqual({ column: 0, row: 0 });
});

test("a trash can blocks its asphalt cell", async ({ page }) => {
  await openGame(page);
  await pressMany(page, "ArrowRight", 5);
  await page.keyboard.press("ArrowDown");

  await expect.poll(() => readPosition(page)).toEqual({ column: 7, row: 2 });
});

test("a tree blocks its grass cell", async ({ page }) => {
  await openGame(page);
  await pressMany(page, "ArrowRight", 6);
  await pressMany(page, "ArrowDown", 5);

  await expect.poll(() => readPosition(page)).toEqual({ column: 8, row: 6 });
});

test("a failed Stage B texture shows a readable failure and removes gameplay", async ({ page }) => {
  await page.route("**/hobo.png", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/");

  await expect(page.getByRole("alert")).toContainText(/texture|asset/i);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator("#player-position")).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#player-position")).toHaveCount(0);
});

test("an invalid map shows a readable failure and does not start gameplay", async ({ page }) => {
  await page.route("**/phase-0*.json", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        orientation: "orthogonal",
        infinite: false,
        width: 24,
        height: 16,
        tilewidth: 32,
        tileheight: 32,
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
