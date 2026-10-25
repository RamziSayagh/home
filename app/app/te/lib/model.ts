import { CATALOG_VERSION, communicationCabinet, DISTRIBUTORS, enclosureReference, GTL_ACCESSORIES, GTL_OPTIONS, manufacturerUrl, PRODUCT_BY_REF, type GtlAccessoryReference, type GtlReference } from "../data/catalog";
import { shareCircuits } from "./shared-circuits";

export type Distribution = { id: string; reference: string; slot: number };
export type Row = { id: string; name: string; distributor: string; distributions?: Distribution[] };
export type Circuit = { id: string; name: string; room: string; floor: string; usage: string; load: string; cable: string };
export type Device = { id: string; reference: string; rowId: string; slot: number; label: string; circuitId: string; secondCircuitId?: string; upstreamId: string };
export type Accessory = { id: string; reference: string; name: string; quantity: number };
export type GtlAccessory = { reference: GtlAccessoryReference; quantity: number };
export type GtlUnit = { id: string; reference: GtlReference; quantity: number; accessories: GtlAccessory[] };
export type Gtl = { units: GtlUnit[]; placements: { primary: string; secondary: string; communication: string }; heightsCm?: { primary: number; secondary: number; communication: number } };
export type NetworkPort = { id: string; room: string; label: string };
export type CommunicationCabinet = { enabled: boolean; reference: string; location: string; grade: string; ports: NetworkPort[]; switchPorts: number; box: boolean; optical: boolean; dti: boolean };
export type Project = { schemaVersion: 2; catalogVersion: string; name: string; capacity: number; rows: Row[]; circuits: Circuit[]; sharedCircuits?: true; devices: Device[]; accessories: Accessory[]; communication?: CommunicationCabinet; gtl?: Gtl; secondPanel?: Project };
export type History = { past: Project[]; present: Project; future: Project[] };
export type HistoryAction = { type: "commit" | "restore"; project: Project } | { type: "undo" | "redo" };

export const STORAGE_KEY = "maison1973.electrical-panel.v1";
export const uid = () => crypto.randomUUID();
export const emptyCommunication = (): CommunicationCabinet => ({ enabled: true, reference: "", location: "", grade: "", ports: [], switchPorts: 0, box: false, optical: false, dti: false });

// Two direct outgoing conductors per terminal are documented for XE 2–20 A.
export const supportsTwoDepartures = (reference: string) => ["R9EFC602", "R9EFC610", "R9EFC616", "R9EFC620"].includes(reference);
export const deviceCircuitIds = (device: Device): string[] => [device.circuitId, device.secondCircuitId ?? ""].filter(Boolean);

// Preserve legacy rows as a single distribution starting at the row origin.
export const rowDistributions = (row: Row): Distribution[] => row.distributions ?? (row.distributor ? [{ id: "legacy", reference: row.distributor, slot: 0 }] : []);

export function distributionPlacementError(row: Row, reference: string, slot: number, capacity: number, ignoreId = ""): string | null {
  const product = DISTRIBUTORS.find(d => d.reference === reference);
  if (!product) return "Répartiteur ou peigne inconnu.";
  if (!Number.isInteger(slot) || slot < 0 || slot + product.modules > capacity) return "Répartiteur ou peigne trop long : il dépasse la rangée à cette position.";
  if (rowDistributions(row).some(d => d.id !== ignoreId && slot < d.slot + (DISTRIBUTORS.find(p => p.reference === d.reference)?.modules ?? 0) && slot + product.modules > d.slot)) return "Les répartiteurs ou peignes se chevauchent. Choisissez une autre position.";
  return null;
}

export function firstFreeDistributionSlot(row: Row, reference: string, capacity: number): number | null {
  for (let slot = 0; slot < capacity; slot++) if (!distributionPlacementError(row, reference, slot, capacity)) return slot;
  return null;
}

export function removeCircuit(project: Project, id: string): Project {
  return { ...project, circuits: project.circuits.filter((c) => c.id !== id), devices: project.devices.map((d) => ({ ...d, circuitId: d.circuitId === id ? "" : d.circuitId, ...(d.secondCircuitId === id ? { secondCircuitId: "" } : {}) })), ...(project.secondPanel ? { secondPanel: removeCircuit(project.secondPanel, id) } : {}) };
}

