import { DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, pointerWithin, useDraggable, useDroppable, useSensor, useSensors, type KeyboardCoordinateGetter } from "@dnd-kit/core";
import { useRef, useState, type ReactNode } from "react";

export function CircuitReorderList({ children, onMove }: { children: ReactNode; onMove: (id: string, targetId: string) => void }) {
  const [activeName, setActiveName] = useState("");
  const keyboardTarget = useRef<string | null>(null);
  const circuitKeyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates, context }) => {
    if (!["ArrowUp", "ArrowDown"].includes(event.code)) return;
    event.preventDefault();
    const entries = [...context.droppableRects.entries()].sort((a, b) => a[1].top - b[1].top);
    const index = entries.findIndex(([id]) => String(id) === keyboardTarget.current);
    const next = entries[index + (event.code === "ArrowUp" ? -1 : 1)];
    if (!next || index < 0) return currentCoordinates;
    keyboardTarget.current = String(next[0]);
    return { x: currentCoordinates.x, y: currentCoordinates.y + next[1].top - entries[index][1].top };
  };
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 7 } }), useSensor(KeyboardSensor, { coordinateGetter: circuitKeyboardCoordinates }));
  return <DndContext id="circuit-reorder" sensors={sensors} collisionDetection={args => args.pointerCoordinates ? pointerWithin(args) : keyboardTarget.current ? [{ id: keyboardTarget.current }] : closestCenter(args)}
    onDragStart={event => { keyboardTarget.current = String(event.active.id); setActiveName(String(event.active.data.current?.name ?? "Circuit")); }}
    onDragCancel={() => setActiveName("")}
    onDragEnd={event => { setActiveName(""); if (event.over && event.active.id !== event.over.id) onMove(String(event.active.id), String(event.over.id)); }}
    accessibility={{ screenReaderInstructions: { draggable: "Espace pour saisir le circuit, flèches haut et bas pour choisir sa place, Espace pour déposer, Échap pour annuler." } }}>
    <div className="te-circuit-list">{children}</div>
    <DragOverlay dropAnimation={null}>{activeName ? <div className="te-circuit-drag-preview"><span aria-hidden="true">⠿</span><strong>{activeName}</strong></div> : null}</DragOverlay>
  </DndContext>;
}

function roomTone(room: string) {
  const normalized = room.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!normalized) return "neutral";
  if (/chambre|suite/.test(normalized)) return "lavender";
  if (/bain|eau|douche|wc|toilette/.test(normalized)) return "blue";
  if (/cuisine/.test(normalized)) return "peach";
  if (/salon|sejour|manger/.test(normalized)) return "sage";
  if (/bureau/.test(normalized)) return "yellow";
  if (/entree|couloir|palier|escalier/.test(normalized)) return "rose";
  if (/garage|atelier|cave|sous sol/.test(normalized)) return "slate";
  if (/grenier|comble/.test(normalized)) return "sand";
  if (/exterieur|jardin|terrasse/.test(normalized)) return "mint";
  const tones = ["lavender", "blue", "peach", "sage", "yellow", "rose", "slate", "sand", "mint"];
  let hash = 0;
  for (const letter of normalized) hash = (hash * 31 + letter.charCodeAt(0)) >>> 0;
  return tones[hash % tones.length];
}

export function CircuitDropRow({ id, room, children }: { id: string; room: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={`te-circuit-drop-row te-room-${roomTone(room)} ${isOver ? "over" : ""}`}>{children}</div>;
}

export function CircuitDragHandle({ id, name }: { id: string; name: string }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id, data: { name } });
  return <button type="button" ref={setNodeRef} {...attributes} {...listeners} className={`te-circuit-drag-handle ${isDragging ? "dragging" : ""}`} aria-label={`Déplacer le circuit ${name}`} title="Glisser pour réorganiser" onClick={event => { event.preventDefault(); event.stopPropagation(); }}><span aria-hidden="true">⠿</span></button>;
}
