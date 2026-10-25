import { expect, test } from "@playwright/test";
import { emptyCommunication, emptyProject, firstFreeSlot, historyReducer, materialList, parseProject, placementError, projectChecks, removeCircuit, removeDevice, resizeProject, validateProject, type Device, type History } from "../app/te/lib/model";

function device(patch: Partial<Device> = {}): Device {
  return { id: "d1", reference: "R9EFC616", rowId: "row-1", slot: 0, label: "", circuitId: "", upstreamId: "", ...patch };
}

test("GTL round-trips as shared equipment, validates imports and contributes kit quantities", () => {
  const project = { ...emptyProject(), gtl: { units: [{ id: "gtl", reference: "R9HKT18" as const, quantity: 2, accessories: [] }], placements: { primary: "gtl", secondary: "", communication: "" } }, secondPanel: emptyProject() };
  expect(parseProject(JSON.stringify(project))).toEqual({ ...project, sharedCircuits: true });
  const material = materialList(project).find((item) => item.reference === "R9HKT18");
  expect(material?.quantity).toBe(2);
  expect(material?.source).toBe("https://www.se.com/fr/fr/product/R9HKT18/");
  expect(project.devices).toHaveLength(0);
  expect(materialList({ ...project, gtl: undefined }).some((item) => item.reference === "R9HKT18")).toBe(false);
  const compactGtl = { ...emptyProject(), gtl: { units: [{ id: "compact", reference: "R9HKT13" as const, quantity: 1, accessories: [{ reference: "R9H13540" as const, quantity: 1 }] }], placements: { primary: "compact", secondary: "", communication: "compact" } } };
  expect(parseProject(JSON.stringify(compactGtl))).toEqual({ ...compactGtl, sharedCircuits: true });
  expect(materialList(compactGtl).find((item) => item.reference === "R9HKT13")?.name).toContain("13 modules");
  expect(materialList(compactGtl).find((item) => item.reference === "R9H13540")?.quantity).toBe(1);
  expect(parseProject(JSON.stringify({ ...emptyProject(), gtl: { reference: "R9HKT18", quantity: 2 } })).gtl?.units[0].quantity).toBe(2);
  for (const quantity of [0, -1, 1.5, 1000, "1"]) expect(() => validateProject({ ...project, gtl: { units: [{ id: "gtl", reference: "R9HKT18", quantity, accessories: [] }], placements: { primary: "gtl", secondary: "", communication: "" } } })).toThrow();
  expect(() => validateProject({ ...project, gtl: { reference: "unknown", quantity: 1 } })).toThrow("GTL");
  expect(() => validateProject({ ...emptyProject(), secondPanel: project })).toThrow();
  expect(() => validateProject({ ...emptyProject(), secondPanel: { ...emptyProject(), gtl: project.gtl } })).toThrow("commun");
});

test("two panels round-trip, aggregate materials and reject invalid nested panels", () => {
  const first = emptyProject();
  first.devices = [device()];
  const second = { ...emptyProject(), name: "Garage", capacity: 18, devices: [device({ label: "Garage" })] };
  const project = { ...first, secondPanel: second };
  expect(parseProject(JSON.stringify(project))).toEqual({ ...project, sharedCircuits: true });
  expect(materialList(project).find((item) => item.reference === "R9EFC616")?.quantity).toBe(2);
  expect(materialList(project).filter((item) => item.name.startsWith("Coffret"))).toHaveLength(2);
  expect(projectChecks(project).some((message) => message.startsWith("Tableau 2 :"))).toBe(true);
  expect(() => validateProject({ ...first, secondPanel: { ...second, secondPanel: emptyProject() } })).toThrow("maximum");
  expect(() => validateProject({ ...first, secondPanel: { ...second, devices: [device({ slot: 18 })] } })).toThrow();
  expect(() => validateProject({ ...first, secondPanel: { ...second, communication: emptyCommunication() } })).toThrow("commun");
  expect(validateProject(first).secondPanel).toBeUndefined();
});