export function emptyProject(): Project {
  return { schemaVersion: 2, catalogVersion: CATALOG_VERSION, name: "Tableau de la maison", capacity: 13, rows: [1, 2, 3].map((n) => ({ id: `row-${n}`, name: `Rangée ${n}`, distributor: "" })), circuits: [], devices: [], accessories: [] };
}

export function historyReducer(state: History, action: HistoryAction): History {
  if (action.type === "restore") return { past: [], present: action.project, future: [] };
  if (action.type === "commit") {
    if (JSON.stringify(state.present) === JSON.stringify(action.project)) return state;
    return { past: [...state.past.slice(-49), state.present], present: action.project, future: [] };
  }
  if (action.type === "undo" && state.past.length) return { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future] };
  if (action.type === "redo" && state.future.length) return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) };
  return state;
}

export function placementError(project: Project, reference: string, rowId: string, slot: number, ignoreId = ""): string | null {
  const product = PRODUCT_BY_REF[reference];
  if (!product || !project.rows.some((r) => r.id === rowId)) return "Appareil ou rangée introuvable.";
  if (!Number.isInteger(slot) || slot < 0 || slot + product.modules > project.capacity) return "L’appareil dépasse la capacité de cette rangée.";
  if (project.devices.some((d) => d.id !== ignoreId && d.rowId === rowId && slot < d.slot + PRODUCT_BY_REF[d.reference].modules && slot + product.modules > d.slot)) return "Cet emplacement est occupé. Choisissez des modules libres.";
  return null;
}

export function firstFreeSlot(project: Project, reference: string, rowId: string): number | null {
  for (let slot = 0; slot < project.capacity; slot++) if (!placementError(project, reference, rowId, slot)) return slot;
  return null;
}

export function resizeProject(project: Project, count: number, capacity: number): Project {
  if (!Number.isInteger(count) || count < 1 || count > 6 || ![13, 18].includes(capacity)) throw new Error("Dimensions de coffret non prises en charge.");
  const removedRows = project.rows.slice(count);
  if (project.devices.some((d) => removedRows.some((r) => r.id === d.rowId) || d.slot + PRODUCT_BY_REF[d.reference].modules > capacity)) throw new Error("Déplacez les appareils concernés avant de réduire le coffret.");
  if (removedRows.some((r) => rowDistributions(r).length)) throw new Error("Retirez les répartiteurs ou peignes des rangées à supprimer.");
  if (project.rows.slice(0, count).some((r) => rowDistributions(r).some(d => d.slot + (DISTRIBUTORS.find(p => p.reference === d.reference)?.modules ?? 0) > capacity))) throw new Error("Déplacez ou retirez le répartiteur ou peigne trop long avant de réduire la largeur.");
  const rows = project.rows.slice(0, count);
  while (rows.length < count) rows.push({ id: uid(), name: `Rangée ${rows.length + 1}`, distributor: "" });
  return { ...project, capacity, rows };
}

// Reconstruct from unknown data. Imported files cannot provide executable values or catalog URLs.
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Objet de projet invalide.");
  return value as Record<string, unknown>;
}
function string(value: unknown, max = 160, required = false): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) throw new Error("Texte absent ou trop long dans le projet.");
  return value;
}
function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) throw new Error("Valeur numérique invalide dans le projet.");
  return value;
}
function list<T>(value: unknown, max: number, parse: (v: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(value) || value.length > max) throw new Error("Liste de projet invalide ou trop volumineuse.");
  return value.map((v) => parse(record(v)));
}
function unique(items: { id: string }[]) {
  if (new Set(items.map((i) => i.id)).size !== items.length) throw new Error("Identifiants en double dans le projet.");
}

