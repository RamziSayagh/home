import { expect, test } from "@playwright/test";

// Keep CRUD fixtures isolated from the intentionally shared production list.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/achats", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "not_configured" }) }));
});

test("purchases can be managed, restored, filtered and exported", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Achats", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Les achats." })).toBeVisible();
  await page.getByLabel("Article *", { exact: true }).fill("Plaque BA13");
  await page.getByLabel("Quantité *").fill("10");
  await page.getByLabel("Prix unitaire TTC (€)", { exact: true }).fill("12.50");
  await page.getByLabel("Fournisseur", { exact: true }).fill("Magasin test");
  await page.getByRole("button", { name: "+ Ajouter à la liste" }).click();
  await expect(page.locator(".purchase-stats")).toContainText("125,00");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Plaque BA13", exact: true })).toBeVisible();
  await page.getByLabel("Statut de Plaque BA13", { exact: true }).selectOption("Reçu");
  await expect(page.locator(".purchase-stats")).toContainText("0,00");
  await page.getByRole("button", { name: "Modifier Plaque BA13", exact: true }).click();
  await page.getByLabel("Quantité *").fill("12");
  await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
  await expect(page.locator(".purchase-stats")).toContainText("150,00");
  await page.getByLabel("Filtrer par statut").selectOption("À acheter");
  await expect(page.getByText("Aucun article correspondant")).toBeVisible();
  await page.getByLabel("Filtrer par statut").selectOption("");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter en CSV" }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const csv = Buffer.concat(chunks).toString("utf8");
  expect(csv).toContain('"Plaque BA13"');
  expect(csv).toContain('"150,00"');
  await page.getByRole("button", { name: "Supprimer Plaque BA13", exact: true }).click();
  await page.getByRole("button", { name: "Conserver l’article" }).click();
  await expect(page.getByRole("heading", { name: "Plaque BA13", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Supprimer Plaque BA13", exact: true }).click();
  await page.getByRole("button", { name: "Confirmer la suppression", exact: true }).click();
  await page.reload();
  await expect(page.getByText("Le chantier commence ici.")).toBeVisible();
});

test("purchase form works on mobile without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/achats");
  await page.getByLabel("Article *", { exact: true }).fill("Peinture blanche");
  await page.getByRole("button", { name: "+ Ajouter à la liste" }).click();
  await expect(page.getByRole("heading", { name: "Peinture blanche", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/purchases-mobile.png", fullPage: true });
});

test("an unreadable saved list is preserved", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("maison1973.purchases.v1", "broken-data"));
  await page.goto("/achats");
  await expect(page.getByRole("alert").filter({ hasText: "Impossible de charger" })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Ajouter à la liste" })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem("maison1973.purchases.v1"))).toBe("broken-data");
});