test("positioned distributions preserve legacy rows, quantities and both panels", () => {
  const project = emptyProject();
  project.rows[0].distributor = "R9EXHS05";
  expect(parseProject(JSON.stringify(project))).toEqual({ ...project, sharedCircuits: true });
  project.rows[0] = { ...project.rows[0], distributor: "", distributions: [{ id: "a", reference: "R9EXHS05", slot: 0 }, { id: "b", reference: "R9EXHS05", slot: 5 }] };
  project.secondPanel = { ...emptyProject(), rows: project.rows };
  expect(parseProject(JSON.stringify(project))).toEqual({ ...project, sharedCircuits: true });
  expect(materialList(project).find(m => m.reference === "R9EXHS05")?.quantity).toBe(4);
  project.rows[0].distributions![1] = { id: "b", reference: "R9EXHS08", slot: 5 };
  expect(parseProject(JSON.stringify(project))).toEqual({ ...project, sharedCircuits: true });
  expect(() => resizeProject(project, 1, 13)).not.toThrow();
  const wide = { ...emptyProject(), capacity: 18, rows: [{ id: "r", name: "R", distributor: "", distributions: [{ id: "a", reference: "R9EXHS05", slot: 13 }] }] };
  expect(() => resizeProject(wide, 1, 13)).toThrow("trop long");
  expect(() => resizeProject({ ...wide, rows: [...emptyProject().rows, ...wide.rows] }, 3, 18)).toThrow("Retirez");
});

test("distribution imports reject overlap, overflow, duplicates and ambiguous legacy fields", () => {
  const project = emptyProject();
  const valid = [{ id: "a", reference: "R9EXHS05", slot: 0 }, { id: "b", reference: "R9EXHS08", slot: 5 }];
  const withSegments = (distributions: unknown, distributor = "") => ({ ...project, rows: [{ ...project.rows[0], distributor, distributions }] });
  expect(() => validateProject(withSegments(valid))).not.toThrow();
  expect(() => validateProject(withSegments(valid, "R9EXHS05"))).toThrow("ambiguë");
  for (const patch of [{ slot: 4 }, { slot: 6 }, { slot: -1 }, { slot: 5.5 }, { reference: "unknown" }, { id: "a" }]) {
    expect(() => validateProject(withSegments([valid[0], { ...valid[1], ...patch }]))).toThrow();
  }
  expect(() => validateProject(withSegments(null))).toThrow();
  expect(() => validateProject(withSegments(Array(4).fill(valid[0])))).toThrow();
});

test("coverage detects gaps and devices spanning adjacent distribution segments", () => {
  const project = emptyProject();
  project.rows[0].distributions = [{ id: "a", reference: "R9EXHS05", slot: 0 }, { id: "b", reference: "R9EXHS08", slot: 5 }];
  project.devices = [device({ reference: "R9ERA263", slot: 4 })];
  expect(projectChecks(project).join(" ")).toContain("à cheval");
  project.devices = [device({ slot: 5 })];
  expect(projectChecks(project).join(" ")).not.toContain("couverture nominale");
  project.rows[0].distributions[1] = { id: "b", reference: "R9EXHS05", slot: 8 };
  expect(projectChecks(project).join(" ")).toContain("couverture nominale");
  project.rows[0].distributions = [{ id: "a", reference: "R9EXHC05", slot: 0 }, { id: "b", reference: "R9PXH213", slot: 5 }];
  project.capacity = 18;
  project.devices = [device(), device({ id: "xp", reference: "R9PFC616", slot: 5 })];
  expect(projectChecks(project).join(" ")).not.toContain("appareils embrochables XE présents");
  expect(projectChecks(project).join(" ")).not.toContain("alimentation séparée");
});