export function validateProject(value: unknown, allowSecondPanel = true, commonCircuits?: Circuit[]): Project {
  const input = record(value);
  if (input.secondPanel !== undefined && !allowSecondPanel) throw new Error("Deux tableaux maximum par projet.");
  if (![1, 2].includes(input.schemaVersion as number) || input.catalogVersion !== CATALOG_VERSION) throw new Error("Version de projet ou de catalogue non prise en charge.");
  const capacity = integer(input.capacity, 13, 18);
  if (![13, 18].includes(capacity)) throw new Error("Largeur du coffret invalide.");
  const rows = list(input.rows, 6, (r): Row => ({ id: string(r.id, 80, true), name: string(r.name), distributor: string(r.distributor, 40), ...(r.distributions !== undefined ? { distributions: list(r.distributions, 3, d => ({ id: string(d.id, 80, true), reference: string(d.reference, 40, true), slot: integer(d.slot, 0, capacity - 1) })) } : {}) }));
  if (!rows.length) throw new Error("Le coffret doit comporter au moins une rangée.");
  const circuits = list(input.circuits, input.sharedCircuits === true ? 600 : 300, (c): Circuit => ({ id: string(c.id, 80, true), name: string(c.name), room: string(c.room), floor: string(c.floor), usage: string(c.usage), load: string(c.load), cable: string(c.cable) }));
  const devices = list(input.devices, 108, (d): Device => ({ id: string(d.id, 80, true), reference: string(d.reference, 40, true), rowId: string(d.rowId, 80, true), slot: integer(d.slot, 0, capacity - 1), label: string(d.label), circuitId: string(d.circuitId, 80), ...(d.secondCircuitId !== undefined ? { secondCircuitId: string(d.secondCircuitId, 80) } : {}), upstreamId: string(d.upstreamId, 80) }));
  const accessories = list(input.accessories, 200, (a): Accessory => ({ id: string(a.id, 80, true), reference: string(a.reference, 80), name: string(a.name), quantity: integer(a.quantity, 1, 999) }));
  [rows, circuits, devices, accessories].forEach(unique);
  if (devices.some((d) => !PRODUCT_BY_REF[d.reference])) throw new Error("Référence d’appareil inconnue dans le catalogue.");
  const project: Project = { schemaVersion: 2, catalogVersion: CATALOG_VERSION, name: string(input.name, 120), capacity, rows, circuits, devices, accessories };
  if (input.sharedCircuits !== undefined) {
    if (input.sharedCircuits !== true || !allowSecondPanel) throw new Error("Inventaire commun des circuits invalide.");
    project.sharedCircuits = true;
  }
  if (commonCircuits && circuits.length) throw new Error("Les circuits appartiennent à la liste générale.");
  if (input.communication !== undefined) {
    const c = record(input.communication);
    for (const key of ["enabled", "box", "optical", "dti"]) if (typeof c[key] !== "boolean") throw new Error("Équipement du coffret de communication invalide.");
    const ports = list(c.ports, 48, (p): NetworkPort => ({ id: string(p.id, 80, true), room: string(p.room), label: string(p.label) }));
    unique(ports);
    project.communication = { enabled: c.enabled as boolean, reference: string(c.reference, 80), location: string(c.location), grade: string(c.grade, 80), ports, switchPorts: integer(c.switchPorts, 0, 48), box: c.box as boolean, optical: c.optical as boolean, dti: c.dti as boolean };
  }
  if (input.gtl !== undefined) {
    const gtl = record(input.gtl);
    // Read the earlier single-GTL form without invalidating saved projects.
    if (gtl.units === undefined) {
      if (gtl.reference !== "R9HKT13" && gtl.reference !== "R9HKT18") throw new Error("Référence de GTL non prise en charge.");
      project.gtl = { units: [{ id: "legacy-gtl", reference: gtl.reference, quantity: integer(gtl.quantity, 1, 999), accessories: [] }], placements: { primary: "legacy-gtl", secondary: "", communication: "" } };
    } else {
      const units = list(gtl.units, 2, (unit): GtlUnit => {
        const reference = string(unit.reference, 40, true);
        if (!GTL_OPTIONS.some(option => option.reference === reference)) throw new Error("Référence de GTL non prise en charge.");
        const accessories = list(unit.accessories, 7, (accessory): GtlAccessory => {
          const accessoryReference = string(accessory.reference, 40, true);
          if (!GTL_ACCESSORIES.some(option => option.reference === accessoryReference && option.compatibleWith === reference)) throw new Error("Accessoire de GTL non compatible.");
          return { reference: accessoryReference as GtlAccessoryReference, quantity: integer(accessory.quantity, 1, 99) };
        });
        if (new Set(accessories.map(accessory => accessory.reference)).size !== accessories.length) throw new Error("Accessoire de GTL en double.");
        return { id: string(unit.id, 80, true), reference: reference as GtlReference, quantity: integer(unit.quantity, 1, 999), accessories };
      });
      if (!units.length) throw new Error("Ajoutez au moins une GTL ou désactivez cette étape.");
      unique(units);
      const placements = record(gtl.placements);
      const primary = string(placements.primary, 80);
      const secondary = string(placements.secondary, 80);
      const communication = placements.communication === undefined ? "" : string(placements.communication, 80);
      if ([primary, secondary, communication].some(id => id && !units.some(unit => unit.id === id))) throw new Error("Position sur GTL inconnue.");
      project.gtl = { units, placements: { primary, secondary, communication } };
    }
  }
  if (project.gtl && record(input.gtl).heightsCm !== undefined) {
    const heights = record(record(input.gtl).heightsCm);
    project.gtl.heightsCm = { primary: integer(heights.primary, 0, 240), secondary: integer(heights.secondary, 0, 240), communication: integer(heights.communication, 0, 240) };
  }
  if (input.secondPanel !== undefined) {
    project.secondPanel = validateProject(input.secondPanel, false, project.sharedCircuits ? circuits : undefined);
    if (project.secondPanel.communication !== undefined) throw new Error("Le coffret de communication appartient au projet commun.");
    if (project.secondPanel.gtl !== undefined) throw new Error("La GTL appartient au projet commun.");
  }
  for (const row of rows) {
    if (row.distributions !== undefined && row.distributor) throw new Error("Distribution ambiguë : ne mélangez pas l’ancien répartiteur et la liste de distributions.");
    const distributions = rowDistributions(row);
    unique(distributions);
    for (const d of distributions) {
      const error = distributionPlacementError(row, d.reference, d.slot, capacity, d.id);
      if (error) throw new Error(error);
    }
  }
  for (const device of devices) {
    const error = placementError(project, device.reference, device.rowId, device.slot, device.id);
    if (error) throw new Error(error);
    const product = PRODUCT_BY_REF[device.reference];
    if (deviceCircuitIds(device).some((id) => !(commonCircuits ?? circuits).some((c) => c.id === id) || product.kind !== "breaker")) throw new Error("Affectation de circuit invalide.");
    if (device.secondCircuitId && !supportsTwoDepartures(device.reference)) throw new Error("Retirez le second départ : deux départs directs ne sont pas documentés pour cet appareil.");
    if (device.upstreamId && (product.kind !== "breaker" || !devices.some((d) => d.id === device.upstreamId && PRODUCT_BY_REF[d.reference]?.kind === "rcd"))) throw new Error("Protection amont invalide.");
  }
  const assigned = devices.flatMap(deviceCircuitIds);
  if (project.sharedCircuits && project.secondPanel) assigned.push(...project.secondPanel.devices.flatMap(deviceCircuitIds));
  if (new Set(assigned).size !== assigned.length) throw new Error("Un circuit est affecté à plusieurs départs ou disjoncteurs.");
  if (allowSecondPanel && !project.sharedCircuits) return validateProject(shareCircuits(project));
  return project;
}

