import { expect, test } from "@playwright/test";

test("3D scene renders and responds to lighting and camera controls", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/3d");
  await expect(page.getByRole("button", { name: "Le quartier", exact: true })).toBeEnabled({ timeout: 30_000 });
  await expect(page.locator(".world-canvas canvas")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Heure dorée", exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/3d-desktop.png" });
  await page.getByRole("button", { name: "Nuit", exact: true }).click();
  await expect(page.getByRole("slider")).toHaveValue("100");
  await expect(page.locator(".world-stage")).toHaveClass(/phase-4/);
  await page.getByRole("button", { name: "La maison", exact: true }).click();
  await expect(page.getByRole("button", { name: "La maison", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Zoom avant", exact: true }).click();
  await page.getByRole("button", { name: "Tourner vers la gauche", exact: true }).click();
  await page.getByRole("button", { name: "Voisinage", exact: true }).click();
  await expect(page.getByRole("button", { name: "Voisinage", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.screenshot({ path: "test-results/3d-night-house.png" });
  await page.getByRole("button", { name: "Animer du jour à la nuit", exact: true }).click();
  await expect.poll(async () => Number(await page.getByRole("slider").inputValue())).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Mettre en pause", exact: true }).click();
  const paused = await page.getByRole("slider").inputValue();
  await page.waitForTimeout(350);
  await expect(page.getByRole("slider")).toHaveValue(paused);
  expect(errors).toEqual([]);
});

test("3D page is usable on mobile with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/3d");
  await expect(page.getByRole("button", { name: "Le quartier", exact: true })).toBeEnabled({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Rotation douce", exact: true })).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/3d-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Coucher de soleil", exact: true }).click();
  await expect(page.getByRole("slider")).toHaveValue("62");
  await page.getByRole("slider").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("slider")).toHaveValue("62.1");
});