test("mixed XE and comb rows persist, aggregate and detect connection mismatches", () => {
  const project = emptyProject();
  project.rows[0].distributor = "R9EXHC13";
  project.rows[1].distributor = "R9PXH213";
  project.devices = [device(), device({ id: "fsi", rowId: "row-2", reference: "R9PRF263" }), device({ id: "xp", rowId: "row-2", slot: 2, reference: "R9PFC616", upstreamId: "fsi" })];
  expect(parseProject(JSON.stringify(project))).toEqual({ ...project, sharedCircuits: true });
  expect(materialList(project).find(m => m.reference === "R9PXH213")?.quantity).toBe(1);
  expect(projectChecks(project).join(" ")).not.toContain("appareils embrochables XE présents");
  const mixed = { ...project, devices: [...project.devices, device({ id: "xe", rowId: "row-2", slot: 3 })] };
  expect(projectChecks(mixed).join(" ")).toContain("appareils embrochables XE présents");
  expect(projectChecks({ ...project, rows: project.rows.map(r => ({ ...r, distributor: "R9EXHC13" })) }).join(" ")).toContain("alimentation séparée");
  expect(() => validateProject({ ...project, rows: project.rows.map(r => ({ ...r, distributor: "R9PXH218" })) })).toThrow("trop long");
  expect(() => resizeProject({ ...emptyProject(), capacity: 18, rows: project.rows.map(r => ({ ...r, distributor: "R9PXH218" })) }, 3, 13)).toThrow("trop long");
  project.secondPanel = { ...emptyProject(), rows: project.rows };
  expect(materialList(project).find(m => m.reference === "R9PXH213")?.quantity).toBe(2);
  expect(parseProject(JSON.stringify(project)).secondPanel?.rows[1].distributor).toBe("R9PXH213");
});

test("type B differential preserves upstream assignments and uses four slots", () => {
  const project = emptyProject();
  project.devices = [device({ reference: "A9Z61263" }), device({ id: "d2", slot: 4, upstreamId: "d1" })];
  expect(parseProject(JSON.stringify(project))).toEqual({ ...project, sharedCircuits: true });
  expect(placementError(project, "R9EFC616", "row-1", 3)).toContain("occupé");
  expect(placementError(project, "A9Z61263", "row-2", 9)).toBeNull();
  expect(placementError(project, "A9Z61263", "row-2", 10)).toContain("dépasse");
  expect(materialList(project).find(m => m.reference === "A9Z61263")?.quantity).toBe(1);
});

test("40 A Acti9 breaker occupies two slots and persists with its upstream differential", () => {
  const project = emptyProject();
  project.devices = [device({ reference: "A9Z51240" }), device({ id: "breaker", reference: "A9F77240", slot: 4, upstreamId: "d1" })];
  const saved = parseProject(JSON.stringify(project));
  expect(saved.devices).toEqual(project.devices);
  expect(placementError(saved, "R9EFC616", "row-1", 5)).toContain("occupé");
  expect(placementError(saved, "A9F77240", "row-2", 11)).toBeNull();
  expect(placementError(saved, "A9F77240", "row-2", 12)).toContain("dépasse");
  expect(materialList(saved).find(item => item.reference === "A9F77240")?.quantity).toBe(1);
});

for (const [reference, type] of [["A9Z51240", "B-EV"], ["A9Z61240", "B-SI"]]) test(`${reference} 40 A differential imports, occupies four slots and serves as upstream protection`, () => {
  const project = emptyProject();
  project.devices = [device({ reference }), device({ id: "breaker", slot: 4, upstreamId: "d1" })];
  const saved = parseProject(JSON.stringify(project));
  expect(saved.devices).toEqual(project.devices);
  expect(placementError(saved, "R9EFC616", "row-1", 3)).toContain("occupé");
  expect(placementError(saved, reference, "row-2", 9)).toBeNull();
  expect(placementError(saved, reference, "row-2", 10)).toContain("dépasse");
  expect(materialList(saved).find(item => item.reference === reference)?.name).toBe(`Différentiel 40 A · type ${type}`);
});

