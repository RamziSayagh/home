import { expect, test, type Locator, type Page } from "@playwright/test";
import { emptyProject, STORAGE_KEY } from "../app/te/lib/model";

test("one and two row enclosures update references, drawings, heights and saved dimensions", async ({ page }) => {
  await page.goto("/te");
  const step = page.getByLabel("Étape 1 : configuration GTL");
  await step.getByRole("button", { name: "Voir les détails de Tableau 1", exact: true }).click();
  const details = step.getByLabel("Détails de l’élément GTL");
  for (const capacity of [13, 18]) {
    await details.getByLabel("Largeur du tableau").selectOption(String(capacity));
    for (const rows of [1, 2]) {
      await details.getByLabel("Rangées du tableau").selectOption(String(rows));
      await expect(details.getByLabel("Rangées du tableau")).toHaveValue(String(rows));
      await expect(details).toContainText(`R9H${capacity}40${rows}`);
      await expect(details).toContainText(rows === 1 ? "25 cm" : "37.5 cm");
      await expect(details.getByRole("img")).toHaveAttribute("aria-label", `Coffret ${rows} rangées de ${capacity} modules`);
      await expect(page.locator(".te-panel-row")).toHaveCount(rows);
    }
  }
  await page.reload();
  await expect(page.locator(".te-panel-row")).toHaveCount(2);
});

test("shrinking an occupied row explains the refusal in the GTL details", async ({ page }) => {
  const project = emptyProject();
  project.devices = [{ id: "occupied", reference: "R9EFC616", rowId: project.rows[2].id, slot: 0, label: "", circuitId: "", upstreamId: "" }];
  await page.addInitScript(({ key, project }) => localStorage.setItem(key, JSON.stringify(project)), { key: STORAGE_KEY, project });
  await page.goto("/te");
  const step = page.getByLabel("Étape 1 : configuration GTL");
  await step.getByRole("button", { name: "Voir les détails de Tableau 1", exact: true }).click();
  const details = step.getByLabel("Détails de l’élément GTL");
  await details.getByLabel("Rangées du tableau").selectOption("2");
  await expect(details.getByRole("alert")).toContainText("Déplacez les appareils concernés");
  await expect(details.getByLabel("Rangées du tableau")).toHaveValue("3");
  await expect(page.locator(".te-device")).toHaveCount(1);
});

test("saved mounted primary and secondary cabinets resize independently in their own details", async ({ page }) => {
  const project = emptyProject();
  project.secondPanel = emptyProject();
  project.gtl = { units: [{ id: "gtl", reference: "R9HKT18", quantity: 1, accessories: [] }], placements: { primary: "gtl", secondary: "gtl", communication: "" } };
  await page.addInitScript(({ key, project }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(project)); }, { key: STORAGE_KEY, project });
  await page.goto("/te");
  const step = page.getByLabel("Étape 1 : configuration GTL");
  const details = step.getByLabel("Détails de l’élément GTL");
  for (const [name, count] of [["Tableau 1", 1], ["Tableau 2", 2]] as const) {
    const mounted = step.locator(".te-gtl-mounted-card").filter({ has: page.getByRole("button", { name: `Voir les détails de ${name}`, exact: true }) });
    await mounted.getByRole("button", { name: `Voir les détails de ${name}`, exact: true }).click();
    await details.getByLabel("Rangées du tableau").selectOption(String(count));
    await expect(details.getByLabel("Rangées du tableau")).toHaveValue(String(count));
    await expect(mounted.getByRole("img")).toHaveAttribute("aria-label", `Coffret ${count} rangées de 13 modules`);
    await expect(page.getByRole("region", { name: `Composition du ${name.toLowerCase()}`, exact: true }).locator(".te-panel-row")).toHaveCount(count);
  }
});

async function drag(page: Page, source: Locator, destination: Locator) {
  await source.scrollIntoViewIfNeeded();
  await destination.scrollIntoViewIfNeeded();
  const from = await source.boundingBox(); const to = await destination.boundingBox();
  if (!from || !to) throw new Error("Missing drag coordinates");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 });
  await page.mouse.up();
  // dnd-kit keeps its click-suppression listener for 50 ms after sensor teardown.
  await page.waitForTimeout(80);
}

