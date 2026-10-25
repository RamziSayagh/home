import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { emptyProject, materialList } from "../app/te/lib/model";
import { comparableBudget, comparableSuppliersBudget, materialBudget, materialsCsv, priceDateLabel, supplierPrice } from "../app/te/lib/pricing";

test("Elecdirect prices feed budgets and common three-supplier comparisons without treating missing prices as zero", () => {
  expect(supplierPrice("R9EFC616", "elecdirect")?.unitPriceCents).toBe(995);
  expect(supplierPrice("A9F77240", "elecdirect")?.unitPriceCents).toBe(4736);
  expect(supplierPrice("A9Z61240", "elecdirect")?.unitPriceCents).toBeNull();
  expect(supplierPrice("R9H13537", "elecdirect")?.unitPriceCents).toBeNull();
  expect(supplierPrice("__proto__", "elecdirect")).toBeUndefined();
  expect(priceDateLabel("elecdirect")).toBe("25/10/2026");
  const materials = [
    { reference: "R9EFC616", name: "Breaker", quantity: 2, source: "", status: "" },
    { reference: "R9EXHS10", name: "Distribution", quantity: 1, source: "", status: "" },
    { reference: "A9Z61240", name: "Unknown", quantity: 1, source: "", status: "" },
  ];
  expect(materialBudget(materials, "elecdirect")).toEqual({ totalCents: 2780, pricedQuantity: 3, missingQuantity: 1 });
  expect(comparableSuppliersBudget(materials)).toEqual({ totals: { elec44: 1990, "123elec": 2020, elecdirect: 1990 }, quantity: 2 });
  const csv = materialsCsv(materials);
  expect(csv).toContain("Source Elecdirect");
  expect(csv).toContain("www.elecdirect.fr/");
  expect(csv).toContain('"27,80"');
  expect(new Set(csv.trim().split("\r\n").map(line => line.split(";").length))).toEqual(new Set([15]));
});

