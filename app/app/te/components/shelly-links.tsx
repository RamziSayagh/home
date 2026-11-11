import { useState } from "react";
import { PRODUCT_BY_REF } from "../data/catalog";
import { uid, type Circuit, type Device, type Project, type ShellyLink } from "../lib/model";

type Part = "breaker" | "shelly" | "light" | "switch";

export default function ShellyLinks({ device, project, circuits, onChange }: { device: Device; project: Project; circuits: Circuit[]; onChange: (links: ShellyLink[]) => void }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [part, setPart] = useState<Part>("breaker");
  const isCover = device.reference === "SHELLY-PRO-DUAL-COVER-SHUTTER-PM";
  const links = device.shellyLinks ?? [];
  const active = links.find(link => link.id === activeId) ?? links[0];
  const update = (patch: Partial<ShellyLink>) => active && onChange(links.map(link => link.id === active.id ? { ...link, ...patch } : link));
  const add = () => {
    const link = { id: uid(), channel: `Voie ${links.length + 1}`, breakerId: "", circuitId: "", light: "", switchName: "", cable: "" };
    onChange([...links, link]); setActiveId(link.id); setPart("breaker");
  };
  const breaker = project.devices.find(d => d.id === active?.breakerId);
  const circuit = circuits.find(c => c.id === active?.circuitId);
  const node = (id: Part, icon: string, title: string, label: string) => <button type="button" className={`te-wire-node te-wire-${id} ${part === id ? "is-active" : ""}`} onClick={() => setPart(id)} aria-pressed={part === id}><span className="te-wire-icon" aria-hidden="true">{icon}</span><span><small>{title}</small><strong>{label}</strong></span><i aria-hidden="true">✎</i></button>;
  return <div className="te-shelly-links"><h3>Branchements Shelly</h3><p>Composez et visualisez les liaisons de ce module.</p>
    <button type="button" className="te-wire-open" onClick={() => setOpen(true)}>✣ &nbsp; Ouvrir le schéma des branchements <span>{links.length}</span></button>
    {open && <div className="te-wire-overlay" onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}><section className="te-wire-window" role="dialog" aria-modal="true" aria-label="Schéma des branchements Shelly">
      <header className="te-wire-header"><div><small>TABLEAU ÉLECTRIQUE / DOMOTIQUE</small><h2>Schéma des branchements</h2><p>{device.label || PRODUCT_BY_REF[device.reference].name} · Cliquez sur un élément pour le renseigner.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Fermer le schéma">✕</button></header>
      <div className="te-wire-tabs" aria-label="Liaisons">{links.map((link, index) => <button key={link.id} type="button" aria-pressed={active?.id === link.id} onClick={() => setActiveId(link.id)}>{link.channel || `Liaison ${index + 1}`}</button>)}<button type="button" disabled={links.length >= 20} onClick={add}>+ Ajouter une liaison</button></div>
      {active ? <div className="te-wire-layout"><div className="te-wire-canvas" aria-label="Schéma interactif de la liaison">
        <div className="te-wire-canvas-title"><span>LIAISON {links.indexOf(active) + 1}</span><span>VUE DE PRINCIPE</span></div>
        <div className="te-wire-diagram">
          <div className="te-wire-line te-wire-line-main" /><div className={`te-wire-line te-wire-line-return ${isCover ? "te-wire-cover-up" : ""}`} />{isCover && <div className="te-wire-line te-wire-cover-down" />}<div className="te-wire-line te-wire-line-neutral" /><div className="te-wire-line te-wire-line-neutral-shelly" /><div className="te-wire-line te-wire-line-switch" />{isCover && <div className="te-wire-line te-wire-cover-switch" />}<div className="te-wire-line te-wire-line-phase-switch" />
          <span className="te-wire-terminal">L</span><span className="te-wire-terminal te-wire-terminal-neutral">N</span>
          {device.reference === "SHELLY-PRO-2PM" && <><span className="te-wire-terminal te-wire-terminal-output">O1 / O2</span><span className="te-wire-terminal te-wire-terminal-input">SW1 / SW2</span></>}
          {device.reference === "SHELLY-PRO-4PM" && <><span className="te-wire-terminal te-wire-terminal-output">O1 à O4</span><span className="te-wire-terminal te-wire-terminal-input">S1 à S4</span></>}
          {isCover && <><span className="te-wire-terminal te-wire-terminal-output">O1 / O2 ▲▼</span><span className="te-wire-terminal te-wire-terminal-input">S1 à S4</span></>}
          {node("breaker", "ϟ", "PROTECTION", breaker ? breaker.label || PRODUCT_BY_REF[breaker.reference].name : "Choisir un disjoncteur")}
          {node("shelly", "▦", "MODULE", `${device.label || PRODUCT_BY_REF[device.reference].name} · ${active.channel || "voie à préciser"}`)}
          {node("light", isCover ? "▤" : "☼", isCover ? "VOLET" : "LUMIÈRE", active.light || circuit?.name || (isCover ? "Choisir un volet" : "Choisir une lumière"))}
          {node("switch", "◉", "COMMANDE", active.switchName || "Nommer l’interrupteur")}
        </div>
        <div className="te-wire-legend"><span><i className="te-wire-swatch-neutral" /> Neutre : disjoncteur, N et {isCover ? "moteur" : "lumière"}</span>{isCover ? <><span><i className="te-wire-swatch-cover-up" /> Sortie montée ▲</span><span><i className="te-wire-swatch-cover-down" /> Sortie descente ▼</span></> : <span><i className="te-wire-swatch-return" /> Retour lampe violet</span>}<span><i className="te-wire-swatch-phase" /> Phase vers L et la commande</span><span><i className="te-wire-swatch-switch" /> Entrées de commande</span></div>
        {device.reference === "SHELLY-PRO-2PM" && <p className="te-wire-note"><strong>Voie 1 : SW1 → O1 · Voie 2 : SW2 → O2</strong></p>}
        {device.reference === "SHELLY-PRO-4PM" && <p className="te-wire-note"><strong>Entrées des boutons : S1 à S4 · Sorties des lampes : O1 à O4.</strong> Vérifiez l’association des entrées aux sorties dans la configuration. Le nombre de bornes L dépend de la version du Pro 4PM.</p>}
        {isCover && <p className="te-wire-note"><strong>Volet 1 : S1 / S2 et O1 ▲ / ▼ · Volet 2 : S3 / S4 et O2 ▲ / ▼.</strong> Les couleurs des fils moteur et la commande sont à vérifier sur place. La terre du moteur n’est pas représentée.</p>}
        <p className="te-wire-note">Schéma de principe : origines des conducteurs et bornes à confirmer selon l’installation et la notice Shelly.</p>
      </div><aside className="te-wire-properties"><span className="te-wire-eyebrow">ÉLÉMENT SÉLECTIONNÉ</span>
        {part === "breaker" && <><h3>ϟ Disjoncteur</h3><p>Choisissez la protection dans ce tableau.</p><label className="te-field"><span>Disjoncteur</span><select value={active.breakerId} onChange={e => update({ breakerId: e.target.value })}><option value="">À préciser</option>{project.rows.map(row => {
          const breakers = project.devices.filter(d => d.rowId === row.id && PRODUCT_BY_REF[d.reference].kind === "breaker").sort((a, b) => a.slot - b.slot);
          return breakers.length ? <optgroup key={row.id} label={row.name}>{breakers.map(d => <option key={d.id} value={d.id}>{d.slot + 1} · {d.label || PRODUCT_BY_REF[d.reference].name}</option>)}</optgroup> : null;
        })}</select></label></>}
        {part === "shelly" && <><h3>▦ Module Shelly</h3><p>Identifiez la voie utilisée sur ce module.</p><label className="te-field"><span>Voie ou repère</span><input value={active.channel} maxLength={80} onChange={e => update({ channel: e.target.value })} /></label></>}
        {part === "light" && <><h3>{isCover ? "▤ Volet" : "☼ Lumière"}</h3><p>{isCover ? "Associez un circuit et précisez le volet." : "Associez un circuit et précisez le luminaire."}</p><label className="te-field"><span>Circuit</span><select value={active.circuitId} onChange={e => update({ circuitId: e.target.value })}><option value="">À préciser</option>{circuits.map(c => <option key={c.id} value={c.id}>{c.name || "Circuit sans nom"}{c.room ? ` · ${c.room}` : ""}</option>)}</select></label><label className="te-field"><span>{isCover ? "Volet" : "Luminaire"}</span><input value={active.light} maxLength={160} placeholder={isCover ? "Volet salon" : "Plafonnier salon"} onChange={e => update({ light: e.target.value })} /></label></>}
        {part === "switch" && <><h3>◉ Interrupteur</h3><p>Identifiez la commande de {isCover ? "ce volet" : "cette lumière"}.</p><label className="te-field"><span>{isCover ? "Commande montée / descente" : "Interrupteur ou bouton"}</span><input value={active.switchName} maxLength={160} placeholder={isCover ? "Commande volet salon" : "Bouton entrée salon"} onChange={e => update({ switchName: e.target.value })} /></label></>}
        <button type="button" className="te-wire-delete" onClick={() => { onChange(links.filter(link => link.id !== active.id)); setActiveId(""); }}>Supprimer cette liaison</button>
      </aside></div> : <div className="te-wire-empty"><span>⌁</span><h3>Votre schéma commence ici</h3><p>Ajoutez une liaison pour relier un disjoncteur, un Shelly, {isCover ? "un volet" : "une lumière"} et sa commande.</p><button type="button" onClick={add}>+ Ajouter une liaison</button></div>}
    </section></div>}
  </div>;
}