test("GTL mouse drops, details, panel removal and restore work across both lanes", async ({ page }) => {
  await page.setViewportSize({ width: 1800, height: 1200 });
  await page.goto("/te");
  const step = page.getByLabel("Étape 1 : configuration GTL");
  const palette = step.getByLabel("Éléments à glisser");
  const details = step.getByLabel("Détails de l’élément GTL");
  // Starting on the right must not create an invalid sparse array.
  await drag(page, palette.getByRole("button", { name: "Glisser GTL 13 modules", exact: true }), step.locator(".te-gtl-drop.empty").nth(1));
  await expect(step.locator(".te-gtl-drop.filled")).toHaveCount(1);
  await drag(page, palette.getByRole("button", { name: "Glisser GTL 18 modules", exact: true }), step.locator(".te-gtl-drop.empty"));
  await expect(step.locator(".te-gtl-drop.filled")).toHaveCount(2);
  await drag(page, palette.getByRole("button", { name: "Glisser Tableau 1", exact: true }), step.locator(".te-gtl-drop.filled").first());
  await expect(step.locator(".te-gtl-mounted-card")).toHaveCount(1);
  await details.getByLabel("Rangées du tableau").selectOption("4");
  await expect(details.getByRole("img")).toHaveAttribute("aria-label", "Coffret 4 rangées de 13 modules");
  await expect(details).toContainText("62.5 cm");
  await details.getByLabel("Bas du coffret depuis le sol fini (cm)").fill("100");
  await expect(details).toContainText("Haut du coffret : 162.5 cm");
  await drag(page, step.locator(".te-gtl-mounted-card").getByRole("button", { name: "Glisser Tableau 1", exact: true }), step.locator(".te-gtl-drop.filled").nth(1));
  await expect(step.locator(".te-gtl-drop.filled").nth(1).getByRole("button", { name: "Retirer Tableau 1 du plan", exact: true })).toBeVisible();
  await step.getByRole("button", { name: "Retirer Tableau 1 du plan", exact: true }).click();
  await expect(step.locator(".te-gtl-mounted-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Annuler la dernière modification", exact: true }).click();
  await expect(step.locator(".te-gtl-mounted-card")).toHaveCount(1);
  await drag(page, palette.getByRole("button", { name: "Glisser Coffret communication", exact: true }), step.locator(".te-gtl-drop.filled").nth(1));
  await expect(step.locator(".te-gtl-mounted-card")).toHaveCount(2);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || "{}").communication?.enabled, STORAGE_KEY)).toBe(true);
  await palette.getByRole("button", { name: "Voir les détails de Épanouisseur de câble · GTL 13 modules", exact: true }).click();
  await details.getByRole("button", { name: "Placer sur GTL 1", exact: true }).click();
  await expect(step.locator(".te-gtl-mounted-card")).toHaveCount(3);
  await page.reload();
  await expect(step.locator(".te-gtl-mounted-card")).toHaveCount(3);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || "{}").gtl?.heightsCm?.primary, STORAGE_KEY)).toBe(100);
  await page.screenshot({ path: "test-results/gtl-details-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("touch drag places a GTL and a tabletop details button remains usable", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 1400, height: 1100 } });
  const page = await context.newPage();
  await page.goto("/te");
  const step = page.getByLabel("Étape 1 : configuration GTL");
  const source = step.getByRole("button", { name: "Glisser GTL 18 modules", exact: true });
  const destination = step.locator(".te-gtl-drop.empty").first();
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox(); const to = await destination.boundingBox();
  if (!from || !to) throw new Error("Missing touch coordinates");
  const cdp = await context.newCDPSession(page);
  const x = from.x + from.width / 2; const y = from.y + from.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await page.waitForTimeout(260);
  for (let step = 1; step <= 12; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (to.x + to.width / 2 - x) * step / 12, y: y + (to.y + to.height / 2 - y) * step / 12 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator(".te-gtl-drop.filled")).toHaveCount(1);
  await page.waitForTimeout(80);
  await step.getByRole("button", { name: "Voir les détails de Tableau 1", exact: true }).tap();
  await step.getByLabel("Détails de l’élément GTL").getByRole("button", { name: "Placer sur GTL 1", exact: true }).tap();
  await expect(step.locator(".te-gtl-mounted-card")).toHaveCount(1);
  await context.close();
});
