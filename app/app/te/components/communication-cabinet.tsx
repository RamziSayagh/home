import { emptyCommunication, uid, type CommunicationCabinet } from "../lib/model";

export default function CommunicationEditor({ value, onChange }: { value?: CommunicationCabinet; onChange: (next: CommunicationCabinet) => void }) {
  const cabinet = value ?? emptyCommunication();
  const update = (patch: Partial<CommunicationCabinet>) => onChange({ ...cabinet, ...patch });
  return <section className="te-communication te-card" aria-label="Coffret de communication">
    <div className="te-section-heading"><span className="te-step">04</span><h2>Le coffret de communication</h2></div>
    <p className="te-muted">Organisez le réseau de la maison : arrivée Internet, équipements et brassage vers les pièces.</p>
    <label className="te-communication-toggle"><input type="checkbox" checked={value?.enabled ?? false} onChange={(e) => update({ enabled: e.target.checked })} />Inclure un coffret de communication</label>
    {value?.enabled ? <>
      <div className="te-communication-fields">
        <label className="te-field"><span>Référence du coffret</span><input value={cabinet.reference} maxLength={80} placeholder="Marque et référence à préciser" onChange={(e) => update({ reference: e.target.value })} /></label>
        <label className="te-field"><span>Emplacement du coffret</span><input value={cabinet.location} maxLength={160} placeholder="Ex. Entrée, garage…" onChange={(e) => update({ location: e.target.value })} /></label>
        <label className="te-field"><span>Grade / catégorie du réseau</span><input value={cabinet.grade} maxLength={80} placeholder="À préciser selon le matériel" onChange={(e) => update({ grade: e.target.value })} /></label>
        <label className="te-field"><span>Nombre de ports du switch</span><input type="number" min={0} max={48} value={cabinet.switchPorts} onChange={(e) => { const ports = Number(e.target.value); if (Number.isInteger(ports) && ports >= 0 && ports <= 48) update({ switchPorts: ports }); }} /></label>
      </div>
      <div className="te-communication-equipment">{([
        ["optical", "Terminaison optique · DTIo / PTO"], ["dti", "DTI cuivre"], ["box", "Box Internet"],
      ] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={cabinet[key]} onChange={(e) => update({ [key]: e.target.checked })} />{label}</label>)}</div>
      <div className="te-network-diagram" aria-label="Organisation du réseau">
        <div className="te-network-arrival"><span>ARRIVÉE</span><strong>{[cabinet.optical && "Fibre", cabinet.dti && "Cuivre"].filter(Boolean).join(" / ") || "À préciser"}</strong></div>
        <span aria-hidden="true">→</span><div><span>INTERNET</span><strong>{cabinet.box ? "Box Internet" : "Box à prévoir"}</strong></div>
        <span aria-hidden="true">→</span><div><span>DISTRIBUTION</span><strong>{cabinet.switchPorts ? `Switch · ${cabinet.switchPorts} ports` : "Brassage direct / switch à préciser"}</strong></div>
        <span aria-hidden="true">→</span><div><span>VERS LES PIÈCES</span><strong>{cabinet.ports.length} liaison{cabinet.ports.length > 1 ? "s" : ""} RJ45</strong></div>
      </div>
      <h3>Le brassage RJ45</h3><p className="te-muted">Chaque ligne représente une liaison vers une prise de la maison. L’ordre correspond au repérage du brassage.</p>
      <ol className="te-network-ports">{cabinet.ports.map((port, index) => <li key={port.id}>
        <span className="te-network-port-number">RJ45 {String(index + 1).padStart(2, "0")}</span>
        <label className="te-field"><span>Pièce desservie · prise {index + 1}</span><input value={port.room} maxLength={160} list="te-rooms" placeholder="Ex. Bureau" onChange={(e) => update({ ports: cabinet.ports.map((p) => p.id === port.id ? { ...p, room: e.target.value } : p) })} /></label>
        <label className="te-field"><span>Repère · prise {index + 1}</span><input value={port.label} maxLength={160} placeholder="Ex. Poste de travail" onChange={(e) => update({ ports: cabinet.ports.map((p) => p.id === port.id ? { ...p, label: e.target.value } : p) })} /></label>
        <button className="te-danger" aria-label={`Retirer la prise RJ45 ${index + 1}`} onClick={() => update({ ports: cabinet.ports.filter((p) => p.id !== port.id) })}>Retirer</button>
      </li>)}</ol>
      {!cabinet.ports.length ? <p className="te-empty-inline">Ajoutez les prises à desservir dans les pièces.</p> : null}
      <button type="button" disabled={cabinet.ports.length >= 48} onClick={() => update({ ports: [...cabinet.ports, { id: uid(), room: "", label: "" }] })}>+ Ajouter une prise RJ45</button>
    </> : null}
  </section>;
}
