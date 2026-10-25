import { DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, pointerWithin, rectIntersection, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useState, type ReactNode } from "react";
import GtlIllustration from "./gtl-illustration";
import { enclosureReference, GTL_ACCESSORIES, GTL_OPTIONS, manufacturerUrl, type GtlReference } from "../data/catalog";
import type { Gtl, GtlUnit } from "../lib/model";
import SupplierPrice from "./supplier-price";
import GtlElevation, { DEFAULT_HEIGHTS_CM, enclosureHeightCm } from "./gtl-elevation";

type Item = { type: "kit" | "panel" | "accessory"; reference: string; unitId?: string };
type Geometry = { capacity: number; rows: number };
type Props = {
  value?: Gtl; primaryGeometry: Geometry; secondaryGeometry?: Geometry;
  hasSecondPanel: boolean; communicationEnabled: boolean;
  onPlaceCommunication: (unitId: string) => void;
  onChange: (next: Gtl | undefined) => void;
  onResizePanel: (panel: "primary" | "secondary", rows: number, capacity: number) => string | null;
};
const panels = [{ key: "primary", label: "Tableau 1" }, { key: "secondary", label: "Tableau 2" }, { key: "communication", label: "Coffret communication" }] as const;

function ItemCard({ id, item, title, children, selected, onSelect, onRemove }: { id: string; item: Item; title: string; children: ReactNode; selected: boolean; onSelect: () => void; onRemove?: () => void }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id, data: item });
  return <article className={`te-gtl-item ${onRemove ? "te-gtl-mounted-card" : "te-gtl-palette-card"} ${selected ? "selected" : ""} ${isDragging ? "dragging" : ""}`}>
    <button type="button" className="te-gtl-item-handle" ref={setNodeRef} {...listeners} {...attributes} aria-label={`Glisser ${title}`} onClick={onSelect}>{children}</button>
    <button type="button" className="te-gtl-item-title" onClick={onSelect} aria-label={`Voir les détails de ${title}`} aria-pressed={selected}>{title}</button>
    {onRemove ? <button type="button" className="te-gtl-item-remove" aria-label={`Retirer ${title} du plan`} onClick={onRemove}>×</button> : null}
  </article>;
}
function DropZone({ id, accepts, children, className = "" }: { id: string; accepts: "kit" | "equipment"; children: ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { accepts } });
  return <div ref={setNodeRef} data-gtl-target={id} className={`te-gtl-drop ${isOver ? "over" : ""} ${className}`}>{children}</div>;
}

