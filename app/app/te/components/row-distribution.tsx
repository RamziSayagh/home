import { useDraggable, useDroppable } from "@dnd-kit/core";
import { DISTRIBUTORS } from "../data/catalog";
import { rowDistributions, type Distribution, type Row } from "../lib/model";
import DistributionIllustration from "./distribution-illustration";
import SupplierPrice from "./supplier-price";

export type DistributionDrag = { type: "distribution"; reference: string; distributionId?: string; rowId?: string; panelIndex?: number };
export type DistributionTarget = { type: "distribution"; rowId: string; panelIndex: number; slot: number };

export function DistributionCatalogCard({ product, onSelect }: { product: typeof DISTRIBUTORS[number]; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `distribution-catalog:${product.reference}`, data: { type: "distribution", reference: product.reference } satisfies DistributionDrag });
  return <div ref={setNodeRef} className={`te-distribution-catalog-card ${isDragging ? "dragging" : ""}`}>
    <button type="button" className="te-distribution-catalog-handle" {...attributes} {...listeners} aria-label={`Glisser ${product.reference}`} onClick={onSelect} onKeyDown={event => { if (!isDragging && event.key === "Enter") { event.preventDefault(); onSelect(); } else listeners?.onKeyDown?.(event); }}><DistributionIllustration fit product={product} /></button>
    <div className="te-distribution-product"><button type="button" className="te-distribution-catalog-title" onClick={onSelect} aria-label={`Voir la fiche ${product.reference}`}><h3>{product.kind === "comb" ? "Peigne XP" : "Répartiteur XE"} · {product.modules} modules</h3></button><p>{product.kind === "xe" ? product.connector ? "Avec connecteur" : "Sans connecteur" : "1P+N · 63 A"}</p><small>{product.reference}</small><SupplierPrice referenceCode={product.reference} /></div>
  </div>;
}

function DistributionSlot({ rowId, panelIndex, slot }: DistributionTarget) {
  const { setNodeRef, isOver } = useDroppable({ id: `distribution-slot:${panelIndex}:${rowId}:${slot}`, data: { type: "distribution", rowId, panelIndex, slot } satisfies DistributionTarget });
  return <div ref={setNodeRef} className={`te-distribution-slot ${isOver ? "over" : ""}`} style={{ gridColumn: slot + 1 }} data-slot={slot} aria-hidden="true" />;
}

function PlacedDistribution({ segment, row, panelIndex, onRemove, onMove, onSelect, selected }: { segment: Distribution; row: Row; panelIndex: number; onRemove: () => void; onMove: (slot: number) => void; onSelect: () => void; selected: boolean }) {
  const product = DISTRIBUTORS.find(p => p.reference === segment.reference)!;
  const label = `${product.reference}, positions ${segment.slot + 1} à ${segment.slot + product.modules}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `distribution:${panelIndex}:${row.id}:${segment.id}`, data: { type: "distribution", reference: segment.reference, distributionId: segment.id, rowId: row.id, panelIndex } satisfies DistributionDrag });
  return <div ref={setNodeRef} className={`te-distributor-line te-distribution-segment ${product.kind === "comb" ? "te-comb-line" : ""} ${isDragging ? "dragging" : ""} ${selected ? "selected" : ""}`} style={{ gridColumn: `${segment.slot + 1} / span ${product.modules}` }} data-distribution-id={segment.id} data-reference={segment.reference} data-slot={segment.slot} title={label}>
    <button type="button" className="te-distribution-handle" {...attributes} {...listeners} aria-label={`Déplacer ${label}`} aria-pressed={selected} onClick={onSelect} onKeyDown={event => {
      if (!isDragging && event.key === "Enter") { event.preventDefault(); onSelect(); return; }
      if (!isDragging && ["ArrowLeft", "ArrowRight", "Delete", "Backspace"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "Delete" || event.key === "Backspace") onRemove();
        else onMove(segment.slot + (event.key === "ArrowLeft" ? -1 : 1));
      } else listeners?.onKeyDown?.(event);
    }}><DistributionIllustration fit product={product} /><span>{product.reference} <small>· {product.modules} M · {segment.slot + 1}–{segment.slot + product.modules}</small></span></button>
    <button type="button" className="te-distribution-remove" aria-label={`Supprimer ${product.reference} en position ${segment.slot + 1} de ${row.name}`} onClick={onRemove} title="Supprimer ce répartiteur">×</button>
  </div>;
}

type Props = { row: Row; capacity: number; panelIndex: number; preview?: { slot: number; modules: number; error: boolean }; selectedId?: string; onSelect: (segment: Distribution) => void; onRemove: (id: string) => void; onMove: (id: string, slot: number) => void };

export default function RowDistribution({ row, capacity, panelIndex, preview, selectedId, onSelect, onRemove, onMove }: Props) {
  const segments = rowDistributions(row);
  return <div className="te-distributor">
    <div className="te-distribution-track" style={{ gridTemplateColumns: `repeat(${capacity}, minmax(0, 1fr))` }} aria-label={`Distribution de ${row.name}`}>
      {Array.from({ length: capacity }, (_, slot) => <DistributionSlot key={slot} type="distribution" rowId={row.id} panelIndex={panelIndex} slot={slot} />)}
      {!segments.length && <span className="te-distribution-empty">Glissez un répartiteur ou un peigne ici</span>}
      {segments.map(segment => <PlacedDistribution key={segment.id} segment={segment} row={row} panelIndex={panelIndex} selected={selectedId === segment.id} onSelect={() => onSelect(segment)} onRemove={() => onRemove(segment.id)} onMove={slot => onMove(segment.id, slot)} />)}
      {preview && preview.slot >= 0 && preview.slot < capacity && <div className={`te-distribution-preview ${preview.error ? "invalid" : ""}`} style={{ gridColumn: `${preview.slot + 1} / span ${Math.min(preview.modules, capacity - preview.slot)}` }}>{preview.error ? "Indisponible" : "Déposer ici"}</div>}
    </div>
  </div>;
}
