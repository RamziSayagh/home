import { expect, test } from "@playwright/test";
import { emptyProject } from "../app/te/lib/model";

test("circuit drag preview remains a compact single line", async ({ page }) => {
  const project = emptyProject();
  project.sharedCircuits = true;
  project.circuits = [{ id: "long", name: "Circuit avec un nom volontairement très long pour vérifier la troncature", room: "Bureau", floor: "Étage", usage: "Éclairage", load: "", cable: "1,5 mm²" }];
  await page.route("**/api/te/project", route => route.fulfill({ json: { revision: 1, project } }));
  await page.goto("/te");
  const handle = page.getByRole("button", { name: /Déplacer le circuit Circuit avec un nom/, exact: false });
  await handle.focus();
  await page.keyboard.press("Space");
  const preview = page.locator(".te-circuit-drag-preview");
  await expect(preview).toBeVisible();
  const box = await preview.boundingBox();
  expect(box?.height).toBeLessThanOrEqual(46);
  expect(box?.width).toBeLessThanOrEqual(280);
  await expect(preview).toHaveCSS("white-space", "nowrap");
});