test("Elec44 budget aggregates both panels in cents and leaves unknown prices unpriced", () => {
  const project = emptyProject();
  project.devices = [{ id: "a", reference: "R9EFC616", rowId: "row-1", slot: 0, label: "", circuitId: "", upstreamId: "" }];
  project.rows[0].distributions = [{ id: "s1", reference: "R9EXHS05", slot: 0 }, { id: "s2", reference: "R9EXHS05", slot: 5 }];
  project.secondPanel = { ...emptyProject(), devices: [{ ...project.devices[0], id: "b" }, { ...project.devices[0], id: "c", slot: 1 }, { ...project.devices[0], id: "unknown", reference: "A9Z61263", slot: 2 }] };
  project.gtl = { units: [{ id: "gtl", reference: "R9HKT18", quantity: 2, accessories: [] }], placements: { primary: "gtl", secondary: "", communication: "" } };
  project.accessories = [{ id: "extra", reference: "CUSTOM", name: "Accessory", quantity: 3 }];
  const materials = materialList(project);
  expect(materialBudget(materials)).toEqual({ totalCents: 4590 * 2 + 995 * 3 + 600 * 2 + 11280 * 2, pricedQuantity: 9, missingQuantity: 4 });
  expect(supplierPrice("A9Z61263")?.unitPriceCents).toBeNull();
  expect(supplierPrice("A9Z51240")?.unitPriceCents).toBe(24185);
  expect(supplierPrice("A9F77240")?.unitPriceCents).toBe(5059);
  expect(supplierPrice("A9F77240", "123elec")?.unitPriceCents).toBe(4550);
  expect(priceDateLabel("123elec", "A9F77240")).toBe("25/10/2026");
  expect(comparableSuppliersBudget([{ reference: "A9F77240", name: "40 A", quantity: 2, source: "", status: "" }])).toEqual({ totals: { elec44: 10118, "123elec": 9100, elecdirect: 9472 }, quantity: 2 });
  expect(priceDateLabel("elec44", "A9F77240")).toBe("25/10/2026");
  expect(priceDateLabel("elec44", "A9Z51240")).toBe("25/10/2026");
  expect(priceDateLabel("elec44", "R9EFC616")).toBe("24/10/2026");
  expect(materialsCsv([{ reference: "A9Z51240", name: "Type B-EV", quantity: 1, source: "", status: "" }])).toContain("2026-10-25");
  expect(supplierPrice("R9EXHS10")?.unitPriceCents).toBeNull();
  expect(supplierPrice("__proto__")).toBeUndefined();
  expect(supplierPrice("R9EFC616")?.source).toMatch(/^https:\/\/elec44\.fr\//);
  expect(supplierPrice("R9EFC616", "123elec")?.unitPriceCents).toBe(1010);
  expect(supplierPrice("R9EFC616", "123elec")?.source).toMatch(/^https:\/\/www\.123elec\.com\//);
  expect(materialBudget(materials, "123elec")).toEqual({ totalCents: 4690 * 2 + 1010 * 3 + 499 * 2, pricedQuantity: 7, missingQuantity: 6 });
  expect(comparableBudget(materials)).toEqual({ elec44Cents: 4590 * 2 + 995 * 3 + 600 * 2, oneTwoThreeElecCents: 4690 * 2 + 1010 * 3 + 499 * 2, quantity: 7, differenceCents: 43 });
  const csv = materialsCsv(materials);
  expect(csv).toContain('"9,95";"29,85"');
  expect(csv).toContain('"";"";"Non chiffré"');
  expect(csv).toContain("SOUS-TOTAL CONNU TTC");
  expect(materialsCsv([{ reference: "=1+1", name: "Test", quantity: 1, status: "", source: "" }])).toContain("\"'=1+1\"");
});

test("catalog, inspector, materials, CSV and print compare dated TTC prices", async ({ page }) => {
  await page.goto("/te");
  const budget = page.getByLabel("Budget du matériel");
  await expect(budget).toContainText("45,90");
  await expect(page.getByRole("button", { name: "Tous", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Différentiels", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Disjoncteurs", exact: true }).click();
  const breakerCard = page.locator(".te-catalog-card").filter({ has: page.getByRole("heading", { name: "Disjoncteur 16 A · XE", exact: true }) });
  await expect(breakerCard.getByRole("link", { name: /Prix Elec44/ })).toContainText("9,95");
  await expect(breakerCard.getByRole("link", { name: /Prix 123elec/ })).toContainText("10,10");
  await expect(breakerCard.getByRole("link", { name: /Prix Elecdirect/ })).toContainText("9,95");
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter Disjoncteur 16 A · XE", exact: true }).click();
  await expect(budget).toContainText("65,80");
  await expect(page.getByRole("complementary", { name: "Détails de l’appareil" }).getByRole("link", { name: /Prix Elec44/ })).toContainText("9,95");
  await expect(page.getByRole("complementary", { name: "Détails de l’appareil" }).getByRole("link", { name: /Prix Elecdirect/ })).toContainText("9,95");
  await page.getByRole("button", { name: "Différentiels", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter Différentiel 63 A · type B-SI", exact: true }).click();
  await expect(budget).toContainText("Sous-total connu TTC");
  await expect(budget).toContainText("65,80");
  await expect(budget).toContainText("1 élément(s) non chiffré(s)");
  await page.getByRole("button", { name: "Le matériel", exact: false }).click();
  const row = page.locator("tbody tr").filter({ hasText: "R9EFC616" });
  await expect(row).toContainText("19,90");
  await expect(row).toContainText("20,20");
  await expect(row.getByRole("link", { name: /Prix Elecdirect/ })).toHaveAttribute("href", /www\.elecdirect\.fr/);
  await expect(page.locator("tbody tr").filter({ hasText: "A9Z61263" })).toContainText("Non chiffré");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter CSV ↓", exact: true }).click();
  const csv = await readFile((await (await downloadEvent).path())!, "utf8");
  expect(csv).toContain('"9,95";"19,90"');
  expect(csv).toContain('"10,10";"20,20"');
  expect(csv).toContain('"65,80"');
  expect(csv).toContain("2026-10-24");
  await page.emulateMedia({ media: "print" });
  await expect(row).toBeVisible();
  await expect(budget).toBeVisible();
  await page.screenshot({ path: "test-results/elec44-prices-print.png", fullPage: true });
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
