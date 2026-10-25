import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { emptyProject, STORAGE_KEY } from "../app/te/lib/model";

async function addDistribution(page: Page, reference: string) {
  await page.getByRole("button", { name: `Voir la fiche ${reference}`, exact: true }).click();
  await page.getByRole("button", { name: "Ajouter à la rangée active", exact: true }).click();
}

async function drag(page: Page, source: Locator, destination: Locator) {
  await source.scrollIntoViewIfNeeded();
  await destination.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await destination.boundingBox();
  if (!from || !to) throw new Error("Missing drag coordinates");
  await page.mouse.move(from.x + 10, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 20, from.y + from.height / 2, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 });
  await page.mouse.up();
}

const track = (page: Page, row = 0) => page.locator(".te-distribution-track").nth(row);
const slot = (page: Page, row: number, position: number) => track(page, row).locator(`.te-distribution-slot[data-slot="${position}"]`);
const segment = (page: Page, reference: string, row = 0) => track(page, row).locator(`.te-distribution-segment[data-reference="${reference}"]`);

test("distributors drag from catalog, move between rows, reject invalid drops and delete with a cross", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1600 });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/te");
  await page.getByRole("button", { name: "Distribution", exact: true }).click();
  await page.screenshot({ path: "test-results/distribution-illustrations.png" });
  await expect(page.locator(".te-panel-row select")).toHaveCount(0);
  await expect(page.locator(".te-distribution-add")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Glisser R9EXHS05", exact: true })).not.toContainText("⠿");
  await drag(page, page.getByRole("button", { name: "Glisser R9EXHS05", exact: true }), slot(page, 0, 0));
  await expect(segment(page, "R9EXHS05")).toHaveAttribute("data-slot", "0");
  await drag(page, page.getByRole("button", { name: "Glisser R9EXHS08", exact: true }), slot(page, 0, 5));
  await expect(segment(page, "R9EXHS08")).toHaveAttribute("data-slot", "5");
  await drag(page, page.getByRole("button", { name: "Glisser R9EXHS05", exact: true }), slot(page, 0, 1));
  await expect(page.locator(".te-status")).toContainText("chevauchent");
  await expect(track(page).locator(".te-distribution-segment")).toHaveCount(2);
  await drag(page, page.getByRole("button", { name: "Glisser R9EXHS08", exact: true }), slot(page, 0, 12));
  await expect(page.locator(".te-status")).toContainText("dépasse");
  await page.locator(".te-enclosure").screenshot({ path: "test-results/distributors-drag-desktop.png" });
  await drag(page, segment(page, "R9EXHS08").locator(".te-distribution-handle"), slot(page, 1, 2));
  await expect(segment(page, "R9EXHS08", 1)).toHaveAttribute("data-slot", "2");
  await segment(page, "R9EXHS08", 1).locator(".te-distribution-handle").focus();
  await page.keyboard.press("ArrowRight");
  await expect(segment(page, "R9EXHS08", 1)).toHaveAttribute("data-slot", "3");
  await segment(page, "R9EXHS05").getByRole("button", { name: /^Supprimer/ }).click();
  await expect(track(page).locator(".te-distribution-segment")).toHaveCount(0);
  await page.getByRole("button", { name: "Annuler la dernière modification", exact: true }).click();
  await expect(segment(page, "R9EXHS05")).toBeVisible();
  await page.reload();
  await expect(segment(page, "R9EXHS08", 1)).toHaveAttribute("data-slot", "3");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter JSON ↓", exact: true }).click();
  const exported = JSON.parse(await readFile((await (await downloadEvent).path())!, "utf8"));
  expect(exported.rows[0].distributions[0]).toMatchObject({ reference: "R9EXHS05", slot: 0 });
  expect(exported.rows[1].distributions[0]).toMatchObject({ reference: "R9EXHS08", slot: 3 });
  page.on("dialog", dialog => dialog.accept());
  await page.getByLabel("Importer un projet JSON").setInputFiles({ name: "segments.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(exported)) });
  await expect(segment(page, "R9EXHS08", 1)).toHaveAttribute("data-slot", "3");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".te-distribution-remove").first()).toBeHidden();
  await expect(segment(page, "R9EXHS05")).toBeVisible();
  await expect(page.getByRole("cell", { name: "R9EXHS05 ↗", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("legacy distributions, mobile compact controls and second panel remain usable", async ({ page }) => {
  const legacy = emptyProject();
  legacy.rows[0].distributor = "R9EXHS05";
  await page.addInitScript(({ key, data }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(data)); }, { key: STORAGE_KEY, data: legacy });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/te");
  await expect(segment(page, "R9EXHS05")).toBeVisible();
  await page.getByRole("button", { name: "+ Ajouter un second tableau", exact: true }).click();
  const second = page.getByRole("region", { name: "Composition du tableau 2", exact: true });
  await second.getByLabel("Largeur").selectOption("18");
  await page.getByRole("button", { name: "Distribution", exact: true }).click();
  await addDistribution(page, "R9EXHC05");
  await addDistribution(page, "R9EXHS05");
  await addDistribution(page, "R9EXHS08");
  await expect(second.locator(".te-distribution-segment")).toHaveCount(3);
  await expect(second.locator('[data-reference="R9EXHS08"]')).toHaveAttribute("data-slot", "10");
  await second.locator('[data-reference="R9EXHC05"] .te-distribution-remove').click();
  await expect(second.locator(".te-distribution-segment")).toHaveCount(2);
  await page.reload();
  await expect(second.locator(".te-distribution-segment")).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/distributors-drag-mobile.png", fullPage: true });
});

test("comb rows preserve peignable equipment and undo removal", async ({ page }) => {
  await page.goto("/te");
  await page.getByRole("button", { name: "Distribution", exact: true }).click();
  await addDistribution(page, "R9PXH213");
  await page.getByRole("button", { name: "Tous", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter Différentiel 63 A · type Fsi · peignable", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XP", exact: true }).click();
  await page.reload();
  await expect(page.locator(".te-comb-line")).toHaveCount(1);
  await expect(page.locator(".te-device")).toHaveCount(2);
  await segment(page, "R9PXH213").locator(".te-distribution-remove").click();
  await page.getByRole("button", { name: "Annuler la dernière modification", exact: true }).click();
  await expect(page.locator(".te-comb-line")).toHaveCount(1);
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("cell", { name: "R9PXH213 ↗", exact: true })).toBeVisible();
});

test("placed distributions support long-press touch movement", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("/te");
  await page.getByRole("button", { name: "Distribution", exact: true }).click();
  await addDistribution(page, "R9EXHS05");
  await track(page).scrollIntoViewIfNeeded();
  const from = await segment(page, "R9EXHS05").locator(".te-distribution-handle").boundingBox();
  const to = await slot(page, 0, 3).boundingBox();
  if (!from || !to) throw new Error("Missing touch coordinates");
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x + 10, y: from.y + from.height / 2 }] });
  await expect(page.locator(".te-status")).toContainText("Déplacement en cours");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: to.x + to.width / 2, y: to.y + to.height / 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(segment(page, "R9EXHS05")).toHaveAttribute("data-slot", "3");
  await page.screenshot({ path: "test-results/distributors-touch.png" });
  await context.close();
});

