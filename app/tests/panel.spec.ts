import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { emptyProject, STORAGE_KEY } from "../app/te/lib/model";

async function openEditor(page: Page) {
  page.on("pageerror", (error) => console.error("Browser error:", error.message));
  page.on("console", (message) => { if (message.type() === "error") console.error("Browser console:", message.text()); });
  await page.goto("/te");
  await page.getByRole("button", { name: "Disjoncteurs", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true })).toBeVisible();
}
async function drag(page: Page, source: Locator, destination: Locator) {
  await destination.scrollIntoViewIfNeeded();
  const from = await source.boundingBox(); const to = await destination.boundingBox();
  if (!from || !to) throw new Error("Missing drag coordinates");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 });
  await page.mouse.up();
}

test("edit two visible panels independently, restore, export, import and undo removal", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true }).click();
  await page.getByLabel("Étiquette de l’appareil").fill("Maison");
  await page.getByRole("button", { name: "+ Ajouter un second tableau", exact: true }).click();
  const first = page.getByRole("region", { name: "Composition du tableau 1", exact: true });
  const second = page.getByRole("region", { name: "Composition du tableau 2", exact: true });
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  await page.getByLabel("Nom du second tableau").fill("Garage");
  await second.getByLabel("Largeur").selectOption("18");
  await second.getByLabel("Rangées").selectOption("2");
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true }).click();
  await page.getByLabel("Étiquette de l’appareil").fill("Garage");
  await page.getByLabel("Nom du circuit", { exact: true }).fill("Prises garage");
  await page.getByRole("button", { name: "+ Ajouter un circuit", exact: true }).click();
  await page.getByLabel("Circuit associé", { exact: true }).selectOption({ label: "Prises garage" });
  await expect(first.getByLabel("Largeur")).toHaveValue("13");
  await expect(first.locator(".te-device-label")).toHaveText("Maison");
  await expect(second.locator(".te-device-label")).toHaveText("Garage");
  const firstBox = await first.boundingBox(); const secondBox = await second.boundingBox();
  expect(secondBox!.x).toBeGreaterThan(firstBox!.x + firstBox!.width - 1);
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").secondPanel?.circuits?.length, STORAGE_KEY)).toBe(1);
  await page.reload();
  await expect(first.locator(".te-device-label")).toHaveText("Maison");
  await expect(second.locator(".te-device-label")).toHaveText("Garage");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter JSON ↓", exact: true }).click();
  const exported = JSON.parse(await readFile((await (await downloadEvent).path())!, "utf8"));
  expect(exported.devices[0].label).toBe("Maison");
  expect(exported.secondPanel.capacity).toBe(18);
  expect(exported.secondPanel.circuits[0].name).toBe("Prises garage");
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer le second tableau", exact: true }).click();
  await expect(page.locator(".te-board-section")).toHaveCount(1);
  await page.getByRole("button", { name: "Annuler la dernière modification", exact: true }).click();
  await expect(second.locator(".te-device-label")).toHaveText("Garage");
  await page.getByLabel("Importer un projet JSON").setInputFiles({ name: "two.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(exported)) });
  await expect(second.getByLabel("Largeur")).toHaveValue("18");
  await page.emulateMedia({ media: "print" });
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  await expect(page.getByText("Prises garage", { exact: true })).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("add, assign a circuit and protection, persist, export, import and undo", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  await openEditor(page);
  await page.getByRole("button", { name: "Différentiels", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter Différentiel 63 A · type A", exact: true }).click();
  await page.getByRole("button", { name: "Disjoncteurs", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true }).click();
  await page.getByLabel("Nom du circuit", { exact: true }).fill("Prises du salon");
  await page.getByRole("button", { name: "+ Ajouter un circuit", exact: true }).click();
  await page.getByLabel("Circuit associé", { exact: true }).selectOption({ label: "Prises du salon" });
  await page.getByLabel("Différentiel amont").selectOption({ index: 1 });
  await page.getByLabel("Étiquette de l’appareil").fill("Salon");
  await page.getByRole("button", { name: "Distribution", exact: true }).click();
  await page.getByRole("button", { name: "Voir la fiche R9EXHC13", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter à la rangée active", exact: true }).click();
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").devices?.[1]?.label, STORAGE_KEY)).toBe("Salon");
  await page.reload();
  await expect(page.locator(".te-device")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Salon, position 3", exact: true })).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter JSON ↓", exact: true }).click();
  const download = await downloadEvent;
  const path = await download.path();
  const exported = JSON.parse(await readFile(path!, "utf8"));
  expect(exported.devices).toHaveLength(2);
  expect(exported.devices[1].circuitId).toBe(exported.circuits[0].id);
  expect(exported.devices[1].upstreamId).toBe(exported.devices[0].id);
  page.on("dialog", (dialog) => dialog.accept());
  const imported = { ...emptyProject(), name: "Tableau importé" };
  await page.getByLabel("Importer un projet JSON").setInputFiles({ name: "panel.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(imported)) });
  await expect(page.getByLabel("Nom du projet", { exact: true })).toHaveValue("Tableau importé");
  await page.getByRole("button", { name: "Annuler la dernière modification", exact: true }).click();
  await expect(page.locator(".te-device")).toHaveCount(2);
  await page.getByRole("button", { name: "Le matériel", exact: false }).click();
  await expect(page.getByRole("table").getByRole("link", { name: "R9EXHC13 ↗" })).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "Les circuits de la maison" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Les points à vérifier" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("associate two circuits, restore and export both, then unlink the second", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true }).click();
  for (const name of ["Salon", "Chambre"]) {
    await page.getByLabel("Nom du circuit", { exact: true }).fill(name);
    await page.getByRole("button", { name: "+ Ajouter un circuit", exact: true }).click();
  }
  await page.getByLabel("Circuit associé", { exact: true }).selectOption({ label: "Salon" });
  await page.getByLabel("Second circuit associé (facultatif)", { exact: true }).selectOption({ label: "Chambre" });
  await expect(page.locator(".te-device-label")).toHaveText("Salon / Chambre");
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").devices?.[0]?.secondCircuitId, STORAGE_KEY)).toBeTruthy();
  await page.reload();
  await page.locator(".te-device").click();
  await expect(page.getByLabel("Second circuit associé (facultatif)")).not.toHaveValue("");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter JSON ↓", exact: true }).click();
  const exported = JSON.parse(await readFile((await (await downloadEvent).path())!, "utf8"));
  expect(exported.devices[0].secondCircuitId).toBe(exported.circuits[1].id);
  page.on("dialog", (dialog) => dialog.accept());
  const second = page.locator(".te-circuit-list details").filter({ hasText: "Chambre" });
  await second.locator("summary").click();
  await second.getByRole("button", { name: "Supprimer le circuit" }).click();
  await expect(page.getByLabel("Second circuit associé (facultatif)")).toHaveValue("");
  await expect(page.locator(".te-device-label")).toHaveText("Salon");
});

test("actual mouse drag from catalog, cross-row move, collision rejection and cancel", async ({ page }) => {
  await openEditor(page);
  await drag(page, page.getByRole("button", { name: "Glisser Disjoncteur 16 A · XE", exact: true }), page.locator('[data-row-index="0"] .te-slot').nth(4));
  await expect(page.getByRole("button", { name: "Disjoncteur 16 A · XE, position 5", exact: true })).toBeVisible();
  await drag(page, page.locator(".te-device"), page.locator('[data-row-index="1"] .te-slot').nth(7));
  await expect(page.locator('[data-row-index="1"] .te-device')).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Disjoncteur 16 A · XE, position 8", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter Disjoncteur 20 A · XE", exact: true }).click();
  await drag(page, page.locator('[data-row-index="0"] .te-device'), page.locator('[data-row-index="1"] .te-slot').nth(7));
  await expect(page.locator(".te-status")).toContainText("occupé");
  await expect(page.locator('[data-row-index="0"] .te-device')).toHaveCount(1);
  await page.locator('[data-row-index="0"] .te-device').focus();
  await page.keyboard.press("Space"); await page.keyboard.press("ArrowRight"); await page.keyboard.press("Escape");
  await expect(page.locator(".te-status")).toContainText("annulé");
  await expect(page.locator('[data-row-index="0"] .te-device')).toHaveCount(1);
});

test("accessible position controls reject overlap and shrinking occupied rows", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "Différentiels", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter Différentiel 63 A · type A", exact: true }).click();
  await page.getByRole("button", { name: "Disjoncteurs", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true }).click();
  await page.getByLabel("Position de départ").fill("2");
  await page.getByRole("button", { name: "Déplacer l’appareil →", exact: true }).click();
  await expect(page.locator(".te-status")).toContainText("occupé");
  await page.getByLabel("Déplacer vers la rangée").selectOption("row-3");
  await page.getByLabel("Position de départ").fill("13");
  await page.getByRole("button", { name: "Déplacer l’appareil →", exact: true }).click();
  await expect(page.locator('[data-row-index="2"] .te-device')).toHaveCount(1);
  await page.getByRole("combobox", { name: "Rangées", exact: true }).selectOption("2");
  await expect(page.locator(".te-status")).toContainText("Déplacez");
  await expect(page.getByRole("combobox", { name: "Rangées", exact: true })).toHaveValue("3");
});

test("invalid import preserves the current project", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true }).click();
  await page.getByLabel("Importer un projet JSON").setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from('{"schemaVersion":200}') });
  await expect(page.locator(".te-status")).toContainText("Import refusé");
  await expect(page.locator(".te-device")).toHaveCount(1);
});