test("impulse relays occupy one slot, export both variants and cannot replace protection", () => {
  const project = emptyProject();
  project.devices = [device({ reference: "R9PCL216" }), device({ id: "d2", slot: 1, reference: "R9PCL2S" })];
  expect(parseProject(JSON.stringify(project))).toEqual({ ...project, sharedCircuits: true });
  expect(placementError(project, "R9EFC616", "row-1", 2)).toBeNull();
  expect(placementError(project, "R9PCL2S", "row-1", 1)).toContain("occupé");
  for (const reference of ["R9PCL216", "R9PCL2S"]) {
    expect(materialList(project).find((m) => m.reference === reference)?.quantity).toBe(1);
    expect(placementError(project, reference, "row-2", 12)).toBeNull();
    expect(() => validateProject({ ...project, devices: [device({ reference, upstreamId: "missing" })] })).toThrow("amont");
  }
  expect(() => validateProject({ ...project, devices: [...project.devices, device({ id: "d3", slot: 2, upstreamId: "d1" })] })).toThrow("amont");
});

test("surge protection occupies two modules and cannot act as circuit protection", () => {
  const project = emptyProject();
  project.devices = [device({ reference: "R9PLC" })];
  expect(parseProject(JSON.stringify(project))).toEqual({ ...project, sharedCircuits: true });
  expect(placementError(project, "R9EFC616", "row-1", 1)).toContain("occupé");
  expect(placementError(project, "R9PLC", "row-2", 12)).toContain("dépasse");
  expect(materialList(project).find((m) => m.reference === "R9PLC")?.quantity).toBe(1);
  expect(projectChecks(project).some((m) => m.includes("circuit non affecté"))).toBe(false);
  project.circuits = [{ id: "c1", name: "Salon", room: "", floor: "", usage: "", load: "", cable: "" }];
  expect(() => validateProject({ ...project, devices: [device({ reference: "R9PLC", circuitId: "c1" })] })).toThrow("circuit");
  expect(() => validateProject({ ...project, devices: [...project.devices, device({ id: "d2", slot: 2, upstreamId: "d1" })] })).toThrow("amont");
});

test("communication cabinet imports safely and contributes only enabled material", () => {
  const project = { ...emptyProject(), communication: { ...emptyCommunication(), reference: "Custom cabinet", switchPorts: 8, box: true, ports: [{ id: "p1", room: "Bureau", label: "PC" }] } };
  expect(parseProject(JSON.stringify(project))).toEqual({ ...project, sharedCircuits: true });
  expect(materialList(project).find((m) => m.name === "Coffret de communication")?.reference).toBe("Custom cabinet");
  expect(materialList(project).find((m) => m.name.startsWith("Liaison RJ45"))?.quantity).toBe(1);
  expect(materialList({ ...project, communication: { ...project.communication, enabled: false } }).some((m) => m.name === "Coffret de communication")).toBe(false);
  for (const patch of [{ switchPorts: -1 }, { switchPorts: 1.5 }, { box: "true" }, { ports: Array(49).fill(project.communication.ports[0]) }, { ports: [project.communication.ports[0], project.communication.ports[0]] }]) {
    expect(() => validateProject({ ...project, communication: { ...project.communication, ...patch } })).toThrow();
  }
  expect(parseProject(JSON.stringify(emptyProject())).communication).toBeUndefined();
});

test("known Resi9 Connect cabinets provide their manufacturer source without a duplicate switch", () => {
  const project = { ...emptyProject(), communication: { ...emptyCommunication(), reference: "R9H18402VDIXS", grade: "Grade 3TV · Cat 6A", switchPorts: 9 } };
  const materials = materialList(project);
  expect(materials.find((material) => material.name === "Coffret de communication")).toMatchObject({ reference: "R9H18402VDIXS", source: "https://www.se.com/fr/fr/product/R9H18402VDIXS/resi9-connect-coffret-18m2r-switch-9-ports-poe-2-pc-grade-3tv-8xrj45-cat6a/" });
  expect(materials.some((material) => material.name.startsWith("Switch réseau"))).toBe(false);
});

