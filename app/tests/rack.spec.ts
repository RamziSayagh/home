import { expect, test } from "@playwright/test";
import { canPlace, firstFreeSlot, readRackConfig } from "../app/baie/rack-model";

test("legacy lists migrate and fragmented space cannot overlap", () => {
  const old = { height: 6, items: [{ id: "a", name: "NAS", reference: "UNAS-Pro", units: 2 }, { id: "b", name: "Switch", reference: "USW-24", units: 1 }] };
  const config = readRackConfig(old);
  expect(config.items.map(item => item.slot)).toEqual([0, 2]);
  expect(config.version).toBe(2);
  config.items[0].slot = 4;
  expect(firstFreeSlot(config, 2)).toBe(0);
  expect(firstFreeSlot(config, 3)).toBe(-1);
  expect(canPlace(config, 2, 1, "a")).toBe(false);
  expect(() => readRackConfig({ ...config, items: [...config.items, { ...config.items[1], id: "c" }] })).toThrow();
});

test("rack placement, geometry, drag and persistence", async ({ page }) => {
  await page.goto("/baie");
  await page.getByRole("button", { name: "Stockage", exact: true }).click();
  const cards = page.locator(".rack-catalogue article");
  await cards.filter({ has: page.getByRole("heading", { name: "UNAS Pro 4", exact: true }) }).getByRole("button", { name: "Ajouter +" }).click();
  await cards.filter({ has: page.getByRole("heading", { name: "Enterprise NAS", exact: true }) }).getByRole("button", { name: "Ajouter +" }).click();
  const nas = page.locator(".rack-device").filter({ has: page.getByRole("img", { name: "Façade illustrée du Enterprise NAS", exact: true }) });
  const one = page.locator(".rack-device").first();
  const oneBox = await one.boundingBox();
  const nasBox = await nas.boundingBox();
  expect(nasBox!.height / oneBox!.height).toBeCloseTo(3, 1);
  await nas.click();
  await page.getByLabel("Position de l’équipement").selectOption("9");
  await expect(nas).toHaveAttribute("data-slot", "9");
  await expect(page.getByRole("button", { name: "6 U", exact: true })).toBeDisabled();
  await one.dragTo(page.getByRole("button", { name: "U6 libre", exact: true }));
  await expect(one).toHaveAttribute("data-slot", "6");
  await page.reload();
  await expect(page.locator(".rack-device[data-slot='9']")).toHaveCount(1);
  await expect(page.locator(".rack-device[data-slot='6']")).toHaveCount(1);
  await page.screenshot({ path: "test-results/rack-placement.png", fullPage: true });
});

test("official references and illustrated rack survive reload", async ({ page, request }) => {
  await page.goto("/baie");
  const cards = page.locator(".rack-catalogue article");
  await expect(cards).toHaveCount(16);
  await expect(page.locator(".rack-catalogue svg[role=img]")).toHaveCount(16);
  await expect(cards.first().locator(".rack-price")).toContainText("340,00");
  await expect(cards.first().getByRole("link", { name: "Boutique Europe" })).toHaveAttribute("href", "https://eu.store.ui.com/eu/en/products/udm-pro");
  for (const link of await cards.getByRole("link", { name: "Visuel officiel" }).all()) {
    const response = await request.get((await link.getAttribute("href"))!);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/png");
  }
  await page.getByRole("button", { name: "24 U" }).click();
  for (const card of await cards.all()) await card.getByRole("button", { name: "Ajouter +" }).click();
  await expect(page.locator(".rack-frame svg")).toHaveCount(16);
  await expect(page.locator(".rack-budget strong")).toContainText("9 644,00");
  await page.reload();
  await expect(page.locator(".rack-frame svg")).toHaveCount(16);
  await expect(page.locator(".rack-budget strong")).toContainText("9 644,00");
  await page.screenshot({ path: "test-results/rack-desktop.png", fullPage: true });
});

test("NAS occupy their specified rack heights", async ({ page }) => {
  await page.goto("/baie");
  await page.getByRole("button", { name: "Stockage" }).click();
  const cards = page.locator(".rack-catalogue article");
  await expect(cards).toHaveCount(4);
  for (const card of await cards.all()) await card.getByRole("button", { name: "Ajouter +" }).click();
  await expect(page.locator(".rack-stats > div").nth(1)).toContainText("8");
  await expect(page.locator(".rack-budget strong")).toContainText("5 216,00");
  await page.reload();
  await expect(page.locator(".rack-frame svg")).toHaveCount(4);
});

test("mobile illustrations stay inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/baie");
  await page.locator(".rack-catalogue article").first().getByRole("button", { name: "Ajouter +" }).click();
  await expect(page.locator(".rack-frame svg")).toHaveCount(1);
  await expect(page.locator(".rack-budget strong")).toContainText("340,00");
  await page.getByLabel("Nom", { exact: true }).fill("Onduleur");
  await page.getByRole("button", { name: "Ajouter à la baie" }).click();
  await expect(page.locator(".rack-budget")).toContainText("1 équipement sans prix exclu du total");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/rack-mobile.png", fullPage: true });
});