test("corrupt saved data is preserved until explicit replacement", async ({ page }) => {
  await page.addInitScript((key) => { localStorage.setItem(key, "broken project"); }, STORAGE_KEY);
  await openEditor(page);
  await expect(page.getByText("Sauvegarde suspendue", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe("broken project");
});

test("storage write failures are visible without breaking the editor", async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException("Quota exceeded", "QuotaExceededError"); }; });
  await openEditor(page);
  await expect(page.getByText("Sauvegarde locale indisponible · exportez le JSON", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true }).click();
  await expect(page.locator(".te-device")).toHaveCount(1);
});

test("mobile layout, touch drag, and alternate add controls work", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await openEditor(page);
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true }).click();
  await expect(page.locator(".te-device")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("Étiquette de l’appareil").fill("Circuit tactile");
  await expect(page.getByRole("button", { name: "Circuit tactile, position 1", exact: true })).toHaveCount(1);
  await page.locator('[data-row-index="0"]').scrollIntoViewIfNeeded();
  const from = await page.locator(".te-device").boundingBox();
  const to = await page.locator('[data-row-index="0"] .te-slot').nth(3).boundingBox();
  if (!from || !to) throw new Error("Missing touch coordinates");
  const cdp = await context.newCDPSession(page);
  const x = from.x + from.width / 2; const y = from.y + from.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  // Match the long-press activation threshold before sending a real touch move.
  await expect(page.locator(".te-status")).toContainText("Déplacement en cours");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: to.x + to.width / 2, y: to.y + to.height / 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByRole("button", { name: "Circuit tactile, position 4", exact: true })).toHaveCount(1);
  await page.screenshot({ path: "test-results/panel-mobile.png", fullPage: true });
  await context.close();
});