test("two circuits persist, reject duplicate assignments, and unlink independently", () => {
  const project = emptyProject();
  project.circuits = ["c1", "c2"].map((id) => ({ id, name: id, room: "", floor: "", usage: "", load: "", cable: "" }));
  project.devices = [device({ circuitId: "c1", secondCircuitId: "c2" })];
  expect(parseProject(JSON.stringify(project))).toEqual({ ...project, sharedCircuits: true });
  expect(projectChecks(project).filter((message) => message.includes("aucun disjoncteur"))).toEqual([]);
  expect(() => validateProject({ ...project, devices: [device({ circuitId: "c1", secondCircuitId: "c1" })] })).toThrow("plusieurs");
  expect(() => validateProject({ ...project, devices: [...project.devices, device({ id: "d2", slot: 1, circuitId: "c2" })] })).toThrow("plusieurs");
  expect(() => validateProject({ ...project, devices: [device({ reference: "R9EFC632", circuitId: "c1", secondCircuitId: "c2" })] })).toThrow("second départ");
  expect(validateProject(removeCircuit(project, "c2")).devices[0].secondCircuitId).toBe("");
  expect(validateProject(removeCircuit(project, "c1")).devices[0].secondCircuitId).toBe("c2");
  expect(validateProject({ ...project, schemaVersion: 1 }).schemaVersion).toBe(2);
});

test("placement honors different device widths and row boundaries", () => {
  const project = emptyProject();
  project.devices.push(device({ reference: "R9ERA263", slot: 2 }));
  expect(placementError(project, "R9EFC616", "row-1", 3)).toContain("occupé");
  expect(placementError(project, "R9ERA263", "row-1", 12)).toContain("dépasse");
  expect(placementError(project, "R9EFC616", "row-1", 12)).toBeNull();
  expect(placementError(project, "R9EFC616", "row-1", -1)).toBeTruthy();
  expect(placementError(project, "R9EFC616", "row-1", 0.5)).toBeTruthy();
  expect(placementError(project, "R9ERA263", "row-1", 2, "d1")).toBeNull();
  expect(firstFreeSlot(project, "R9ERA263", "row-1")).toBe(0);
});

test("a full row has no insertion position", () => {
  const project = emptyProject();
  project.devices = Array.from({ length: 13 }, (_, slot) => device({ id: `d${slot}`, slot }));
  expect(firstFreeSlot(project, "R9EFC616", "row-1")).toBeNull();
  expect(firstFreeSlot(project, "R9EFC616", "row-2")).toBe(0);
});

test("enclosure shrink preserves occupied rows and distributors", () => {
  const project = emptyProject();
  project.capacity = 18;
  project.devices.push(device({ rowId: "row-3", slot: 16 }));
  expect(() => resizeProject(project, 2, 18)).toThrow("Déplacez");
  expect(() => resizeProject(project, 3, 13)).toThrow("Déplacez");
  project.devices = [];
  project.rows[0].distributor = "R9EXHC18";
  expect(() => resizeProject(project, 3, 13)).toThrow("répartiteur");
  project.rows[0].distributor = "";
  project.rows[2].distributor = "R9EXHC13";
  expect(() => resizeProject(project, 2, 13)).toThrow("répartiteurs");
  expect(resizeProject(project, 4, 18).rows).toHaveLength(4);
});

test("imports round-trip and reject invalid syntax, size, versions, and dimensions", () => {
  const project = emptyProject();
  expect(parseProject(JSON.stringify(project))).toEqual({ ...project, sharedCircuits: true });
  expect(() => parseProject("{")).toThrow("JSON");
  expect(() => parseProject(" ".repeat(1_000_001))).toThrow("1 Mo");
  expect(() => validateProject({ ...project, catalogVersion: "future" })).toThrow("Version");
  expect(() => validateProject({ ...project, schemaVersion: 3 })).toThrow("Version");
  expect(() => validateProject({ ...project, capacity: 14 })).toThrow("Largeur");
  expect(() => validateProject({ ...project, rows: [] })).toThrow("rangée");
});

