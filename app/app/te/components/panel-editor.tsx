"use client";

import Link from "next/link";
import CommunicationEditor from "./communication-cabinet";
import GtlEditor from "./gtl";
import CircuitUsage, { RELAY_LIGHTING_USAGE } from "./circuit-usage";
import { rowBreakerTotals } from "../lib/row-totals";
import CableSection from "./cable-section";
import SingleLineDiagram from "./single-line-diagram";
import { CircuitReorderList, CircuitDropRow, CircuitDragHandle } from "./circuit-reorder";
import RowDistribution, { DistributionCatalogCard } from "./row-distribution";
import DistributionIllustration, { DistributionVisualGuide } from "./distribution-illustration";
import SupplierPrice from "./supplier-price";
import DistributionDetails from "./distribution-details";
import { SUPPLIERS, comparableSuppliersBudget, formatPrice, materialBudget, materialsCsv, supplierPrice } from "../lib/pricing";
import { useReducer, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useSharedProject } from "../lib/use-shared-project";
import { DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, pointerWithin, rectIntersection, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent } from "@dnd-kit/core";
import { DISTRIBUTORS, PRODUCTS, PRODUCT_BY_REF, enclosureReference, type Product } from "../data/catalog";
import { distributionPlacementError, firstFreeDistributionSlot, rowDistributions, deviceCircuitIds, removeCircuit as unlinkCircuit, supportsTwoDepartures, emptyCommunication, emptyProject, firstFreeSlot, historyReducer, materialList, parseProject, placementError, projectChecks, removeDevice, resizeProject, uid, validateProject, type Circuit, type Device, type Project } from "../lib/model";

type DragItem = { reference: string; deviceId?: string; panelIndex?: number; type?: "distribution"; distributionId?: string; rowId?: string };
type Target = { rowId: string; slot: number; panelIndex: number; type?: "distribution" };
type View = "circuits" | "singleLine" | "materials" | "checks";
type DistributionSelection = { reference: string; panelIndex: number; rowId?: string; id?: string };

function EquipmentFace({ product, compact = false }: { product: Product; compact?: boolean }) {
  return <div className={`te-equipment-face ${product.kind} ${compact ? "compact" : ""}`} aria-hidden="true">
    <span className="te-maker">Schneider</span><span className="te-range">{product.range ?? "Resi9 XE"}</span>
    {product.kind === "spd" ? <span className="te-surge-symbol">ϟ</span> : product.kind === "impulse" ? <span className="te-impulse-symbol">I / O</span> : <span className="te-lever"><i /></span>}<strong>{product.short}</strong>
    {product.kind === "rcd" ? <span className="te-test">T</span> : null}
    <span className="te-face-rating">{product.kind === "rcd" ? product.rating : product.kind === "spd" ? "10 kA · 1P+N" : product.kind === "impulse" ? "16 A · 230 V" : product.rating.split(" · ").at(-1)}</span>
  </div>;
}

function CatalogCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `catalog:${product.reference}`, data: { reference: product.reference } satisfies DragItem });
  return <article className={`te-catalog-card ${isDragging ? "dragging" : ""}`} ref={setNodeRef}>
    <button className="te-catalog-handle" {...attributes} {...listeners} aria-label={`Glisser ${product.name}`}><EquipmentFace product={product} compact /></button>
    <div><h3>{product.name}</h3><p>{product.rating}</p><p>{product.detail}</p><small>{product.reference} · {product.modules} module{product.modules > 1 ? "s" : ""}</small><SupplierPrice referenceCode={product.reference} />
      <div className="te-card-actions"><button onClick={onAdd} aria-label={`Ajouter ${product.name}`}>+ Ajouter</button><a href={product.source} target="_blank" rel="noreferrer" aria-label={`Fiche Schneider ${product.reference}`}>Fiche ↗</a></div>
    </div>
  </article>;
}