test("distribution clicks show catalog and placed details with current position, price and selection", async ({ page }) => {
  await page.goto("/te");
  await page.getByRole("button", { name: "Distribution", exact: true }).click();
  const inspector = page.getByRole("complementary", { name: "Détails de l’appareil", exact: true });
  await page.getByRole("button", { name: "Glisser R9EXHC05", exact: true }).click();
  await expect(inspector).toContainText("Produit du catalogue");
  await expect(inspector).toContainText("Oui · avec connecteur");
  await expect(inspector.getByRole("link", { name: /Prix Elec44/ })).toContainText("8,14");
  await expect(page.locator(".te-distribution-segment")).toHaveCount(0);
  await addDistribution(page, "R9EXHS05");
  await addDistribution(page, "R9EXHS05");
  const first = track(page).locator('.te-distribution-segment[data-slot="0"] .te-distribution-handle');
  const second = track(page).locator('.te-distribution-segment[data-slot="5"] .te-distribution-handle');
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(second).toHaveAttribute("aria-pressed", "false");
  await expect(inspector.locator("dd").last()).toHaveText("1 à 5");
  await expect(inspector).toContainText("Non · sans connecteur");
  await second.focus();
  await page.keyboard.press("Enter");
  await expect(inspector.locator("dd").last()).toHaveText("6 à 10");
  await page.keyboard.press("ArrowRight");
  await expect(inspector.locator("dd").last()).toHaveText("7 à 11");
  await page.getByRole("button", { name: "Annuler la dernière modification", exact: true }).click();
  await expect(inspector.locator("dd").last()).toHaveText("6 à 10");
  await expect(inspector.getByRole("link", { name: "Consulter la fiche Schneider ↗" })).toHaveAttribute("href", "https://www.se.com/fr/fr/product/R9EXHS05/");
  await page.screenshot({ path: "test-results/distribution-details.png" });
  await page.getByRole("button", { name: "Tous", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true }).click();
  await expect(inspector.getByLabel("Étiquette de l’appareil")).toBeVisible();
  await first.click();
  await expect(inspector.getByLabel("Étiquette de l’appareil")).toHaveCount(0);
  await inspector.getByRole("button", { name: "Supprimer la distribution", exact: true }).click();
  await expect(inspector.locator(".te-distribution-details")).toHaveCount(0);
  await expect(track(page).locator(".te-distribution-segment")).toHaveCount(1);
});