export function parseProject(text: string): Project {
  if (text.length > 1_000_000) throw new Error("Le fichier dépasse la limite de 1 Mo.");
  try { return validateProject(JSON.parse(text)); }
  catch (error) { if (error instanceof SyntaxError) throw new Error("Le fichier ne contient pas un JSON valide."); throw error; }
}

export function removeDevice(project: Project, id: string): Project {
  return { ...project, devices: project.devices.filter((d) => d.id !== id).map((d) => d.upstreamId === id ? { ...d, upstreamId: "" } : d) };
}

export function projectChecks(project: Project): string[] {
  const messages: string[] = [];
  if (!project.devices.length) messages.push("Le tableau est vide : ajoutez vos premiers appareils.");
  for (const row of project.rows) {
    const rowDevices = project.devices.filter((d) => d.rowId === row.id);
    const distributions = rowDistributions(row);
    if (rowDevices.length && !distributions.length) messages.push(`${row.name} : distribution à choisir (répartiteur XE ou peigne XP).`);
    if (distributions.length && rowDevices.some(d => !distributions.some(s => d.slot >= s.slot && d.slot + PRODUCT_BY_REF[d.reference].modules <= s.slot + DISTRIBUTORS.find(p => p.reference === s.reference)!.modules))) messages.push(`${row.name} : des appareils dépassent la couverture nominale d’un répartiteur ou peigne, ou sont à cheval entre deux segments.`);
    if (distributions.length > 1) messages.push(`${row.name} : plusieurs segments de distribution ; alimentation et protection de chaque segment à préciser, sans liaison automatique entre eux.`);
    for (const segment of distributions) {
      const distributor = DISTRIBUTORS.find(d => d.reference === segment.reference)!;
      const devices = rowDevices.filter(d => d.slot < segment.slot + distributor.modules && d.slot + PRODUCT_BY_REF[d.reference].modules > segment.slot);
      const segmentLabel = `${row.name} · ${segment.reference} (positions ${segment.slot + 1}–${segment.slot + distributor.modules})`;
      if (distributor.kind === "xe" && !distributor.connector) messages.push(`${segmentLabel} : répartiteur sans connecteur, alimentation et accessoires à compléter et vérifier.`);
      if (distributor.kind === "comb") {
        messages.push(`${segmentLabel} : peigne XP, alimentation, position des dents, découpe et cache-dents à vérifier ; la couverture affichée ne valide pas le raccordement.`);
        if (devices.some(d => !PRODUCT_BY_REF[d.reference].range)) messages.push(`${segmentLabel} : appareils embrochables XE présents avec un peigne XP ; choisissez les variantes peignables ou prévoyez une distribution distincte.`);
        if (devices.some(d => PRODUCT_BY_REF[d.reference].range === "Acti9 iID")) messages.push(`${segmentLabel} : compatibilité du différentiel Acti9 avec le peigne XP non établie ; liaison à étudier.`);
      }
      if (distributor.kind === "xe" && devices.some(d => PRODUCT_BY_REF[d.reference].range && ["breaker", "rcd"].includes(PRODUCT_BY_REF[d.reference].kind))) messages.push(`${segmentLabel} : appareils à bornes présents avec un répartiteur XE ; leur alimentation séparée reste à prévoir.`);
    }
  }
  for (const device of project.devices) {
    if (PRODUCT_BY_REF[device.reference].kind === "impulse") messages.push(`${device.label || PRODUCT_BY_REF[device.reference].name} : circuit commandé, boutons-poussoirs et protection à préciser selon la notice constructeur.`);
    if (PRODUCT_BY_REF[device.reference].kind === "spd") messages.push(`${device.label || PRODUCT_BY_REF[device.reference].name} : raccordement et liaison à la terre à vérifier selon la notice constructeur.`);
    if (PRODUCT_BY_REF[device.reference].kind !== "breaker") continue;
    const label = device.label || PRODUCT_BY_REF[device.reference].name;
    if (!deviceCircuitIds(device).length) messages.push(`${label} : circuit non affecté.`);
    if (deviceCircuitIds(device).length === 2) messages.push(`${label} : deux départs sous une protection commune ; vérifier la charge totale, les sections et les usages compatibles.`);
    if (!device.upstreamId) messages.push(`${label} : différentiel amont non défini.`);
    else if (project.devices.find((d) => d.id === device.upstreamId)?.rowId !== device.rowId) messages.push(`${label} : liaison avec un différentiel d’une autre rangée à étudier.`);
  }
  const circuitDevices = project.sharedCircuits && project.secondPanel ? [...project.devices, ...project.secondPanel.devices] : project.devices;
  for (const circuit of project.circuits) if (!circuitDevices.some((d) => deviceCircuitIds(d).includes(circuit.id))) messages.push(`${circuit.name || "Circuit sans nom"} : aucun disjoncteur affecté.`);
  if (project.accessories.length) messages.push("Les accessoires saisis manuellement restent à vérifier.");
  const communication = project.communication;
  if (communication?.enabled) {
    if (!communication.reference) messages.push("Coffret de communication : référence à renseigner.");
    if (communication.ports.some((p) => !p.room.trim())) messages.push("Coffret de communication : destination de certaines prises RJ45 à renseigner.");
    if (communication.switchPorts && communication.ports.length > communication.switchPorts) messages.push("Coffret de communication : plus de prises RJ45 que de ports de switch ; préciser les prises à activer.");
  }
  messages.push("Assemblage XE, alimentation, accessoires, dimensionnement et conformité NF C 15-100 non validés par cet outil.");
  if (project.secondPanel) return [
    ...messages.map((message) => `Tableau 1 : ${message}`),
    ...projectChecks(project.secondPanel).map((message) => `Tableau 2 : ${message}`),
  ];
  return messages;
}