test("communication cabinet persists, exports, prints and supports mobile editing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openEditor(page);
  const cabinet = page.getByRole("region", { name: "Coffret de communication", exact: true });
  await cabinet.getByLabel("Inclure un coffret de communication").check();
  await cabinet.getByLabel("Référence du coffret").fill("Mon coffret");
  await cabinet.getByLabel("Emplacement du coffret").fill("Entrée");
  await cabinet.getByLabel("Box Internet", { exact: true }).check();
  await cabinet.getByLabel("Nombre de ports du switch").fill("8");
  await cabinet.getByRole("button", { name: "+ Ajouter une prise RJ45", exact: true }).click();
  await cabinet.getByLabel("Pièce desservie · prise 1").fill("Bureau");
  await cabinet.getByLabel("Repère · prise 1").fill("PC");
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").communication?.ports?.[0]?.room, STORAGE_KEY)).toBe("Bureau");
  await page.reload();
  await expect(cabinet.getByLabel("Pièce desservie · prise 1")).toHaveValue("Bureau");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter JSON ↓", exact: true }).click();
  const exported = JSON.parse(await readFile((await (await downloadEvent).path())!, "utf8"));
  expect(exported.communication.ports[0].room).toBe("Bureau");
  await page.getByRole("button", { name: "Le matériel", exact: false }).click();
  await expect(page.getByRole("cell", { name: "Coffret de communication", exact: true })).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(cabinet.getByRole("heading", { name: "Le coffret de communication" })).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await cabinet.getByRole("button", { name: "Retirer la prise RJ45 1", exact: true }).click();
  await expect(cabinet.getByLabel("Pièce desservie · prise 1")).toHaveCount(0);
  await page.getByRole("button", { name: "Annuler la dernière modification", exact: true }).click();
  await expect(cabinet.getByLabel("Pièce desservie · prise 1")).toHaveValue("Bureau");
});

test("surge protector filters, places, persists and appears in materials", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "Parafoudres", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Ajouter Parafoudre type 2 · 10 kA", exact: true }).click();
  await expect(page.locator(".te-device")).toHaveCSS("grid-column-end", "span 2");
  await expect(page.getByLabel("Circuit associé", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Différentiel amont")).toHaveCount(0);
  await expect(page.locator(".te-inspector .te-badge")).toHaveText("Resi9 XP PF");
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").devices?.[0]?.reference, STORAGE_KEY)).toBe("R9PLC");
  await page.reload();
  await expect(page.getByRole("button", { name: "Parafoudre type 2 · 10 kA, position 1", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Le matériel", exact: false }).click();
  await expect(page.getByRole("table").getByRole("link", { name: "R9PLC ↗", exact: true })).toBeVisible();
});

test("impulse relay variants filter, persist, export and populate materials", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "Télérupteurs", exact: true }).click();
  await expect(page.locator(".te-catalog-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Ajouter Télérupteur 16 A · 2NO", exact: true }).click();
  await expect(page.locator(".te-device")).toHaveCSS("grid-column-end", "span 1");
  await expect(page.getByLabel("Circuit associé", { exact: true })).toHaveCount(0);
  await page.getByLabel("Variante de l’appareil").selectOption("R9PCL2S");
  await page.getByLabel("Étiquette de l’appareil").fill("Éclairage palier");
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").devices?.[0]?.reference, STORAGE_KEY)).toBe("R9PCL2S");
  await page.reload();
  await expect(page.getByRole("button", { name: "Éclairage palier, position 1", exact: true })).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter JSON ↓", exact: true }).click();
  const exported = JSON.parse(await readFile((await (await downloadEvent).path())!, "utf8"));
  expect(exported.devices[0].reference).toBe("R9PCL2S");
  await page.getByRole("button", { name: "Le matériel", exact: false }).click();
  await expect(page.getByRole("table").getByRole("link", { name: "R9PCL2S ↗", exact: true })).toBeVisible();
});

test("home navigation links to the editor", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "TE", exact: true }).first().click();
  await expect(page).toHaveURL(/\/te$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("TE");
});