test("distribution details target the clicked panel and support peignes on mobile", async ({ page }) => {
  await page.goto("/te");
  await page.getByRole("button", { name: "Distribution", exact: true }).click();
  await addDistribution(page, "R9EXHC05");
  await page.getByRole("button", { name: "+ Ajouter un second tableau", exact: true }).click();
  await addDistribution(page, "R9PXH213");
  const inspector = page.getByRole("complementary", { name: "Détails de l’appareil", exact: true });
  await expect(inspector).toContainText("Peigne horizontal");
  await expect(inspector).toContainText("Tableau 2 · Rangée 1");
  await expect(inspector).not.toContainText("Connecteur intégré");
  const firstPanel = page.getByRole("region", { name: "Composition du tableau 1", exact: true });
  await firstPanel.locator(".te-distribution-handle").click();
  await expect(inspector).toContainText("Tableau 1 · Rangée 1");
  await expect(inspector).toContainText("R9EXHC05");
  await page.setViewportSize({ width: 390, height: 844 });
  const secondPanel = page.getByRole("region", { name: "Composition du tableau 2", exact: true });
  await secondPanel.locator(".te-distribution-handle").click();
  await expect(inspector).toContainText("Tableau 2 · Rangée 1");
  await expect(inspector.getByRole("link", { name: /Prix Elec44/ })).toContainText("6,50");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await secondPanel.locator(".te-distribution-remove").click();
  await expect(inspector.locator(".te-distribution-details")).toHaveCount(0);
  await expect(firstPanel.locator(".te-distribution-segment")).toHaveCount(1);
  await secondPanel.getByLabel("Nom de la rangée 2", { exact: true }).click();
  await addDistribution(page, "R9EXHC05");
  await expect(secondPanel.locator(".te-panel-row").nth(1).locator(".te-distribution-segment")).toHaveCount(1);
  await expect(page.getByLabel("Rangée pour le bouton Ajouter", { exact: true })).toHaveCount(0);
});