function ModuleSlot({ rowId, slot, panelIndex }: Target) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${panelIndex}:${rowId}:${slot}`, data: { rowId, slot, panelIndex } satisfies Target });
  return <div ref={setNodeRef} className={`te-slot ${isOver ? "over" : ""}`} style={{ gridColumn: slot + 1 }} aria-hidden="true"><span>{String(slot + 1).padStart(2, "0")}</span><i>+</i></div>;
}

function PlacedDevice({ device, circuits, selected, onSelect, panelIndex }: { device: Device; circuits: Circuit[]; selected: boolean; onSelect: () => void; panelIndex: number }) {
  const product = PRODUCT_BY_REF[device.reference];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `device:${panelIndex}:${device.id}`, data: { reference: device.reference, deviceId: device.id, panelIndex } satisfies DragItem });
  return <button ref={setNodeRef} className={`te-device ${selected ? "selected" : ""} ${isDragging ? "dragging" : ""}`} style={{ gridColumn: `${device.slot + 1} / span ${product.modules}` }} {...attributes} {...listeners} onClick={onSelect} aria-label={`${device.label || product.name}, position ${device.slot + 1}`} aria-pressed={selected} data-device-id={device.id}>
    <EquipmentFace product={product} /><span className="te-device-label">{device.label || circuits.map((c) => `${c.name}${c.usage === RELAY_LIGHTING_USAGE ? " · TL" : ""}`).filter(Boolean).join(" / ") || product.name}</span>
  </button>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="te-field"><span>{label}</span>{children}</label>; }

function defaultCableSection(usage: string) {
  return (usage === "Éclairage" || usage === RELAY_LIGHTING_USAGE || usage === "Circuit spécialisé · Volet roulant") ? "1,5 mm²" : usage === "Prises" ? "2,5 mm²" : "";
}

export default function PanelEditor() {
  const [history, dispatch] = useReducer(historyReducer, undefined, () => ({ past: [], present: emptyProject(), future: [] }));
  const workspace = history.present;
  const [selectedPanel, setSelectedPanel] = useState(0);
  const activePanel = selectedPanel === 1 && workspace.secondPanel ? 1 : 0;
  const project = activePanel === 1 ? workspace.secondPanel! : workspace;
  const panels = workspace.secondPanel ? [workspace, workspace.secondPanel] : [workspace];
  function selectPanel(index: number) { setSelectedPanel(index); setSelectedId(""); setSelectedDistribution(null); setAddRowId(""); }
  const [notice, setNotice] = useState("Glissez un appareil sur une rangée, ou utilisez « Ajouter ».");
  const { ready, saveBlocked, setSaveBlocked, saveStatus, setSaveStatus, conflict } = useSharedProject(workspace, dispatch, setNotice);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDistribution, setSelectedDistribution] = useState<DistributionSelection | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("rcd");
  const [circuitQuery, setCircuitQuery] = useState("");
  const [circuitFloor, setCircuitFloor] = useState("");
  const [circuitUsage, setCircuitUsage] = useState("");
  const [circuitAssignment, setCircuitAssignment] = useState<"all" | "assigned" | "unassigned">("all");
  const [addRowId, setAddRowId] = useState("");
  const [view, setView] = useState<View>("circuits");
  const [activeDrag, setActiveDrag] = useState<DragItem | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const distributionGrabOffset = useRef(0);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 7 } }), useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 7 } }), useSensor(KeyboardSensor));

  const selected = project.devices.find((d) => d.id === selectedId);
  const selectedProduct = selected ? PRODUCT_BY_REF[selected.reference] : null;
  const targetRow = project.rows.some((r) => r.id === addRowId) ? addRowId : project.rows[0].id;
  const checks = projectChecks(workspace);
  const assignedCircuitCount = workspace.circuits.filter(circuit => panels.some(panel => panel.devices.some(device => deviceCircuitIds(device).includes(circuit.id)))).length;
  const materials = materialList(workspace);
  const budgets = SUPPLIERS.map(supplier => ({ ...supplier, ...materialBudget(materials, supplier.id) }));
  const comparable = comparableSuppliersBudget(materials);
  const catalog = PRODUCTS.filter((p) => p.kind === category && `${p.name} ${p.reference} ${p.rating}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")));
  const distributionCatalog = DISTRIBUTORS.filter(p => `${p.name} ${p.reference}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")));
  const distributionRow = selectedDistribution?.panelIndex === activePanel ? project.rows.find(row => row.id === selectedDistribution.rowId) : undefined;
  const distributionSegment = distributionRow ? rowDistributions(distributionRow).find(segment => segment.id === selectedDistribution?.id) : undefined;
  const distributionProduct = selectedDistribution?.panelIndex === activePanel && (!selectedDistribution.id || distributionSegment) ? DISTRIBUTORS.find(p => p.reference === (distributionSegment?.reference ?? selectedDistribution.reference)) : undefined;
  const circuitFloors = [...new Set(workspace.circuits.map(circuit => circuit.floor).filter(Boolean))];
  const circuitUsages = [...new Set(workspace.circuits.map(circuit => circuit.usage).filter(Boolean))];
  const normalizedCircuitQuery = circuitQuery.trim().toLocaleLowerCase("fr");
  const circuitMatches = (circuit: Circuit) => {
    const assigned = panels.some(panel => panel.devices.some(device => deviceCircuitIds(device).includes(circuit.id)));
    return (!normalizedCircuitQuery || `${circuit.name} ${circuit.room} ${circuit.floor} ${circuit.usage}`.toLocaleLowerCase("fr").includes(normalizedCircuitQuery))
      && (!circuitFloor || circuit.floor === circuitFloor)
      && (!circuitUsage || circuit.usage === circuitUsage)
      && (circuitAssignment === "all" || (circuitAssignment === "assigned" ? assigned : !assigned));
  };
  const filteredCircuits = workspace.circuits.flatMap((circuit, index) => circuitMatches(circuit) ? [{ circuit, index }] : []);
  const hasCircuitFilters = !!(circuitQuery || circuitFloor || circuitUsage || circuitAssignment !== "all");

  function selectDistribution(selection: DistributionSelection) {
    setSelectedPanel(selection.panelIndex);
    setSelectedId("");
    setSelectedDistribution(selection);
    if (selection.rowId) setAddRowId(selection.rowId);
  }

  function activateRow(panelIndex: number, rowId: string) {
    if (panelIndex !== activePanel) { setSelectedId(""); setSelectedDistribution(null); }
    setSelectedPanel(panelIndex);
    setAddRowId(rowId);
  }

  function removeDistribution(panelIndex: number, rowId: string, id: string) {
    const board = panels[panelIndex];
    const next = { ...board, rows: board.rows.map(row => row.id === rowId ? { ...row, distributor: "", distributions: rowDistributions(row).filter(segment => segment.id !== id) } : row) };
    if (commitPanel(next, panelIndex, "Distribution supprimée. Vous pouvez annuler cette action.") && selectedDistribution?.panelIndex === panelIndex && selectedDistribution.rowId === rowId && selectedDistribution.id === id) setSelectedDistribution(null);
  }

  function commitWorkspace(next: Project, message?: string) {
    try { const valid = validateProject(next); dispatch({ type: "commit", project: valid }); if (!saveBlocked) setSaveStatus("Enregistrement…"); if (message) setNotice(message); return true; }
    catch (error) { setNotice(error instanceof Error ? error.message : "Modification impossible."); return false; }
  }

  function commitPanel(next: Project, index: number, message?: string) {
    return commitWorkspace(index === 1 ? { ...workspace, secondPanel: next } : { ...next, secondPanel: workspace.secondPanel }, message);
  }
  function commit(next: Project, message?: string) { return commitPanel(next, activePanel, message); }

  function addDevice(reference: string, rowId = targetRow, position?: number, panelIndex = activePanel) {
    const project = panels[panelIndex];
    const slot = position ?? firstFreeSlot(project, reference, rowId);
    if (slot === null) { setNotice("Cette rangée ne dispose pas d’un emplacement libre assez large."); return; }
    const error = placementError(project, reference, rowId, slot);
    if (error) { setNotice(error); return; }
    const device: Device = { id: uid(), reference, rowId, slot, label: "", circuitId: "", upstreamId: "" };
    if (commitPanel({ ...project, devices: [...project.devices, device] }, panelIndex, `${PRODUCT_BY_REF[reference].name} ajouté en position ${slot + 1}.`)) { setSelectedPanel(panelIndex); setSelectedId(device.id); setSelectedDistribution(null); }
  }

  function moveDevice(device: Device, rowId: string, slot: number) {
    const error = placementError(project, device.reference, rowId, slot, device.id);
    if (error) { setNotice(error); return; }
    commit({ ...project, devices: project.devices.map((d) => d.id === device.id ? { ...d, rowId, slot } : d) }, `Appareil déplacé en position ${slot + 1}. Les affectations électriques sont conservées.`);
  }

  function updateDevice(patch: Partial<Device>) {
    if (!selected) return;
    commit({ ...project, devices: project.devices.map((d) => d.id === selected.id ? { ...d, ...patch } : d) });
  }

  function placeDistribution(item: DragItem, destination: Target) {
    const board = panels[destination.panelIndex];
    const row = board.rows.find(r => r.id === destination.rowId);
    if (!row) return;
    if (item.distributionId && item.panelIndex !== destination.panelIndex) { setNotice("Déplacez le répartiteur dans son tableau, ou ajoutez-en un dans l’autre tableau."); return; }
    const sameRow = item.rowId === row.id;
    const error = distributionPlacementError(row, item.reference, destination.slot, board.capacity, sameRow ? item.distributionId : undefined);
    if (error) { setNotice(error); return; }
    const segment = { id: sameRow && item.distributionId ? item.distributionId : uid(), reference: item.reference, slot: destination.slot };
    const rows = board.rows.map(r => {
      let segments = rowDistributions(r);
      if (item.distributionId && r.id === item.rowId) segments = segments.filter(s => s.id !== item.distributionId);
      if (r.id === row.id) segments = [...segments, segment].sort((a, b) => a.slot - b.slot);
      return r.id === row.id || (item.distributionId && r.id === item.rowId) ? { ...r, distributor: "", distributions: segments } : r;
    });
    if (commitPanel({ ...board, rows }, destination.panelIndex, `${item.reference} ${item.distributionId ? "déplacé" : "ajouté"} en position ${destination.slot + 1}.`)) selectDistribution({ reference: segment.reference, panelIndex: destination.panelIndex, rowId: row.id, id: segment.id });
  }

  function addDistribution(reference: string) {
    const row = project.rows.find(r => r.id === targetRow)!;
    const slot = firstFreeDistributionSlot(row, reference, project.capacity);
    if (slot === null) { setNotice("Pas assez d’espace libre pour ce répartiteur ou peigne sur la rangée choisie."); return; }
    placeDistribution({ type: "distribution", reference }, { type: "distribution", rowId: row.id, panelIndex: activePanel, slot });
  }

  function dropTarget(event: DragOverEvent | DragEndEvent): Target | null {
    const destination = event.over?.data.current as Target | undefined;
    return destination ? { ...destination, slot: destination.slot - (destination.type === "distribution" ? distributionGrabOffset.current : 0) } : null;
  }

  function dragOver(event: DragOverEvent) {
    setTarget(dropTarget(event));
  }

  function dragStart(event: DragStartEvent) {
    const item = event.active.data.current as DragItem;
    if (item.type !== "distribution") setSelectedDistribution(null);
    distributionGrabOffset.current = 0;
    if (item.distributionId) {
      const rect = event.active.rect.current.initial;
      const activator = event.activatorEvent;
      const clientX = "clientX" in activator ? Number(activator.clientX) : "touches" in activator ? (activator as TouchEvent).touches[0]?.clientX : undefined;
      const modules = DISTRIBUTORS.find(p => p.reference === item.reference)!.modules;
      if (rect && clientX !== undefined) distributionGrabOffset.current = Math.max(0, Math.min(modules - 1, Math.floor((clientX - rect.left) / rect.width * modules)));
    }
    setActiveDrag(item);
    if (item.panelIndex !== undefined) setSelectedPanel(item.panelIndex);
    setNotice("Déplacement en cours. Échap pour annuler.");
  }

  function dragEnd(event: DragEndEvent) {
    const item = event.active.data.current as DragItem;
    const destination = dropTarget(event);
    setActiveDrag(null); setTarget(null);
    if (!destination) { setNotice("Déplacement annulé : déposez l’élément sur la bande correspondante."); return; }
    if (item.type === "distribution") { placeDistribution(item, destination); return; }
    if (item.deviceId) {
      if (destination.panelIndex !== activePanel) { setNotice("Déplacez les appareils entre les rangées du même tableau. Ajoutez un appareil pour l’autre tableau."); return; }
      const device = project.devices.find((d) => d.id === item.deviceId);
      if (device) { moveDevice(device, destination.rowId, destination.slot); setSelectedId(device.id); }
    } else addDevice(item.reference, destination.rowId, destination.slot, destination.panelIndex);
  }

  function download(content: string, filename: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error("Le fichier dépasse la limite de 1 Mo.");
      const next = parseProject(await file.text());
      if (!window.confirm(`Importer « ${next.name || "Tableau sans nom"} » ? Le tableau courant sera remplacé. Vous pourrez annuler cette action.`)) return;
      if (commitWorkspace(next, "Projet importé. Vous pouvez annuler pour retrouver le tableau précédent.")) selectPanel(0);
    } catch (error) { setNotice(`Import refusé : ${error instanceof Error ? error.message : "fichier illisible"}`); }
    finally { if (fileInput.current) fileInput.current.value = ""; }
  }

  function addCircuit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const usage = String(data.get("usage") ?? "");
    const circuit: Circuit = { id: uid(), name: String(data.get("name") ?? "").trim(), room: String(data.get("room") ?? "").trim(), floor: String(data.get("floor") ?? ""), usage, load: "", cable: defaultCableSection(usage) };
    if (!circuit.name) return;
    if (commitWorkspace({ ...workspace, circuits: [...workspace.circuits, circuit] }, `Circuit « ${circuit.name} » ajouté.`)) form.reset();
  }

  function editCircuit(id: string, patch: Partial<Circuit>) {
    commitWorkspace({ ...workspace, circuits: workspace.circuits.map(circuit => circuit.id === id ? { ...circuit, ...patch, ...(patch.usage !== undefined && !circuit.cable && patch.cable === undefined ? { cable: defaultCableSection(patch.usage) } : {}) } : circuit) });
  }

  function duplicateCircuit(id: string) {
    const index = workspace.circuits.findIndex(circuit => circuit.id === id);
    if (index < 0 || workspace.circuits.length >= 600) return;
    const original = workspace.circuits[index];
    const base = (original.name || "Circuit").slice(0, 140);
    let name = `${base} (copie)`;
    let number = 2;
    while (workspace.circuits.some(circuit => circuit.name === name)) name = `${base} (copie ${number++})`;
    const circuits = [...workspace.circuits];
    circuits.splice(index + 1, 0, { ...original, id: uid(), name });
    commitWorkspace({ ...workspace, circuits }, `Circuit « ${name} » dupliqué. Affectez-lui un disjoncteur.`);
  }

  function moveCircuit(id: string, targetId: string) {
    const index = workspace.circuits.findIndex(circuit => circuit.id === id);
    const destination = workspace.circuits.findIndex(circuit => circuit.id === targetId);
    if (index < 0 || destination < 0 || destination >= workspace.circuits.length) return;
    const circuits = [...workspace.circuits];
    const [circuit] = circuits.splice(index, 1);
    circuits.splice(destination, 0, circuit);
    commitWorkspace({ ...workspace, circuits }, `Circuit déplacé en position ${destination + 1}.`);
  }

  function removeCircuit(id: string) {
    if (!window.confirm("Supprimer ce circuit ? Son appareil restera dans le tableau.")) return;
    commitWorkspace(unlinkCircuit(workspace, id), "Circuit supprimé ; appareil conservé.");
  }

  const previewError = activeDrag && target ? activeDrag.type === "distribution"
    ? distributionPlacementError(panels[target.panelIndex].rows.find(r => r.id === target.rowId)!, activeDrag.reference, target.slot, panels[target.panelIndex].capacity, activeDrag.rowId === target.rowId && activeDrag.panelIndex === target.panelIndex ? activeDrag.distributionId : undefined) || (activeDrag.distributionId && activeDrag.panelIndex !== target.panelIndex ? "Autre tableau" : null)
    : placementError(panels[target.panelIndex], activeDrag.reference, target.rowId, target.slot, activeDrag.deviceId) || (activeDrag.deviceId && target.panelIndex !== activePanel ? "Autre tableau" : null) : null;

  return <div className="te-app">
    <header className="te-nav"><Link className="te-brand" href="/">MAISON 1973 <span>/</span> <span>LES TRAVAUX</span></Link><Link className="te-back" href="/">← Retour à la maison</Link></header>
    <main className="te-main">
      <div className="te-heading"><div><p className="te-eyebrow">L’ATELIER DE LA MAISON <span>01 / ÉLECTRICITÉ</span></p><h1>TE<span>.</span></h1><p className="te-subtitle">Chaque circuit à sa place. Composez votre tableau, rangée par rangée.</p></div><div className="te-system"><span className="te-green-dot" /> SCHNEIDER ELECTRIC<strong>Resi9 XE</strong><small>Système embrochable · étude monophasée</small></div></div>
      {!ready ? <p className="te-loading" role="status">Ouverture de votre atelier…</p> : <>
        <div className="te-projectbar"><Field label="Nom du projet"><input value={workspace.name} maxLength={120} onChange={(e) => commitWorkspace({ ...workspace, name: e.target.value })} /></Field><span className={`te-save ${saveBlocked ? "blocked" : ""}`}>{saveBlocked ? "○" : "●"} {saveStatus}</span><div className="te-toolbar">
          <button disabled={!history.past.length} onClick={() => { dispatch({ type: "undo" }); setNotice("Dernière modification annulée."); }} aria-label="Annuler la dernière modification">↶ <span>Annuler</span></button>
          <button disabled={!history.future.length} onClick={() => { dispatch({ type: "redo" }); setNotice("Modification rétablie."); }} aria-label="Rétablir la modification">↷ <span>Rétablir</span></button>
          <button onClick={() => fileInput.current?.click()}>Importer</button><input className="te-file-input" ref={fileInput} type="file" accept=".json,application/json" aria-label="Importer un projet JSON" onChange={(e) => void importFile(e.target.files?.[0])} />
          <button onClick={() => { download(JSON.stringify(workspace, null, 2), "tableau-electrique.json", "application/json"); setNotice("Projet exporté au format JSON."); }}>Exporter JSON ↓</button>
          {conflict ? <button onClick={() => download(JSON.stringify(conflict, null, 2), "tableau-electrique-copie-precedente.json", "application/json")}>Exporter ma copie précédente</button> : null}
          <button className="te-primary" onClick={() => window.print()}>Imprimer ↗</button>
        </div></div>
        {saveBlocked ? <div className="te-storage-alert">La sauvegarde locale est suspendue. Exportez votre travail pour le conserver. <button onClick={() => { if (window.confirm("Autoriser la sauvegarde du tableau courant ? Les anciennes données locales seront remplacées.")) { setSaveBlocked(false); setSaveStatus("Sauvegarde locale active"); } }}>Reprendre la sauvegarde</button></div> : null}
        <div className="te-status" role="status" aria-live="polite" aria-atomic="true"><span aria-hidden="true">↳</span> {notice}</div>
        <div className="te-panel-controls" aria-label="Gestion des tableaux">
          <div>{panels.map((panel, index) => <button key={index} aria-pressed={activePanel === index} onClick={() => selectPanel(index)}>Tableau {index + 1}{index === 1 ? ` · ${panel.name}` : ""}</button>)}</div>
          {!workspace.secondPanel ? <button onClick={() => { const secondPanel = { ...emptyProject(), name: "Tableau secondaire" }; if (commitWorkspace({ ...workspace, secondPanel }, "Second tableau ajouté. Les deux tableaux sont sauvegardés ensemble.")) selectPanel(1); }}>+ Ajouter un second tableau</button> : <button className="te-danger" onClick={() => { if (window.confirm("Supprimer le second tableau ? Ses circuits resteront dans la liste générale. Vous pourrez annuler cette action.")) { const next = { ...workspace }; delete next.secondPanel; if (commitWorkspace(next, "Second tableau supprimé. Vous pouvez annuler.")) selectPanel(0); } }}>Supprimer le second tableau</button>}
          <p>Appareils : tableau {activePanel + 1}. Circuits, matériel et vérifications : projet complet.</p>
        </div>
        <div className="te-budget" aria-label="Budget du matériel">{budgets.map(b => <div key={b.id}><span>{b.missingQuantity ? "Sous-total connu TTC" : "Total estimé TTC"} · {b.name}</span><strong>{formatPrice(b.totalCents)}</strong></div>)}<p>Prix unitaires TTC, dates de relevé sur les liens de prix, hors livraison et remises par lot. Coffrets, appareils, distributions et GTL inclus. Comparaison sur les {comparable.quantity} élément(s) chiffrés chez les trois fournisseurs : {SUPPLIERS.map(s => `${s.name} ${formatPrice(comparable.totals[s.id])}`).join(" · ")}. <b>{budgets.map(b => `${b.name} : ${b.missingQuantity} élément(s) non chiffré(s)`).join(" ; ")}. Éléments non chiffrés exclus.</b> Prix indicatifs, susceptibles d’évoluer.</p></div>
        <GtlEditor onResizePanel={(key, rows, capacity) => { const index = key === "primary" ? 0 : 1; const board = index === 0 ? workspace : workspace.secondPanel; if (!board) return "Tableau introuvable."; try { return commitPanel(resizeProject(board, rows, capacity), index) ? null : "Redimensionnement impossible. Vérifiez le tableau."; } catch (error) { const message = error instanceof Error ? error.message : "Dimensions impossibles."; setNotice(message); return message; } }} primaryGeometry={{ capacity: workspace.capacity, rows: workspace.rows.length }} secondaryGeometry={workspace.secondPanel ? { capacity: workspace.secondPanel.capacity, rows: workspace.secondPanel.rows.length } : undefined} value={workspace.gtl} hasSecondPanel={!!workspace.secondPanel} communicationEnabled={!!workspace.communication?.enabled} onPlaceCommunication={(unitId) => { if (!workspace.gtl) return; commitWorkspace({ ...workspace, communication: workspace.communication?.enabled ? workspace.communication : emptyCommunication(), gtl: { ...workspace.gtl, placements: { ...workspace.gtl.placements, communication: unitId } } }); }} onChange={(gtl) => commitWorkspace({ ...workspace, gtl })} />
        <DndContext id="electrical-editor" sensors={sensors} collisionDetection={(args) => { const droppableContainers = args.droppableContainers.filter(d => d.data.current?.type === args.active.data.current?.type); const filtered = { ...args, droppableContainers }; return args.pointerCoordinates ? pointerWithin(filtered) : rectIntersection(filtered); }} onDragStart={dragStart} onDragOver={dragOver} onDragEnd={dragEnd} onDragCancel={() => { setActiveDrag(null); setTarget(null); setNotice("Déplacement annulé."); }} accessibility={{ screenReaderInstructions: { draggable: "Appuyez sur Espace pour saisir l’appareil, utilisez les flèches pour le déplacer, puis Espace pour déposer. Échap pour annuler. Les commandes Ajouter et Déplacer sont également disponibles." }, announcements: { onDragStart: () => "Appareil saisi.", onDragOver: ({ over }) => over ? `Position ${(over.data.current as Target).slot + 1} de la rangée ciblée.` : "En dehors du tableau.", onDragEnd: ({ over }) => over ? "Déplacement terminé. Consultez le message de résultat." : "Déplacement annulé.", onDragCancel: () => "Déplacement annulé." } }}>
          <div className="te-workspace">
            <aside className="te-catalog te-card" aria-label="Catalogue des appareils"><div className="te-section-heading"><span className="te-step">02</span><h2>Les appareils</h2><span className="te-badge">XE</span></div><p className="te-muted">Après la GTL et les coffrets, glissez un appareil dans le tableau.</p>
              <Field label="Rechercher un appareil"><input type="search" placeholder="Nom, calibre, référence…" value={query} onChange={(e) => setQuery(e.target.value)} /></Field>
              <div className="te-filter" aria-label="Filtrer le catalogue">{[["rcd", "Différentiels"], ["breaker", "Disjoncteurs"], ["spd", "Parafoudres"], ["impulse", "Télérupteurs"], ["distribution", "Distribution"]].map(([value, label]) => <button key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}</div>
              {category === "distribution" && <details className="te-distribution-catalog" open><summary>Répartiteurs &amp; peignes <span>{distributionCatalog.length}</span></summary><DistributionVisualGuide /><p className="te-muted">Glissez sur la bande au-dessus des disjoncteurs. Cliquez pour voir la fiche, glissez pour placer.</p><div>{distributionCatalog.map(p => <DistributionCatalogCard key={p.reference} product={p} onSelect={() => selectDistribution({ reference: p.reference, panelIndex: activePanel })} />)}{!distributionCatalog.length && <p className="te-muted">Aucune distribution trouvée.</p>}</div></details>}
              {category !== "distribution" && <div className="te-catalog-list">{catalog.map((p) => <CatalogCard key={p.reference} product={p} onAdd={() => addDevice(p.reference)} />)}{!catalog.length ? <p className="te-muted">Aucun appareil trouvé.</p> : null}</div>}
              <p className="te-catalog-foot">{PRODUCTS.length} références Schneider · dimensions en modules de 18 mm. Les fiches fabricant sont accessibles sur chaque appareil.</p>
            </aside>
            <div className={`te-boards ${panels.length > 1 ? "multiple" : ""}`}>{panels.map((project, panelIndex) => {
              const occupied = project.devices.reduce((sum, d) => sum + PRODUCT_BY_REF[d.reference].modules, 0);
              const total = project.rows.length * project.capacity;
              const commitBoard = (next: Project) => commitPanel(next, panelIndex);
              const resizePanel = (count: number, capacity: number) => {
                try { commitBoard(resizeProject(project, count, capacity)); }
                catch (error) { setNotice(error instanceof Error ? error.message : "Redimensionnement impossible."); }
              };
              return (<section key={panelIndex} className={`te-board-section ${activePanel === panelIndex ? "active" : ""}`} aria-label={panels.length === 1 ? "Composition du tableau" : `Composition du tableau ${panelIndex + 1}`}><div className="te-board-heading"><div><p className="te-eyebrow">VOTRE COMPOSITION</p><h2>{panels.length === 1 ? "Le coffret" : `Tableau ${panelIndex + 1}`}</h2></div><span className="te-tag">MONOPHASÉ · PROJET</span></div>
              <div className="te-board-edit">{panelIndex === 1 ? <Field label="Nom du second tableau"><input value={project.name} maxLength={120} onChange={(e) => commitPanel({ ...project, name: e.target.value }, panelIndex)} /></Field> : null}</div><div className="te-board-settings"><Field label="Rangées"><select value={project.rows.length} onChange={(e) => resizePanel(Number(e.target.value), project.capacity)}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} rangée{n > 1 ? "s" : ""}</option>)}</select></Field><Field label="Largeur"><select value={project.capacity} onChange={(e) => resizePanel(project.rows.length, Number(e.target.value))}><option value={13}>13 modules</option><option value={18}>18 modules</option></select></Field><div className="te-occupancy"><strong>{occupied}<span> / {total}</span></strong><small>modules occupés</small><span className="te-free-capacity" aria-label={`Place restante du tableau ${panelIndex + 1} : ${Math.round((total - occupied) / total * 100)} %`}>{Math.round((total - occupied) / total * 100)} % de place restante</span><meter min={0} max={total} value={total - occupied} aria-label="Modules disponibles" /></div></div>
              <div className="te-panel-scroll"><div className="te-enclosure" style={{ "--te-capacity": project.capacity } as CSSProperties}>
                <div className="te-enclosure-brand"><span>Schneider Electric</span><span>Resi9 <b>XE</b></span></div>
                {project.rows.map((row, index) => {
                  const devices = project.devices.filter((d) => d.rowId === row.id);
                  const used = devices.reduce((sum, d) => sum + PRODUCT_BY_REF[d.reference].modules, 0);
                  const breakerTotals = rowBreakerTotals(devices, workspace.circuits);
                  return <section className={`te-panel-row ${activePanel === panelIndex && targetRow === row.id ? "active-row" : ""}`} key={row.id} aria-label={row.name} onClickCapture={() => activateRow(panelIndex, row.id)} onFocusCapture={() => activateRow(panelIndex, row.id)}>
                    <div className="te-row-title"><span className="te-row-number">{String(index + 1).padStart(2, "0")}</span><input aria-label={`Nom de la rangée ${index + 1}`} value={row.name} maxLength={160} onChange={(e) => commitBoard({ ...project, rows: project.rows.map((r) => r.id === row.id ? { ...r, name: e.target.value } : r) })} /><span>{project.capacity - used} libres</span></div>
                    <RowDistribution row={row} capacity={project.capacity} panelIndex={panelIndex}
                      selectedId={selectedDistribution?.panelIndex === panelIndex && selectedDistribution.rowId === row.id ? selectedDistribution.id : undefined}
                      onSelect={segment => selectDistribution({ reference: segment.reference, panelIndex, rowId: row.id, id: segment.id })}
                      preview={activeDrag?.type === "distribution" && target?.panelIndex === panelIndex && target.rowId === row.id ? { slot: target.slot, modules: DISTRIBUTORS.find(p => p.reference === activeDrag.reference)!.modules, error: !!previewError } : undefined}
                      onRemove={id => removeDistribution(panelIndex, row.id, id)}
                      onMove={(id, slot) => { const segment = rowDistributions(row).find(s => s.id === id)!; placeDistribution({ type: "distribution", reference: segment.reference, distributionId: id, rowId: row.id, panelIndex }, { type: "distribution", rowId: row.id, panelIndex, slot }); }} />
                    <div className="te-module-grid" data-row-index={index}>
                      {Array.from({ length: project.capacity }, (_, slot) => <ModuleSlot key={slot} rowId={row.id} slot={slot} panelIndex={panelIndex} />)}
                      {devices.map((device) => <PlacedDevice key={device.id} panelIndex={panelIndex} device={device} circuits={workspace.circuits.filter((c) => deviceCircuitIds(device).includes(c.id))} selected={activePanel === panelIndex && selected?.id === device.id} onSelect={() => { setSelectedPanel(panelIndex); setSelectedId(device.id); setSelectedDistribution(null); }} />)}
                      {activeDrag && activeDrag.type !== "distribution" && target?.panelIndex === panelIndex && target.rowId === row.id ? <div className={`te-drop-preview ${previewError ? "invalid" : ""}`} style={{ gridColumn: `${target.slot + 1} / span ${Math.min(PRODUCT_BY_REF[activeDrag.reference].modules, project.capacity - target.slot)}` }}><span>{previewError ? "Indisponible" : "Déposer ici"}</span></div> : null}
                    </div>
                    <div className="te-row-breaker-total" aria-label={`Somme des calibres de ${row.name}`}><span>{breakerTotals.count} disjoncteur{breakerTotals.count > 1 ? "s" : ""}</span><span>Somme brute <strong>{breakerTotals.rawA} A</strong></span><span title="Calibre × 0,5 uniquement si tous les circuits associés sont de l’éclairage, des prises ou des volets roulants ; sinon × 1. Un disjoncteur est compté une seule fois.">Total pondéré <strong>{breakerTotals.weightedA} A</strong></span><small>{breakerTotals.halfWeightedCount} à ×0,5 · autres à ×1</small></div>
                  </section>;
                })}
                <div className="te-panel-foot"><span>PE <i /> Bornier de terre à prévoir</span><span>{enclosureReference(project.rows.length, project.capacity) || "Coffret provisoire · référence à sélectionner"}</span></div>
              </div></div>
              <div className="te-board-caption"><span>↔ Déplacez les appareils entre les rangées.</span><span>{total - occupied} positions libres au total</span></div>
            </section>);
            })}</div>
            <aside className="te-inspector te-card" aria-label="Détails de l’appareil"><div className="te-section-heading"><span className="te-step">03</span><h2>Les détails</h2></div>
              {distributionProduct ? <DistributionDetails onAdd={!distributionSegment ? () => addDistribution(distributionProduct.reference) : undefined} product={distributionProduct} row={distributionRow} segment={distributionSegment} panelIndex={activePanel} onRemove={distributionRow && distributionSegment ? () => removeDistribution(activePanel, distributionRow.id, distributionSegment.id) : undefined} /> : selected && selectedProduct ? <><div className="te-inspector-preview"><EquipmentFace product={selectedProduct} /><div><span className="te-badge">{selectedProduct.range ?? "RESI9 XE"}</span><h3>{selectedProduct.name}</h3><p>{selectedProduct.reference}</p><small>{selectedProduct.detail}</small><SupplierPrice referenceCode={selected.reference} /></div></div>
                <Field label="Étiquette de l’appareil"><input value={selected.label} placeholder={selectedProduct.name} maxLength={160} onChange={(e) => updateDevice({ label: e.target.value })} /></Field>
                {selectedProduct.kind === "breaker" ? <><Field label="Circuit associé"><select aria-label="Circuit associé" value={selected.circuitId} onChange={(e) => updateDevice({ circuitId: e.target.value })}><option value="">Aucun circuit</option>{workspace.circuits.map((c) => <option key={c.id} value={c.id} disabled={selected.secondCircuitId === c.id || panels.some((panel, index) => panel.devices.some((d) => !(index === activePanel && d.id === selected.id) && deviceCircuitIds(d).includes(c.id)))}>{c.name || "Circuit sans nom"}{c.usage === RELAY_LIGHTING_USAGE ? " · TL" : ""}</option>)}</select></Field>{supportsTwoDepartures(selected.reference) ? <Field label="Second circuit associé (facultatif)"><select aria-label="Second circuit associé (facultatif)" value={selected.secondCircuitId ?? ""} onChange={(e) => updateDevice({ secondCircuitId: e.target.value })}><option value="">Aucun second circuit</option>{workspace.circuits.map((c) => <option key={c.id} value={c.id} disabled={selected.circuitId === c.id || panels.some((panel, index) => panel.devices.some((d) => !(index === activePanel && d.id === selected.id) && deviceCircuitIds(d).includes(c.id)))}>{c.name || "Circuit sans nom"}{c.usage === RELAY_LIGHTING_USAGE ? " · TL" : ""}</option>)}</select></Field> : null}<Field label="Différentiel amont"><select value={selected.upstreamId} onChange={(e) => updateDevice({ upstreamId: e.target.value })}><option value="">Non défini</option>{project.devices.filter((d) => PRODUCT_BY_REF[d.reference].kind === "rcd").map((d) => <option key={d.id} value={d.id}>{d.label || PRODUCT_BY_REF[d.reference].name} · {project.rows.find((r) => r.id === d.rowId)?.name} / {d.slot + 1}</option>)}</select></Field></> : selectedProduct.kind === "impulse" ? <p className="te-info">Commande par boutons-poussoirs. Utilisez l’étiquette pour repérer le circuit commandé ; son câblage et sa protection restent à préciser.</p> : selectedProduct.kind === "spd" ? <p className="te-info">Protection contre les surtensions. Raccordement et liaison à la terre à prévoir selon la notice Schneider.</p> : <p className="te-info">Ce différentiel peut être choisi comme protection amont dans les détails de chaque disjoncteur.</p>}
                <Field label="Variante de l’appareil"><select value={selected.reference} onChange={(e) => updateDevice({ reference: e.target.value })}>{PRODUCTS.filter((p) => p.kind === selectedProduct.kind).map((p) => <option key={p.reference} value={p.reference}>{p.name}</option>)}</select></Field>
                <form className="te-move-form" key={`${selected.id}:${selected.rowId}:${selected.slot}`} onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); moveDevice(selected, String(data.get("row")), Number(data.get("position")) - 1); }}><Field label="Déplacer vers la rangée"><select name="row" defaultValue={selected.rowId}>{project.rows.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field><Field label="Position de départ"><input type="number" name="position" min={1} max={project.capacity} required defaultValue={selected.slot + 1} /></Field><button type="submit">Déplacer l’appareil →</button></form>
                <div className="te-inspector-actions"><button onClick={() => addDevice(selected.reference, selected.rowId)}>Dupliquer</button><button className="te-danger" onClick={() => { commit(removeDevice(project, selected.id), "Appareil supprimé. Ses circuits restent disponibles."); setSelectedId(""); }}>Supprimer</button></div><a className="te-source" href={selectedProduct.source} target="_blank" rel="noreferrer">Consulter la fiche Schneider ↗</a>
              </> : <div className="te-inspector-empty"><span aria-hidden="true">⌖</span><h3>Une place pour chaque détail.</h3><p>Sélectionnez un appareil dans le coffret pour le nommer, affecter son circuit ou le déplacer.</p><div>1. Ajoutez un appareil<br />2. Sélectionnez-le<br />3. Renseignez son circuit</div></div>}
            </aside>
          </div>
          <DragOverlay dropAnimation={null}>{activeDrag ? activeDrag.type === "distribution" ? <div className="te-distribution-ghost"><DistributionIllustration fit product={DISTRIBUTORS.find(p => p.reference === activeDrag.reference)!} /><span>{activeDrag.reference} · {DISTRIBUTORS.find(p => p.reference === activeDrag.reference)!.modules} M</span></div> : <div className="te-drag-ghost"><EquipmentFace product={PRODUCT_BY_REF[activeDrag.reference]} /><span>{PRODUCT_BY_REF[activeDrag.reference].name}</span></div> : null}</DragOverlay>
        </DndContext>
        <CommunicationEditor value={workspace.communication} onChange={(communication) => commitWorkspace({ ...workspace, communication })} />
        <section className="te-records te-card" aria-label="Dossier du tableau"><div className="te-records-header"><nav aria-label="Vues du dossier">{([["circuits", "Les circuits", workspace.circuits.length], ["singleLine", "Schéma unifilaire", assignedCircuitCount], ["materials", "Le matériel", materials.length], ["checks", "Points à vérifier", checks.length]] as const).map(([value, label, count]) => <button key={value} aria-pressed={view === value} onClick={() => setView(value)}>{label}<span>{count}</span></button>)}</nav><span>LE DOSSIER DE VOTRE TABLEAU</span></div>
          <section hidden={view !== "circuits"} className="te-record-content te-print-section"><h2>Les circuits de la maison</h2><p className="te-muted">Liste générale de la maison. Les circuits restent visibles quel que soit le tableau sélectionné. Affectez-les ensuite à un disjoncteur.</p>
            <form onSubmit={addCircuit} className="te-circuit-form"><Field label="Nom du circuit"><input name="name" required maxLength={160} placeholder="Ex. Prises du salon" /></Field><Field label="Pièce"><input name="room" maxLength={160} placeholder="Ex. Salon" list="te-rooms" /></Field><Field label="Niveau"><select name="floor"><option value="">À préciser</option><option>Sous-sol</option><option>Rez-de-chaussée</option><option>Étage</option><option>Grenier</option><option>Extérieur</option><option>Autre</option></select></Field><Field label="Usage"><CircuitUsage /></Field><button className="te-primary" type="submit">+ Ajouter un circuit</button></form>
            <datalist id="te-rooms">{["Entrée", "Bureau", "Salon", "Cuisine", "Salle à manger", "Chambre", "Salle d’eau", "Salle de bains", "Palier", "Extérieur"].map((room) => <option key={room} value={room} />)}</datalist>
            {!workspace.circuits.length ? <div className="te-empty-inline">Votre inventaire commence ici. Ajoutez le premier circuit de la maison.</div> : <>
              <div className="te-circuit-filters" aria-label="Filtrer les circuits">
                <Field label="Rechercher"><input type="search" value={circuitQuery} onChange={(event) => setCircuitQuery(event.target.value)} placeholder="Nom, pièce, usage…" /></Field>
                <Field label="Niveau"><select value={circuitFloor} onChange={(event) => setCircuitFloor(event.target.value)}><option value="">Tous les niveaux</option>{circuitFloors.map(floor => <option key={floor} value={floor}>{floor}</option>)}</select></Field>
                <Field label="Usage"><select value={circuitUsage} onChange={(event) => setCircuitUsage(event.target.value)}><option value="">Tous les usages</option>{circuitUsages.map(usage => <option key={usage} value={usage}>{usage}</option>)}</select></Field>
                <div className="te-circuit-assignment" role="group" aria-label="Affectation"><span>Affectation</span>{([ ["all", "Tous"], ["unassigned", "Non affectés"], ["assigned", "Affectés"] ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={circuitAssignment === value} onClick={() => setCircuitAssignment(value)}>{label}</button>)}</div>
                {hasCircuitFilters ? <button type="button" className="te-circuit-filter-reset" onClick={() => { setCircuitQuery(""); setCircuitFloor(""); setCircuitUsage(""); setCircuitAssignment("all"); }}>Réinitialiser</button> : null}
              </div>
              <p className="te-circuit-filter-count" role="status">{filteredCircuits.length} circuit{filteredCircuits.length > 1 ? "s" : ""} affiché{filteredCircuits.length > 1 ? "s" : ""} sur {workspace.circuits.length}</p>
              {!filteredCircuits.length ? <div className="te-empty-inline">Aucun circuit ne correspond à ces filtres.</div> : <CircuitReorderList onMove={moveCircuit}>{filteredCircuits.map(({ circuit, index }) => {
              const assignmentPanel = panels.findIndex(panel => panel.devices.some(device => deviceCircuitIds(device).includes(circuit.id)));
              const assignmentBoard = panels[assignmentPanel];
              const device = assignmentBoard?.devices.find(device => deviceCircuitIds(device).includes(circuit.id));
              return <CircuitDropRow key={circuit.id} id={circuit.id} room={circuit.room}><details className="te-circuit"><summary><CircuitDragHandle id={circuit.id} name={circuit.name} /><span className="te-circuit-num">C{String(index + 1).padStart(2, "0")}</span><span className="te-circuit-heading"><strong>{circuit.name || "Circuit sans nom"}</strong>{circuit.usage === RELAY_LIGHTING_USAGE ? <span className="te-circuit-tl" title="Éclairage commandé par télérupteur">TL · Télérupteur</span> : null}<small className="te-circuit-description">{[circuit.usage, circuit.load, circuit.cable].filter(Boolean).join(" · ")}</small></span><span>{[circuit.room, circuit.floor].filter(Boolean).join(" · ")}</span><em className={device ? "te-circuit-assigned" : "te-circuit-unassigned"}>{device ? `Tableau ${assignmentPanel + 1} · ${PRODUCT_BY_REF[device.reference].short} · ${assignmentBoard.rows.find((r) => r.id === device.rowId)?.name} / ${device.slot + 1}` : "⚠ Non affecté"}</em><span className="te-circuit-actions"><button type="button" aria-label={`Dupliquer le circuit ${circuit.name}`} disabled={workspace.circuits.length >= 600} onClick={(event) => { event.preventDefault(); event.stopPropagation(); duplicateCircuit(circuit.id); }}>Dupliquer</button></span><span aria-hidden="true">＋</span></summary><div className="te-circuit-fields">
                <Field label="Nom"><input value={circuit.name} maxLength={160} onChange={(e) => editCircuit(circuit.id, { name: e.target.value })} /></Field><Field label="Pièce"><input value={circuit.room} maxLength={160} onChange={(e) => editCircuit(circuit.id, { room: e.target.value })} /></Field><Field label="Niveau"><input value={circuit.floor} maxLength={160} onChange={(e) => editCircuit(circuit.id, { floor: e.target.value })} /></Field><Field label="Usage"><CircuitUsage value={circuit.usage} onChange={(usage) => editCircuit(circuit.id, { usage })} /></Field><Field label="Puissance connue (saisie libre)"><input value={circuit.load} placeholder="Ex. 2 000 W" maxLength={160} onChange={(e) => editCircuit(circuit.id, { load: e.target.value })} /></Field><Field label="Section du câble"><CableSection value={circuit.cable} onChange={(cable) => editCircuit(circuit.id, { cable })} /></Field><button className="te-danger" onClick={() => removeCircuit(circuit.id)}>Supprimer le circuit</button>
              </div><div className="te-circuit-print">{[circuit.usage, circuit.load, circuit.cable].filter(Boolean).join(" · ")}</div></details></CircuitDropRow>;
              })}</CircuitReorderList>}
            </>}
          </section>
          <section hidden={view !== "singleLine"} className="te-record-content te-print-section"><h2>Schéma unifilaire</h2><p className="te-muted">Lecture de la configuration saisie : alimentation, différentiels, disjoncteurs et circuits associés. Les liens non renseignés restent explicitement indiqués. Ce document de préparation ne remplace ni un schéma de câblage, ni une vérification réglementaire.</p><SingleLineDiagram project={workspace} /></section>
          <section hidden={view !== "materials"} className="te-record-content te-print-section"><div className="te-output-heading"><div><h2>La liste du matériel</h2><p className="te-muted">Prix unitaires TTC Elec44, 123elec et Elecdirect · dates de relevé sur les liens de prix · hors livraison. Les éléments non chiffrés sont exclus de chaque sous-total. Assemblage à vérifier avant commande.</p></div><button onClick={() => download(materialsCsv(materials), "materiel-tableau.csv", "text/csv;charset=utf-8")}>Exporter CSV ↓</button></div>
            <div className="te-table-scroll"><table><thead><tr><th>Référence</th><th>Désignation</th><th>Quantité</th>{SUPPLIERS.map(s => <th key={s.id}>{s.name} TTC</th>)}{SUPPLIERS.map(s => <th key={s.id}>Total {s.name}</th>)}<th>État</th></tr></thead><tbody>{materials.map((m, i) => <tr key={i}><td>{m.source ? <a href={m.source} target="_blank" rel="noreferrer">{m.reference} ↗</a> : m.reference}</td><td>{m.name}</td><td>{m.quantity}</td>{SUPPLIERS.map(s => <td key={s.id}><SupplierPrice referenceCode={m.reference} supplier={s.id} /></td>)}{SUPPLIERS.map(s => { const cents = supplierPrice(m.reference, s.id)?.unitPriceCents; return <td key={s.id} className="te-price-total">{cents == null ? "Non chiffré" : formatPrice(cents * m.quantity)}</td>; })}<td>{m.status}</td></tr>)}</tbody><tfoot>{budgets.map(b => <tr key={b.id}><th colSpan={3 + SUPPLIERS.length}>{b.missingQuantity ? "Sous-total connu TTC" : "Total estimé TTC"} · {b.name}</th>{SUPPLIERS.map(s => <td key={s.id} className="te-price-total">{s.id === b.id ? formatPrice(b.totalCents) : "—"}</td>)}<td>{b.missingQuantity ? `${b.missingQuantity} élément(s) non chiffré(s)` : "Tous les éléments chiffrés"}</td></tr>)}</tfoot></table></div>
            <h3>Accessoires complémentaires</h3><p className="te-muted">Ajoutez les borniers, obturateurs et liaisons identifiés lors de l’étude. Ces lignes ne valident aucune compatibilité.</p><form className="te-accessory-form" onSubmit={(e) => { e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); if (commit({ ...project, accessories: [...project.accessories, { id: uid(), reference: String(data.get("reference") ?? ""), name: String(data.get("name") ?? ""), quantity: Number(data.get("quantity")) }] }, "Accessoire ajouté à la liste.")) form.reset(); }}><Field label="Désignation"><input name="name" required maxLength={160} /></Field><Field label="Référence (facultative)"><input name="reference" maxLength={80} /></Field><Field label="Quantité"><input name="quantity" type="number" required min={1} max={999} defaultValue={1} /></Field><button type="submit">+ Ajouter l’accessoire</button></form>
            <ul className="te-accessory-list">{project.accessories.map((a) => <li key={a.id}><span>{a.quantity} × {a.name} {a.reference ? `· ${a.reference}` : ""}</span><button className="te-danger" aria-label={`Retirer ${a.name}`} onClick={() => commit({ ...project, accessories: project.accessories.filter((x) => x.id !== a.id) })}>Retirer</button></li>)}</ul>
          </section>
          <section hidden={view !== "checks"} className="te-record-content te-print-section"><h2>Les points à vérifier</h2><p className="te-muted">Ce suivi repère les informations manquantes. Il ne calcule pas la conformité électrique.</p><ul className="te-checks">{checks.map((message, i) => <li key={i}><span aria-hidden="true">!</span>{message}</li>)}</ul></section>
        </section>
        <div className="te-bottom-note"><p><strong>Un outil pour préparer votre projet.</strong> L’alimentation réelle, l’assemblage XE et le dimensionnement restent à confirmer avec votre électricien. Lorsque le stockage partagé est configuré, votre configuration se synchronise automatiquement entre les appareils. L’accès est libre, sans compte ni mot de passe. Une copie locale et l’export JSON restent disponibles.</p><button className="te-reset" onClick={() => { if (window.confirm("Créer un tableau vide ? Vous pourrez annuler cette action. Pensez à exporter votre projet.")) { commit(emptyProject(), "Nouveau tableau créé."); setSelectedId(""); } }}>Nouveau tableau</button></div>
      </>}
    </main><footer className="te-footer"><span>MAISON 1973</span><span>Un projet de rénovation, circuit par circuit.</span></footer>
  </div>;
}