test("imports reject unknown references, duplicate IDs, overlaps and broken relations", () => {
  const project = emptyProject();
  for (const reference of ["unknown", "toString", "__proto__"]) expect(() => validateProject({ ...project, devices: [device({ reference })] })).toThrow("inconnue");
  expect(() => validateProject({ ...project, devices: [device(), device()] })).toThrow("double");
  expect(() => validateProject({ ...project, devices: [device(), device({ id: "d2" })] })).toThrow("occupé");
  expect(() => validateProject({ ...project, devices: [device({ circuitId: "missing" })] })).toThrow("circuit");
  expect(() => validateProject({ ...project, devices: [device({ upstreamId: "missing" })] })).toThrow("amont");
  expect(() => validateProject({ ...project, devices: [device({ rowId: "missing" })] })).toThrow("rangée");
  expect(() => validateProject({ ...project, rows: project.rows.map((r) => ({ ...r, distributor: "R9EXHC18" })) })).toThrow("trop long");
});

test("one circuit cannot be assigned to multiple breakers or a differential", () => {
  const project = emptyProject();
  project.circuits = [{ id: "c1", name: "Salon", room: "", floor: "", usage: "", load: "", cable: "" }];
  expect(() => validateProject({ ...project, devices: [device({ circuitId: "c1" }), device({ id: "d2", slot: 1, circuitId: "c1" })] })).toThrow("plusieurs");
  expect(() => validateProject({ ...project, devices: [device({ reference: "R9ERA263", circuitId: "c1" })] })).toThrow("circuit");
});

test("removing a differential clears upstream references and preserves circuits", () => {
  const project = emptyProject();
  project.devices = [device({ reference: "R9ERA263" }), device({ id: "d2", slot: 2, upstreamId: "d1" })];
  const next = removeDevice(project, "d1");
  expect(next.devices).toHaveLength(1);
  expect(next.devices[0].upstreamId).toBe("");
  expect(project.devices).toHaveLength(2);
  expect(validateProject(next)).toEqual({ ...next, sharedCircuits: true });
});

test("undo and redo restore whole projects and a new edit clears redo", () => {
  const first = emptyProject();
  const second = { ...first, name: "Second" };
  let history: History = { past: [], present: first, future: [] };
  history = historyReducer(history, { type: "commit", project: second });
  history = historyReducer(history, { type: "undo" });
  expect(history.present).toEqual(first);
  expect(historyReducer(history, { type: "redo" }).present).toEqual(second);
  history = historyReducer(history, { type: "commit", project: { ...first, name: "Third" } });
  expect(history.future).toEqual([]);
  expect(historyReducer(history, { type: "restore", project: first }).past).toEqual([]);
});

test("material quantities include enclosure and distributors without extra rail occupancy", () => {
  const project = emptyProject();
  project.devices = [device(), device({ id: "d2", slot: 1 })];
  project.rows[0].distributor = "R9EXHC13";
  project.rows[1].distributor = "R9EXHC13";
  project.accessories = [{ id: "a1", reference: "manual", name: "Bornier", quantity: 2 }];
  const materials = materialList(project);
  expect(materials.find((m) => m.reference === "R9H13403")?.quantity).toBe(1);
  expect(materials.find((m) => m.reference === "R9EFC616")?.quantity).toBe(2);
  expect(materials.find((m) => m.reference === "R9EXHC13")?.quantity).toBe(2);
  expect(materials.find((m) => m.reference === "manual")?.status).toContain("manuelle");
  expect(project.devices).toHaveLength(2);
});

test("checks distinguish missing circuits, distributors and nominal coverage", () => {
  const project = emptyProject();
  project.capacity = 18;
  project.rows[0].distributor = "R9EXHS13";
  project.devices = [device({ slot: 17 })];
  const checks = projectChecks(project).join(" ");
  expect(checks).toContain("sans connecteur");
  expect(checks).toContain("couverture nominale");
  expect(checks).toContain("circuit non affecté");
  expect(checks).toContain("amont non défini");
  expect(checks).toContain("non validés");
});
