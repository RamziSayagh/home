"use client";

import { useState, type ReactNode } from "react";
import { canPlace, type RackConfig, type RackItem } from "./rack-model";

type Props = {
  config: RackConfig;
  disabled: boolean;
  renderFace: (item: RackItem) => ReactNode;
  onMove: (id: string, slot: number) => void;
  onRemove: (id: string) => void;
};

export default function RackCabinet({ config, disabled, renderFace, onMove, onRemove }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const selected = config.items.find(item => item.id === selectedId);
  function place(id: string, slot: number) {
    const item = config.items.find(entry => entry.id === id);
    if (!item || disabled) return;
    if (!canPlace(config, item.units, slot, id)) {
      setNotice("Cet emplacement ne laisse pas assez d’unités libres pour cet équipement.");
      return;
    }
    onMove(id, slot);
    setSelectedId(id);
    setNotice(`${item.name} placé en U${config.height - slot - item.units + 1}.`);
  }
  return <>
    <div className="cabinet-scene">
      <div className="cabinet-dimension"><span>19 pouces</span></div>
      <div className="cabinet-shell">
        <div className="cabinet-crown"><span>MAISON 1973</span><span>{config.height} U <i aria-hidden="true" /></span></div>
        <div className="rack-frame" style={{ aspectRatio: `10 / ${config.height}`, gridTemplateRows: `repeat(${config.height}, minmax(0, 1fr))` }} aria-label={`Baie de ${config.height} unités`}>
          {Array.from({ length: config.height }, (_, slot) => {
            const occupant = config.items.find(item => slot >= item.slot && slot < item.slot + item.units);
            const possible = selected && canPlace(config, selected.units, slot, selected.id);
            return <div className="cabinet-unit" key={slot} style={{ gridRow: slot + 1 }}>
              <span className="cabinet-rail"><b>{config.height - slot}</b><i /><i /><i /></span>
              <button className="cabinet-slot" disabled={disabled} aria-label={`U${config.height - slot}${occupant ? ` : ${occupant.name}` : " libre"}`} data-available={!!possible}
                onClick={() => { if (occupant) setSelectedId(occupant.id); else if (selected) place(selected.id, slot); else setNotice("Ajoutez un équipement depuis le catalogue, puis sélectionnez-le pour le déplacer."); }}
                onDragOver={event => { if (!disabled) event.preventDefault(); }}
                onDrop={event => { event.preventDefault(); place(event.dataTransfer.getData("text/plain"), slot); }}>
                {!occupant && <span aria-hidden="true">{selected && possible ? "Placer ici" : ""}</span>}
              </button>
              <span className="cabinet-rail cabinet-rail-right" aria-hidden="true"><i /><i /><i /></span>
            </div>;
          })}
          {config.items.map(item => <button key={item.id} className="rack-device" data-id={item.id} data-slot={item.slot} data-units={item.units}
            style={{ gridRow: `${item.slot + 1} / span ${item.units}`, gridColumn: 2 }}
            aria-label={`${item.name}, ${item.units} U, position U${config.height - item.slot - item.units + 1}`} aria-pressed={selectedId === item.id}
            disabled={disabled} draggable={!disabled} title={`${item.name} · cliquer pour modifier`}
            onClick={() => { setSelectedId(item.id); setNotice(""); }}
            onDragStart={event => { event.dataTransfer.setData("text/plain", item.id); event.dataTransfer.effectAllowed = "move"; setSelectedId(item.id); }}
            onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); place(event.dataTransfer.getData("text/plain"), item.slot); }}>
            {renderFace(item)}
          </button>)}
        </div>
        <div className="cabinet-plinth"><span /> <span /></div>
      </div>
      <div className="cabinet-feet" aria-hidden="true"><i /><i /></div>
      {!config.items.length && <p className="cabinet-empty">Votre baie est prête.<br />Ajoutez votre premier équipement au catalogue.</p>}
    </div>
    <div className="cabinet-inspector">
      {selected ? <><div className="cabinet-inspector-heading"><div><span className="rack-tag">ÉQUIPEMENT SÉLECTIONNÉ · {selected.units} U</span><h3>{selected.name}</h3><p>{selected.reference}</p></div><button type="button" aria-label="Fermer la sélection" onClick={() => setSelectedId(null)}>×</button></div>
        <div className="cabinet-controls"><label>Position basse dans la baie<select aria-label="Position de l’équipement" value={selected.slot} disabled={disabled} onChange={event => place(selected.id, Number(event.target.value))}>
          {Array.from({ length: config.height - selected.units + 1 }, (_, slot) => <option key={slot} value={slot} disabled={!canPlace(config, selected.units, slot, selected.id)}>U{config.height - slot - selected.units + 1}{selected.units > 1 ? ` à U${config.height - slot}` : ""}</option>)}
        </select></label><div><button disabled={disabled || !canPlace(config, selected.units, selected.slot - 1, selected.id)} onClick={() => place(selected.id, selected.slot - 1)} aria-label={`Monter ${selected.name}`}>↑</button><button disabled={disabled || !canPlace(config, selected.units, selected.slot + 1, selected.id)} onClick={() => place(selected.id, selected.slot + 1)} aria-label={`Descendre ${selected.name}`}>↓</button><button disabled={disabled} onClick={() => { onRemove(selected.id); setSelectedId(null); setNotice(`${selected.name} retiré de la baie.`); }}>Retirer</button></div></div>
      </> : <><h3>Organisez votre baie</h3><p>Sélectionnez un appareil pour choisir sa position. Sur ordinateur, vous pouvez aussi le glisser vers une unité libre.</p></>}
      <p className="cabinet-notice" role="status">{notice}</p>
    </div>
  </>;
}
