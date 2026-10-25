import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { emptyProject, parseProject, validateProject, removeCircuit, projectChecks, STORAGE_KEY } from "../app/te/lib/model";

test("earlier inventories merge synonyms and remap an assigned duplicate without losing sections", () => {
  const project = emptyProject();
  project.circuits = [{ id: "first", name: "Eclairage chambre parentale", room: "Chambre", floor: "Étage", usage: "Éclairage", cable: "1,5 mm²", load: "" }];
  project.secondPanel = { ...emptyProject(), circuits: [{ ...project.circuits[0], id: "second", name: "Lumieres chambre parentale", cable: "" }], devices: [{ id: "breaker", reference: "R9EFC610", rowId: "row-1", slot: 0, label: "", circuitId: "second", upstreamId: "" }] };
  const shared = validateProject(project);
  expect(shared.circuits).toEqual(project.circuits);
  expect(shared.secondPanel?.circuits).toEqual([]);
  expect(shared.secondPanel?.devices[0].circuitId).toBe("first");
  expect(projectChecks(shared).some(message => message.includes("aucun disjoncteur"))).toBe(false);
  expect(parseProject(JSON.stringify(shared))).toEqual(shared);
  expect(removeCircuit(shared, "first").secondPanel?.devices[0].circuitId).toBe("");
});

test("technical conflicts, duplicate assigned circuits and ID collisions are retained safely", () => {
  const project = emptyProject();
  project.circuits = [{ id: "same", name: "Prises cuisine", room: "Cuisine", floor: "", usage: "Prises", cable: "2,5 mm²", load: "" }];
  project.devices = [{ id: "d", reference: "R9EFC616", rowId: "row-1", slot: 0, label: "", circuitId: "same", upstreamId: "" }];
  project.secondPanel = { ...emptyProject(), circuits: [{ ...project.circuits[0] }], devices: [{ ...project.devices[0] }] };
  const shared = validateProject(project);
  expect(shared.circuits).toHaveLength(2);
  expect(shared.circuits[0].id).not.toBe(shared.circuits[1].id);
  expect(shared.secondPanel?.devices[0].circuitId).toBe(shared.circuits[1].id);
  expect(() => validateProject({ ...shared, secondPanel: { ...shared.secondPanel!, devices: [{ ...shared.secondPanel!.devices[0], circuitId: shared.circuits[0].id }] } })).toThrow("plusieurs");
  project.devices = []; project.secondPanel.devices = [];
  project.secondPanel.circuits[0].cable = "4 mm²";
  expect(validateProject(project).circuits).toHaveLength(2);
});

test("cleaned user backup contains seven general circuits and both intact panels", async () => {
  const project = parseProject(await readFile("exports/tableau-electrique-circuits-regroupes.json", "utf8"));
  expect(project.circuits).toHaveLength(7);
  expect(project.secondPanel?.circuits).toHaveLength(0);
  expect(project.devices).toHaveLength(8);
  expect(project.secondPanel?.devices).toHaveLength(9);
  expect(project.circuits.filter(circuit => circuit.cable)).toHaveLength(6);
});

test("general list persists across panel selection, assignment, deletion and restore", async ({ page }) => {
  const project = emptyProject();
  project.circuits = [{ id: "first", name: "VMC", room: "Combles", floor: "", usage: "Circuit spécialisé · VMC", cable: "", load: "" }];
  project.secondPanel = { ...emptyProject(), circuits: [{ ...project.circuits[0], id: "duplicate" }, { ...project.circuits[0], id: "other", name: "Prises garage", usage: "Prises" }], devices: [{ id: "breaker", reference: "R9EFC616", rowId: "row-1", slot: 0, label: "Garage", circuitId: "", upstreamId: "" }] };
  await page.addInitScript(({ key, project }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(project)); }, { key: STORAGE_KEY, project });
  await page.goto("/te");
  await expect(page.locator(".te-circuit")).toHaveCount(2);
  await page.getByRole("button", { name: "Garage, position 1", exact: true }).click();
  await expect(page.locator(".te-circuit")).toHaveCount(2);
  await page.getByLabel("Circuit associé", { exact: true }).selectOption("first");
  await expect(page.locator(".te-circuit").first().locator("summary")).toContainText("Tableau 2");
  await page.getByRole("button", { name: "Tableau 1", exact: true }).click();
  await expect(page.locator(".te-circuit")).toHaveCount(2);
  await page.reload();
  await expect(page.locator(".te-circuit")).toHaveCount(2);
  await page.getByRole("button", { name: "Tableau 2 · Tableau de la maison", exact: true }).click();
  await page.getByLabel("Nom du circuit", { exact: true }).fill("Nouveau circuit commun");
  await page.getByRole("button", { name: "+ Ajouter un circuit", exact: true }).click();
  await expect(page.locator(".te-circuit")).toHaveCount(3);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || "{}").circuits?.length, STORAGE_KEY)).toBe(3);
  page.on("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Supprimer le second tableau", exact: true }).click();
  await expect(page.locator(".te-circuit")).toHaveCount(3);
  await expect(page.locator(".te-circuit").first().locator("summary")).toContainText("Non affecté");
});