export default function GtlEditor({ value, primaryGeometry, secondaryGeometry, hasSecondPanel, communicationEnabled, onPlaceCommunication, onChange, onResizePanel }: Props) {
  const [active, setActive] = useState<Item | null>(null);
  const [selection, setSelection] = useState<Item | null>(null);
  const [resizeError, setResizeError] = useState("");
  const [resizeConfirmation, setResizeConfirmation] = useState("");
  const [message, setMessage] = useState("Glissez un kit dans un emplacement, puis ajoutez ses coffrets et accessoires.");
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 7 } }), useSensor(KeyboardSensor));
  const units = value?.units ?? [];
  const placements = value?.placements ?? { primary: "", secondary: "", communication: "" };
  const current: Gtl = value ?? { units: [], placements };
  const heights = current.heightsCm ?? DEFAULT_HEIGHTS_CM;
  const geometry = (item: Item) => item.reference === "secondary" ? secondaryGeometry ?? primaryGeometry : primaryGeometry;
  const title = (item: Item) => item.type === "kit" ? `GTL ${item.reference === "R9HKT13" ? 13 : 18} modules` : item.type === "panel" ? panels.find(panel => panel.key === item.reference)?.label ?? item.reference : GTL_ACCESSORIES.find(option => option.reference === item.reference)?.name ?? item.reference;
  const priceReference = (item: Item) => item.type === "panel" ? (item.reference === "communication" ? "" : enclosureReference(geometry(item).rows, geometry(item).capacity) ?? "") : item.reference;
  const illustration = (item: Item) => <GtlIllustration type={item.type} reference={item.reference} communication={item.reference === "communication"} modules={item.type === "kit" ? (item.reference === "R9HKT18" ? 18 : 13) : geometry(item).capacity} rows={geometry(item).rows} />;
  const setUnit = (unit: GtlUnit) => onChange({ ...current, units: units.map(item => item.id === unit.id ? unit : item) });
  function removeUnit(unitId: string) {
    const nextUnits = units.filter(unit => unit.id !== unitId);
    onChange(nextUnits.length ? { ...current, units: nextUnits, placements: { primary: placements.primary === unitId ? "" : placements.primary, secondary: placements.secondary === unitId ? "" : placements.secondary, communication: placements.communication === unitId ? "" : placements.communication } } : undefined);
    setSelection(null);
  }
  function removeItem(item: Item) {
    if (item.type === "kit" && item.unitId) removeUnit(item.unitId);
    else if (item.type === "panel") onChange({ ...current, placements: { ...placements, [item.reference]: "" } });
    else {
      const unit = units.find(unit => unit.id === item.unitId);
      if (unit) setUnit({ ...unit, accessories: unit.accessories.filter(accessory => accessory.reference !== item.reference) });
    }
    setSelection(null);
    setMessage("Élément retiré du plan. Vous pouvez annuler cette action.");
  }
  function place(item: Item, target: string) {
    if (item.type === "kit") {
      if (!target.startsWith("slot:")) return;
      // Append to the first available position even if the user drops in the right-hand slot first.
      if (units.length >= 2) { setMessage("Deux GTL maximum. Retirez une GTL avant d'en ajouter une autre."); return; }
      const unit: GtlUnit = { id: crypto.randomUUID(), reference: item.reference as GtlReference, quantity: 1, accessories: [] };
      onChange({ ...current, units: [...units, unit] });
      setSelection({ ...item, unitId: unit.id });
    } else {
      const unit = units.find(unit => `unit:${unit.id}` === target);
      if (!unit) return;
      if (item.type === "panel") {
        if (item.reference === "communication") onPlaceCommunication(unit.id);
        else onChange({ ...current, placements: { ...placements, [item.reference]: unit.id } });
      } else {
        const accessory = GTL_ACCESSORIES.find(option => option.reference === item.reference);
        if (!accessory || accessory.compatibleWith !== unit.reference) { setMessage("Cet accessoire ne correspond pas à la largeur de cette GTL."); return; }
        const source = item.unitId ? units.find(candidate => candidate.id === item.unitId) : undefined;
        if (source?.id === unit.id) return;
        const quantity = source?.accessories.find(accessory => accessory.reference === item.reference)?.quantity ?? 1;
        if ((unit.accessories.find(accessory => accessory.reference === item.reference)?.quantity ?? 0) + quantity > 99) { setMessage("La quantité maximale est de 99."); return; }
        onChange({ ...current, units: units.map(candidate => candidate.id === unit.id ? { ...candidate, accessories: candidate.accessories.some(accessory => accessory.reference === item.reference) ? candidate.accessories.map(accessory => accessory.reference === item.reference ? { ...accessory, quantity: accessory.quantity + quantity } : accessory) : [...candidate.accessories, { reference: accessory.reference, quantity }] } : candidate.id === source?.id ? { ...candidate, accessories: candidate.accessories.filter(accessory => accessory.reference !== item.reference) } : candidate) });
      }
      setSelection({ ...item, unitId: unit.id });
    }
    setMessage("Élément placé. Cliquez dessus pour voir ses détails.");
  }
  function drop(event: DragEndEvent) {
    const item = event.active.data.current as Item | undefined;
    setActive(null);
    if (item && event.over) place(item, String(event.over.id));
  }
  const selectedUnit = selection?.unitId ? units.find(unit => unit.id === selection.unitId) : undefined;
  const selected = selection && (!selection.unitId || selectedUnit) ? selection : null;
  function resizeSelected(rows: number, capacity: number) {
    if (!selected || selected.type !== "panel" || selected.reference === "communication") return;
    const error = onResizePanel(selected.reference as "primary" | "secondary", rows, capacity);
    setResizeError(error ? `Impossible de passer à ${rows} rangée${rows > 1 ? "s" : ""} : ${error}` : "");
    setResizeConfirmation(error ? "" : `${title(selected)} : ${rows} rangée${rows > 1 ? "s" : ""} de ${capacity} modules appliquée${rows > 1 ? "s" : ""}.`);
  }
  const renderCard = (item: Item, id: string, mounted = false) => <ItemCard key={id} id={id} item={item} title={title(item)} selected={selected?.type === item.type && selected.reference === item.reference && selected.unitId === item.unitId} onSelect={() => { setSelection(item); setResizeError(""); setResizeConfirmation(""); }} onRemove={mounted ? () => removeItem(item) : undefined}>{illustration(item)}</ItemCard>;

  return <section className="te-communication te-card te-gtl te-gtl-step" aria-label="Étape 1 : configuration GTL">
    <div className="te-section-heading"><span className="te-step">01</span><h2>Composez la GTL</h2></div>
    <p className="te-muted">Glissez les illustrations vers le plan. Cliquez sur un élément pour afficher sa fiche à droite.</p>
    <p className="te-gtl-height-info">Hauteurs depuis le sol fini : repères à <strong>90 cm et 180 cm pour les manettes</strong>, pas pour les bords du coffret. Pour les disjoncteurs divisionnaires, le minimum peut être de 50 cm avec une porte. Le dessin permet de préparer l’implantation ; la hauteur exacte des manettes reste à vérifier. <a href="https://assets.legrand.com/editorial/legrandfr/outils/documentations-et-guides/guide-electricite.pdf" target="_blank" rel="noreferrer">Guide des hauteurs Legrand ↗</a></p>
    <DndContext id="gtl-editor" sensors={sensors} collisionDetection={args => {
      const type = (args.active.data.current as Item).type;
      const filtered = { ...args, droppableContainers: args.droppableContainers.filter(container => container.data.current?.accepts === (type === "kit" ? "kit" : "equipment")) };
      return args.pointerCoordinates ? pointerWithin(filtered) : rectIntersection(filtered);
    }} onDragStart={event => setActive(event.active.data.current as Item)} onDragEnd={drop} onDragCancel={() => setActive(null)}>
      <div className="te-gtl-studio">
        <aside className="te-gtl-palette" aria-label="Éléments à glisser"><h3>Kits GTL</h3>{GTL_OPTIONS.map(option => renderCard({ type: "kit", reference: option.reference }, `kit:${option.reference}`))}<h3>Coffrets</h3>{panels.filter(panel => panel.key !== "secondary" || hasSecondPanel).map(panel => renderCard({ type: "panel", reference: panel.key }, `panel:${panel.key}`))}<h3>Accessoires</h3>{GTL_ACCESSORIES.map(option => renderCard({ type: "accessory", reference: option.reference }, `accessory:${option.reference}`))}</aside>
        <div className="te-gtl-canvas" aria-label="Plan de positionnement GTL">{[0, 1].map(index => {
          const unit = units[index];
          if (!unit) return <DropZone key={index} id={`slot:${index}`} accepts="kit" className="empty">{illustration({ type: "kit", reference: "R9HKT13" })}<strong>Déposez une GTL {index + 1}</strong><span>13 ou 18 modules</span></DropZone>;
          return <DropZone key={unit.id} id={`unit:${unit.id}`} accepts="equipment" className="filled">
            <header className="te-gtl-rail"><button onClick={() => setSelection({ type: "kit", reference: unit.reference, unitId: unit.id })}>GTL {index + 1} · {unit.reference}</button><button aria-label={`Retirer GTL ${index + 1}`} onClick={() => removeUnit(unit.id)}>×</button></header>
            <GtlElevation cabinets={panels.filter(panel => placements[panel.key] === unit.id && (panel.key !== "secondary" || hasSecondPanel) && (panel.key !== "communication" || communicationEnabled)).map(panel => ({ key: panel.key, label: panel.key === "primary" ? "T1" : "T2", bottom: heights[panel.key], height: panel.key === "communication" ? null : enclosureHeightCm(geometry({ type: "panel", reference: panel.key }).rows), modules: geometry({ type: "panel", reference: panel.key }).capacity }))} />
            <div className="te-gtl-mounted">{panels.filter(panel => (panel.key !== "secondary" || hasSecondPanel) && (panel.key !== "communication" || communicationEnabled) && placements[panel.key] === unit.id).map(panel => renderCard({ type: "panel", reference: panel.key, unitId: unit.id }, `mounted:${panel.key}`, true))}{unit.accessories.map(accessory => renderCard({ type: "accessory", reference: accessory.reference, unitId: unit.id }, `mounted:${unit.id}:${accessory.reference}`, true))}<em>Déposez les coffrets et accessoires ici</em></div>
            <footer><span>{unit.reference === "R9HKT13" ? 13 : 18} modules</span><SupplierPrice referenceCode={unit.reference} /></footer>
          </DropZone>;
        })}</div>
        <aside className="te-gtl-details te-card" aria-label="Détails de l’élément GTL"><h3>Les détails</h3>{selected ? <>
          <div className="te-gtl-detail-image">{illustration(selected)}</div><h4>{title(selected)}</h4>
          {priceReference(selected) ? <><p>{priceReference(selected)}</p><SupplierPrice referenceCode={priceReference(selected)} /><a href={manufacturerUrl(priceReference(selected))} target="_blank" rel="noreferrer">Fiche Schneider ↗</a></> : <p>{selected.reference === "communication" ? "Référence et équipement à renseigner dans le coffret de communication." : "Référence de coffret à confirmer pour ces dimensions."}</p>}
          {selected.type === "panel" && selected.reference !== "communication" ? <div className="te-gtl-dimensions">
            <p>Hauteur du coffret : <strong>{enclosureHeightCm(geometry(selected).rows) === null ? "à confirmer pour ce modèle" : `${enclosureHeightCm(geometry(selected).rows)} cm`}</strong><br />Largeur : {geometry(selected).capacity === 13 ? "25,2" : "35,7"} cm · profondeur sans porte : 10,8 cm.</p>
            <label className="te-field"><span>Largeur du tableau</span><select value={geometry(selected).capacity} onChange={event => resizeSelected(geometry(selected).rows, Number(event.target.value))}><option value={13}>13 modules</option><option value={18}>18 modules</option></select></label>
            <label className="te-field"><span>Rangées du tableau</span><select value={geometry(selected).rows} onChange={event => resizeSelected(Number(event.target.value), geometry(selected).capacity)}>{[1, 2, 3, 4].map(rows => <option key={rows} value={rows}>{rows} rangée{rows > 1 ? "s" : ""}</option>)}</select></label>
            {resizeError ? <p role="alert">{resizeError}</p> : null}
            {resizeConfirmation ? <p role="status">{resizeConfirmation}</p> : null}
          </div> : null}
          {selected.type === "panel" && selectedUnit ? <label className="te-field"><span>Bas du coffret depuis le sol fini (cm)</span><input type="number" min={0} max={240} step={1} value={heights[selected.reference as keyof typeof heights]} onChange={event => { const height = Number(event.target.value); if (Number.isInteger(height) && height >= 0 && height <= 240) onChange({ ...current, heightsCm: { ...heights, [selected.reference]: height } }); }} /></label> : null}
          {selected.type === "panel" && selected.reference !== "communication" && selectedUnit && enclosureHeightCm(geometry(selected).rows) !== null ? <p>Haut du coffret : {heights[selected.reference as keyof typeof heights] + enclosureHeightCm(geometry(selected).rows)!} cm du sol fini. Cette cote ne correspond pas à celle des manettes.</p> : null}
          {selectedUnit ? <><p>Position : GTL {units.indexOf(selectedUnit) + 1}</p><button className="te-danger" onClick={() => removeItem(selected)}>Retirer du plan</button></> : selected.type === "kit" ? <button disabled={units.length >= 2} onClick={() => place(selected, "slot:0")}>Ajouter au plan</button> : units.map((unit, index) => <button key={unit.id} onClick={() => place(selected, `unit:${unit.id}`)}>Placer sur GTL {index + 1}</button>)}
        </> : <p>Sélectionnez une GTL, un coffret ou un accessoire pour afficher ses détails.</p>}</aside>
      </div>
      <DragOverlay dropAnimation={null}>{active ? <div className="te-gtl-drag-ghost">{illustration(active)}<span>{title(active)}</span></div> : null}</DragOverlay>
    </DndContext>
    <p className="te-gtl-feedback" role="status">{message}</p>
  </section>;
}