export type Material = { reference: string; name: string; quantity: number; source: string; status: string };
export function materialList(project: Project): Material[] {
  const items = new Map<string, Material>();
  function add(reference: string, name: string, quantity: number, source: string, status = "Assemblage à vérifier") {
    const key = `${reference}:${name}:${status}`;
    const current = items.get(key);
    items.set(key, { reference, name, quantity: quantity + (current?.quantity ?? 0), source, status });
  }
  const enclosure = enclosureReference(project.rows.length, project.capacity);
  add(enclosure ?? "À sélectionner", `Coffret ${project.rows.length} × ${project.capacity} modules`, 1, enclosure ? manufacturerUrl(enclosure) : "", enclosure ? "Configuration à confirmer" : "Coffret provisoire");
  project.devices.forEach((d) => { const p = PRODUCT_BY_REF[d.reference]; add(p.reference, p.name, 1, p.source); });
  project.rows.forEach(r => rowDistributions(r).forEach(segment => { const d = DISTRIBUTORS.find(d => d.reference === segment.reference); if (d) add(d.reference, d.name, 1, manufacturerUrl(d.reference)); }));
  project.accessories.forEach((a) => add(a.reference || "Non renseignée", a.name || "Accessoire", a.quantity, "", "Saisie manuelle à vérifier"));
  if (project.gtl) project.gtl.units.forEach(unit => {
    const modules = unit.reference === "R9HKT13" ? 13 : 18;
    add(unit.reference, `GTL Resi9 · kit goulotte ${modules} modules`, unit.quantity, manufacturerUrl(unit.reference), "Installation et fixations à vérifier");
    unit.accessories.forEach(accessory => {
      const option = GTL_ACCESSORIES.find(candidate => candidate.reference === accessory.reference)!;
      add(accessory.reference, option.name, accessory.quantity * unit.quantity, manufacturerUrl(accessory.reference), "Accessoire GTL à vérifier");
    });
  });
  const communication = project.communication;
  if (communication?.enabled) {
    const manual = "Composition à confirmer";
    const cabinet = communicationCabinet(communication.reference);
    add(communication.reference || "À sélectionner", "Coffret de communication", 1, cabinet?.source ?? "", manual);
    if (communication.ports.length) add("À sélectionner", "Liaison RJ45 à équiper · brassage et prise terminale", communication.ports.length, "", manual);
    if (communication.switchPorts && !cabinet) add("À sélectionner", `Switch réseau · ${communication.switchPorts} ports`, 1, "", manual);
    if (communication.box) add("À renseigner", "Box Internet", 1, "", manual);
    if (communication.optical) add("À renseigner", "Terminaison optique · DTIo / PTO", 1, "", manual);
    if (communication.dti) add("À renseigner", "DTI cuivre", 1, "", manual);
  }
  if (project.secondPanel) materialList(project.secondPanel).forEach((item) => add(item.reference, item.name, item.quantity, item.source, item.status));
  return [...items.values()];
}
