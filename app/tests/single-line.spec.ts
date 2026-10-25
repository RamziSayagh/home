import { expect, test } from "@playwright/test";
import { emptyProject, type Project } from "../app/te/lib/model";

test("diagram follows cross-row protections, splits two departures and fits mobile/print", async ({ page }, testInfo) => {
  const project: Project = { ...emptyProject(), sharedCircuits: true };
  project.circuits = ["Éclairage", "Prises", "Circuit spécialisé · Lave-linge", "Circuit spécialisé · Volet roulant"].map((usage, i) => ({
    id: String(i), name: ["Éclairage du bureau", "Prises du bureau", "Lave-linge", "Volets de l’étage"][i],
    room: i < 2 ? "Bureau" : "Buanderie", floor: "Rez-de-chaussée", usage, cable: i === 0 ? "1,5 mm²" : "2,5 mm²", load: "",
  }));
  project.devices = [
    { id: "rcd", reference: "R9ERA263", rowId: "row-1", slot: 0, label: "Protection des pièces de vie", circuitId: "", upstreamId: "" },
    { id: "dj1", reference: "R9EFC610", rowId: "row-2", slot: 0, label: "", circuitId: "0", secondCircuitId: "1", upstreamId: "rcd" },
    { id: "dj2", reference: "R9EFC620", rowId: "row-2", slot: 1, label: "", circuitId: "2", upstreamId: "rcd" },
  ];
  await page.route("**/api/te/project", route => route.fulfill({ json: { revision: 1, project } }));
  await page.goto("/te");
  await page.getByRole("button", { name: /Schéma unifilaire/ }).click();
  const diagram = page.locator(".sld-document");
  await expect(diagram.locator(".sld-branch .sld-departure")).toHaveCount(2);
  await expect(diagram.locator(".sld-leaves").first().locator(".sld-circuit")).toHaveCount(2);
  await expect(diagram.locator(".sld-loose")).toHaveCount(0);
  await expect(diagram.locator(".sld-unassigned")).toContainText("Volets de l’étage");
  await diagram.screenshot({ path: testInfo.outputPath("diagram-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => diagram.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await diagram.screenshot({ path: testInfo.outputPath("diagram-mobile.png") });
  await page.emulateMedia({ media: "print" });
  await expect(diagram).toBeVisible();
});
