import { expect, test, type Page, type Locator } from "@playwright/test";
import { emptyProject, STORAGE_KEY } from "../app/te/lib/model";

async function dragCircuit(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox(); const to = await target.boundingBox();
  if (!from || !to) throw new Error("Missing circuit drag coordinates");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(80); // dnd-kit click suppression lasts 50 ms after a drag.
}

test("duplicate and reorder general circuits while preserving device assignments", async ({ page }) => {
  const project = emptyProject();
  project.circuits = [{ id: "original", name: "VMC", room: "Combles", floor: "Étage", usage: "Circuit spécialisé · VMC", load: "40 W", cable: "À vérifier" }];
  project.devices = [{ id: "device", reference: "R9EFC602", rowId: project.rows[0].id, slot: 0, label: "", circuitId: "original", upstreamId: "" }];
  project.secondPanel = { ...emptyProject(), circuits: [{ ...project.circuits[0], id: "garage", name: "Garage" }] };
  await page.addInitScript(({ key, project }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(project)); }, { key: STORAGE_KEY, project });
  await page.goto("/te");
  const list = page.locator(".te-circuit-list");
  await list.getByRole("button", { name: "Dupliquer le circuit VMC", exact: true }).click();
  await expect(list.locator(".te-circuit")).toHaveCount(3);
  await expect(list.locator("details[open]")).toHaveCount(0);
  await expect(list.locator("summary strong")).toHaveText(["VMC", "VMC (copie)", "Garage"]);
  await dragCircuit(page, list.getByRole("button", { name: "Déplacer le circuit VMC (copie)", exact: true }), list.locator("summary").first());
  await expect(list.locator("summary strong")).toHaveText(["VMC (copie)", "VMC", "Garage"]);
  await page.getByRole("button", { name: "Annuler la dernière modification", exact: true }).click();
  await expect(list.locator("summary strong")).toHaveText(["VMC", "VMC (copie)", "Garage"]);
  await dragCircuit(page, list.getByRole("button", { name: "Déplacer le circuit VMC", exact: true }), list.locator("summary").nth(1));
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || "{}").circuits?.[0]?.name, STORAGE_KEY)).toBe("VMC (copie)");
  await page.reload();
  await expect(list.locator("summary strong")).toHaveText(["VMC (copie)", "VMC", "Garage"]);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || "{}"), STORAGE_KEY);
  expect(saved.circuits[0]).toMatchObject({ usage: project.circuits[0].usage, room: "Combles", load: "40 W", cable: "À vérifier" });
  expect(saved.circuits[0].id).not.toBe("original");
  expect(saved.devices[0].circuitId).toBe("original");
  expect(saved.secondPanel.circuits).toEqual([]);
  expect(saved.circuits[2]).toEqual(project.secondPanel.circuits[0]);
  const handle = list.getByRole("button", { name: "Déplacer le circuit VMC (copie)", exact: true });
  await handle.focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".te-circuit-drag-preview")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(list.locator(".te-circuit-drop-row.over strong")).toHaveText("VMC");
  await page.keyboard.press("Space");
  await expect(list.locator("summary strong")).toHaveText(["VMC", "VMC (copie)", "Garage"]);
  await expect(list.locator("details[open]")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(list.getByRole("button", { name: "Dupliquer le circuit VMC", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("circuits reorder by long-press touch on mobile", async ({ browser }) => {
  const project = emptyProject();
  project.circuits = ["Salon", "Cuisine"].map((name, index) => ({ id: String(index), name, room: "", floor: "", usage: "", load: "", cable: "" }));
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.addInitScript(({ key, project }) => localStorage.setItem(key, JSON.stringify(project)), { key: STORAGE_KEY, project });
  await page.goto("/te");
  const list = page.locator(".te-circuit-list");
  await list.getByRole("button", { name: "Déplacer le circuit Cuisine", exact: true }).scrollIntoViewIfNeeded();
  const from = await list.getByRole("button", { name: "Déplacer le circuit Cuisine", exact: true }).boundingBox();
  const to = await list.locator("summary").first().boundingBox();
  if (!from || !to) throw new Error("Missing touch coordinates");
  const cdp = await context.newCDPSession(page);
  const x = from.x + from.width / 2; const y = from.y + from.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await page.waitForTimeout(260);
  for (let step = 1; step <= 12; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (to.x + to.width / 2 - x) * step / 12, y: y + (to.y + to.height / 2 - y) * step / 12 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(list.locator("summary strong")).toHaveText(["Cuisine", "Salon"]);
  await expect(list.locator("details[open]")).toHaveCount(0);
  await context.close();
});
