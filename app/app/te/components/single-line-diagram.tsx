import { PRODUCT_BY_REF } from "../data/catalog";
import { deviceCircuitIds, type Circuit, type Device, type Project } from "../lib/model";
import SingleLineIcon from "./single-line-icon";
import "../single-line.css";

function CircuitCard({ circuit, number }: { circuit?: Circuit; number?: number }) {
  return <div className="sld-circuit">
    <div className="sld-illustration"><SingleLineIcon usage={circuit?.usage} /></div>
    <span className="sld-code">{number ? `C${String(number).padStart(2, "0")}` : "À RENSEIGNER"}</span>
    <strong>{circuit?.name || "Aucun circuit associé"}</strong>
    <span className="sld-location">{[circuit?.room, circuit?.floor].filter(Boolean).join(" · ")}</span>
    <small>{circuit?.usage || "Usage à préciser"}</small>
    <div className="sld-cable"><span>Section</span><b>{circuit?.cable || "À préciser"}</b></div>
    {circuit?.load ? <small>{circuit.load}</small> : null}
  </div>;
}

function Departure({ device, project, circuits, numbers }: { device: Device; project: Project; circuits: Map<string, Circuit>; numbers: Map<string, number> }) {
  const product = PRODUCT_BY_REF[device.reference];
  const assigned = deviceCircuitIds(device).flatMap(id => circuits.get(id) ? [circuits.get(id)!] : []);
  return <article className="sld-departure" aria-label={device.label || product.name}>
    <div className="sld-protection">
      <SingleLineIcon kind="breaker" />
      <div><span className="sld-code">DISJONCTEUR</span><strong>{device.label || product.short}</strong><small>{product.rating}</small><small className="sld-ref">{device.reference}</small><small>{project.rows.find(row => row.id === device.rowId)?.name} · position {device.slot + 1}</small></div>
    </div>
    <div className="sld-leaves">{assigned.length ? assigned.map(circuit => <CircuitCard key={circuit.id} circuit={circuit} number={numbers.get(circuit.id)} />) : <CircuitCard />}</div>
  </article>;
}

function PanelDiagram({ panel, index, circuits, numbers }: { panel: Project; index: number; circuits: Map<string, Circuit>; numbers: Map<string, number> }) {
  const rowOrder = new Map(panel.rows.map((row, i) => [row.id, i]));
  const devices = [...panel.devices].sort((a, b) => (rowOrder.get(a.rowId)! - rowOrder.get(b.rowId)!) || a.slot - b.slot);
  const rcds = devices.filter(device => PRODUCT_BY_REF[device.reference].kind === "rcd");
  const breakers = devices.filter(device => PRODUCT_BY_REF[device.reference].kind === "breaker");
  const branches = rcds.map(rcd => ({ rcd, breakers: breakers.filter(device => device.upstreamId === rcd.id) }));
  const loose = breakers.filter(device => !rcds.some(rcd => rcd.id === device.upstreamId));
  const other = devices.filter(device => !["breaker", "rcd"].includes(PRODUCT_BY_REF[device.reference].kind));
  return <section className="sld-panel">
    <header className="sld-panel-title"><span className="sld-panel-number">{String(index + 1).padStart(2, "0")}</span><div><span className="sld-code">TABLEAU ÉLECTRIQUE</span><h3>{panel.name || `Tableau ${index + 1}`}</h3></div><span className="sld-panel-meta">{panel.rows.length} rangées · {panel.capacity} modules</span></header>
    <div className="sld-arrival"><SingleLineIcon kind="supply" /><div><span className="sld-code">ARRIVÉE DU TABLEAU</span><strong>Alimentation</strong><small>Caractéristiques à confirmer sur site</small></div></div>
    <div className="sld-branches">{branches.map(({ rcd, breakers: downstream }) => {
      const product = PRODUCT_BY_REF[rcd.reference];
      return <section className="sld-branch" key={rcd.id} aria-label={rcd.label || product.name}>
        <header className="sld-differential"><SingleLineIcon kind="rcd" /><div><span className="sld-code">INTERRUPTEUR DIFFÉRENTIEL</span><h4>{rcd.label || product.name}</h4><p>{product.short} · {product.rating}</p><small>{rcd.reference} · {panel.rows.find(row => row.id === rcd.rowId)?.name}</small></div><span className="sld-count">{downstream.length} départ{downstream.length > 1 ? "s" : ""}</span></header>
        {downstream.length ? <div className="sld-departures">{downstream.map(device => <Departure key={device.id} device={device} project={panel} circuits={circuits} numbers={numbers} />)}</div> : <p className="sld-empty">Aucun départ associé à ce différentiel.</p>}
      </section>;
    })}</div>
    {loose.length ? <section className="sld-loose"><h4>Différentiel amont non renseigné</h4><div className="sld-departures">{loose.map(device => <Departure key={device.id} device={device} project={panel} circuits={circuits} numbers={numbers} />)}</div></section> : null}
    {other.length ? <section className="sld-other"><h4>Équipements complémentaires · liaisons à préciser</h4><div>{other.map(device => { const product = PRODUCT_BY_REF[device.reference]; return <article key={device.id}><SingleLineIcon kind={product.kind === "spd" ? "spd" : "impulse"} /><div><strong>{device.label || product.name}</strong><small>{product.rating} · {device.reference}</small></div></article>; })}</div></section> : null}
    {!devices.length ? <p className="sld-empty">Ajoutez des appareils pour composer le schéma de ce tableau.</p> : null}
  </section>;
}

export default function SingleLineDiagram({ project }: { project: Project }) {
  const panels = project.secondPanel ? [project, project.secondPanel] : [project];
  const circuits = new Map(project.circuits.map(circuit => [circuit.id, circuit]));
  const numbers = new Map(project.circuits.map((circuit, index) => [circuit.id, index + 1]));
  const assigned = new Set(panels.flatMap(panel => panel.devices.flatMap(deviceCircuitIds)));
  const unassigned = project.circuits.filter(circuit => !assigned.has(circuit.id));
  return <section className="sld-document" aria-label="Schéma unifilaire">
    <header className="sld-document-title"><div><span className="sld-code">MAISON 1973 / DOSSIER ÉLECTRIQUE</span><h3>Du tableau à chaque circuit.</h3><p>{project.name}</p></div><span className="sld-document-stamp">SCHÉMA UNIFILAIRE<br /><b>Vue d’ensemble</b></span></header>
    <div className="sld-reading-key"><span><i /> Liaison renseignée</span><span>Lecture de haut en bas : différentiel → disjoncteur → circuit</span></div>
    {panels.map((panel, index) => <PanelDiagram key={index} panel={panel} index={index} circuits={circuits} numbers={numbers} />)}
    {unassigned.length ? <aside className="sld-unassigned"><strong>Circuits en attente d’affectation · {unassigned.length}</strong><p>{unassigned.map(circuit => circuit.name || "Circuit sans nom").join(" · ")}</p></aside> : null}
    <footer className="sld-footer"><span>MAISON 1973</span><span>Schéma de préparation · illustrations de repérage</span><span>{panels.length} tableau{panels.length > 1 ? "x" : ""} · {project.circuits.length} circuits</span></footer>
  </section>;
}
