"use client";
import Link from "next/link";
import UbiquitiFront from "./ubiquiti-front";
import RackCabinet from "./rack-cabinet";
import { canPlace, firstFreeSlot, readRackConfig, type RackConfig as Config, type RackItem as Item } from "./rack-model";
import { useEffect, useState } from "react";

const key = "maison1973.rack.v1";
const catalogue = [
  {
    "name": "Dream Machine Pro",
    "reference": "UDM-Pro",
    "category": "Passerelles",
    "detail": "Passerelle UniFi",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/udm-pro"
  },
  {
    "name": "Dream Machine SE",
    "reference": "UDM-SE",
    "category": "Passerelles",
    "detail": "Passerelle UniFi",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/udm-se"
  },
  {
    "name": "Dream Machine Pro Max",
    "reference": "UDM-Pro-Max",
    "category": "Passerelles",
    "detail": "Passerelle UniFi",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/udm-pro-max"
  },
  {
    "name": "Standard 24",
    "reference": "USW-24",
    "category": "Switches",
    "detail": "24 ports GbE",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/usw-24"
  },
  {
    "name": "Standard 24 PoE",
    "reference": "USW-24-PoE",
    "category": "Switches",
    "detail": "24 ports GbE · PoE",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/usw-24-poe"
  },
  {
    "name": "Switch Pro 24",
    "reference": "USW-Pro-24",
    "category": "Switches",
    "detail": "24 ports GbE",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/usw-pro-24"
  },
  {
    "name": "Switch Pro 24 PoE",
    "reference": "USW-Pro-24-PoE",
    "category": "Switches",
    "detail": "24 ports GbE · PoE",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/usw-pro-24-poe"
  },
  {
    "name": "Pro Max 24",
    "reference": "USW-Pro-Max-24",
    "category": "Switches",
    "detail": "24 ports",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/usw-pro-max-24"
  },
  {
    "name": "Pro Max 24 PoE",
    "reference": "USW-Pro-Max-24-PoE",
    "category": "Switches",
    "detail": "24 ports · PoE",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/usw-pro-max-24-poe"
  },
  {
    "name": "Standard 24 PoE (Gen1)",
    "reference": "US-24-250W",
    "category": "Switches",
    "detail": "24 ports GbE · PoE",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/us-24-250w"
  },
  {
    "name": "Panneau de brassage 24 ports",
    "reference": "UACC-Rack-Panel-Patch-Blank-24",
    "category": "Accessoires",
    "detail": "24 emplacements keystone",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/uacc-rack-panel-patch-blank-24"
  },
  {
    "name": "UNAS Pro 4",
    "reference": "UNAS-Pro-4",
    "category": "Stockage",
    "detail": "4 baies · 10 Gbit/s",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/unas-pro-4"
  },
  {
    "name": "UNAS Pro",
    "reference": "UNAS-Pro",
    "category": "Stockage",
    "detail": "7 baies · 10 Gbit/s",
    "units": 2,
    "url": "https://eu.store.ui.com/eu/en/products/unas-pro"
  },
  {
    "name": "UNAS Pro 8",
    "reference": "UNAS-Pro-8",
    "category": "Stockage",
    "detail": "8 baies · 10 Gbit/s",
    "units": 2,
    "url": "https://eu.store.ui.com/eu/en/products/unas-pro-8"
  },
  {
    "name": "Enterprise NAS",
    "reference": "ENAS",
    "category": "Stockage",
    "detail": "16 baies · 25 Gbit/s · alimentation redondante",
    "units": 3,
    "url": "https://eu.store.ui.com/eu/en/products/enas"
  },
  {
    "name": "Étagère fixe",
    "reference": "UACC-Rack-Shelf-CLV",
    "category": "Accessoires",
    "detail": "Étagère 19 pouces",
    "units": 1,
    "url": "https://eu.store.ui.com/eu/en/products/uacc-rack-shelf-clv"
  }
];
// Prices observed on the official European store on 27 October 2026, in euros.
const europeanPrices: Record<string, number> = {
  "udm-pro": 340, "udm-se": 449, "udm-pro-max": 539,
  "usw-24": 200, "usw-24-poe": 340, "usw-pro-24": 359,
  "usw-pro-24-poe": 629, "usw-pro-max-24": 405, "usw-pro-max-24-poe": 739,
  "us-24-250w": 359, "uacc-rack-panel-patch-blank-24": 25, "uacc-rack-shelf-clv": 44,
  "unas-pro-4": 449, "unas-pro": 449, "unas-pro-8": 719, "enas": 3599,
};
const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
function DeviceFace({ reference, name }: { reference: string; name: string }) {
  const known = catalogue.some(product => product.reference.toLowerCase() === reference.toLowerCase());
  return known ? <UbiquitiFront reference={reference} name={name} /> : <div className="rack-custom-face">{name}</div>;
}
const initial: Config = { version: 2, height: 12, items: [] };
export default function Rack() {
  const [config, setConfig] = useState<Config>(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [units, setUnits] = useState(1);
  const [category, setCategory] = useState("Tout");
  // Restore storage after hydration without overwriting unreadable data.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { const raw = localStorage.getItem(key); if (raw) { const parsed: unknown = JSON.parse(raw); setConfig(readRackConfig(parsed)); } } catch { setError("La sauvegarde est illisible ou inaccessible. Elle n’a pas été remplacée."); } setReady(true); }, []);
  // Report storage failures immediately.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!ready || error) return; try { localStorage.setItem(key, JSON.stringify(config)); } catch { setError("La sauvegarde locale est impossible. Vos dernières modifications ne sont pas enregistrées."); } }, [config, ready, error]);
  const used = config.items.reduce((sum, item) => sum + item.units, 0);
  const total = config.items.reduce((sum, item) => sum + (europeanPrices[item.reference.toLowerCase()] ?? 0), 0);
  const unknownPrices = config.items.filter(item => europeanPrices[item.reference.toLowerCase()] === undefined).length;
  const minimumHeight = Math.max(1, ...config.items.map(item => item.slot + item.units));
  function add(item: Omit<Item, "id" | "slot">) {
    setConfig(c => {
      const slot = firstFreeSlot(c, item.units);
      return slot < 0 ? c : { ...c, items: [...c.items, { id: crypto.randomUUID(), name: item.name, reference: item.reference, units: item.units, slot }] };
    });
  }
  function move(id: string, slot: number) {
    setConfig(c => {
      const item = c.items.find(entry => entry.id === id);
      return !item || !canPlace(c, item.units, slot, id) ? c : { ...c, items: c.items.map(entry => entry.id === id ? { ...entry, slot } : entry) };
    });
  }
  return <div className="rack-page">
    <nav className="rack-nav" aria-label="Navigation"><Link href="/">MAISON 1973</Link><div><Link href="/te">Tableau électrique</Link><Link href="/achats">Achats</Link></div></nav>
    <main className="rack-main"><header className="rack-header"><p className="kicker">MAISON 1973 / RÉSEAU</p><h1>Baie informatique</h1><p>Imaginez l’organisation de votre baie et préparez votre liste de matériel.</p></header>
      {error && <p className="rack-error" role="alert">{error}</p>}
      <div className="rack-size"><div><p className="kicker">DIMENSIONS DE LA BAIE</p><h2>Choisir la hauteur</h2><p>Baie 19 pouces · sélectionnez le nombre d’unités disponibles.</p></div><div className="rack-size-controls"><div className="rack-presets">{[6, 9, 12, 15, 18, 24, 42].map(n => <button key={n} type="button" aria-pressed={config.height === n} disabled={!ready || !!error || n < minimumHeight} onClick={() => setConfig(c => ({ ...c, height: n }))}>{n} U</button>)}</div><label>Autre hauteur <select aria-label="Hauteur de la baie" disabled={!ready || !!error} value={config.height} onChange={e => setConfig(c => ({ ...c, height: Number(e.target.value) }))}>{Array.from({ length: 48 }, (_, i) => i + 1).map(n => <option key={n} value={n} disabled={n < minimumHeight}>{n} U</option>)}</select></label></div></div><div className="rack-stats"><div><span>Hauteur choisie</span><strong>{config.height} <small>U</small></strong></div><div><span>Espaces occupés</span><strong>{used} <small>U</small></strong></div><div><span>Espaces disponibles</span><strong>{config.height - used} <small>U</small></strong></div></div>
      <p className="rack-note">Configuration enregistrée dans ce navigateur. Vérifiez la profondeur, la ventilation, l’alimentation et les accessoires avant achat.</p>
      <div className="rack-layout"><section className="rack-library"><div className="rack-section-heading"><div><p className="kicker">01 / COMPOSER</p><h2>Matériel</h2></div></div><p>Ajoutez des équipements à votre baie.</p><div className="rack-filters" aria-label="Catégories de matériel">{["Tout", "Passerelles", "Switches", "Stockage", "Accessoires"].map(c => <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div><p className="rack-note">Façades dessinées d’après les visuels officiels Ubiquiti. Prix relevés sur la boutique Europe le 27 octobre 2026, susceptibles de changer. Les fiches sont en anglais.</p><div className="rack-catalogue">{catalogue.filter(item => category === "Tout" || item.category === category).map(item => <article key={item.reference}><DeviceFace reference={item.reference} name={item.name} /><div className="catalogue-info"><div><span className="rack-tag">UBIQUITI · {item.category.toUpperCase()}</span><h3>{item.name}</h3><p>{item.reference} · {item.detail} · {item.units} U</p><p className="rack-price">{euro.format(europeanPrices[item.reference.toLowerCase()])}</p><p><a href={item.url} target="_blank" rel="noreferrer">Boutique Europe ↗</a> · <a href={`/assets/ubiquiti/${item.reference.toLowerCase()}-0.png`} target="_blank" rel="noreferrer">Visuel officiel ↗</a></p></div><button disabled={!ready || !!error || firstFreeSlot(config, item.units) < 0} onClick={() => add(item)}>Ajouter +</button></div></article>)}</div>
      <form className="rack-custom" onSubmit={e => { e.preventDefault(); if (!name.trim()) return; add({ name: name.trim(), reference: reference.trim(), units }); setName(""); setReference(""); }}><h3>Ajouter un autre équipement</h3><p>Panneau de brassage, onduleur ou autre matériel.</p><label>Nom<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label><label>Référence <span>(facultatif)</span><input maxLength={100} value={reference} onChange={e => setReference(e.target.value)} /></label><label>Hauteur en U<input type="number" min="1" max="48" required value={units} onChange={e => setUnits(Number(e.target.value))} /></label><button disabled={!ready || !!error || !Number.isInteger(units) || units < 1 || firstFreeSlot(config, units) < 0}>Ajouter à la baie</button></form></section>
      <section className="rack-workspace"><div className="rack-section-heading"><div><p className="kicker">02 / ORGANISER</p><h2>Votre baie 19 pouces</h2></div><span>{config.items.length} équipement{config.items.length !== 1 ? "s" : ""}</span></div><p>Chaque emplacement correspond à une unité. Positionnez vos appareils et gardez de la place pour la suite.</p><div className="rack-budget"><div><span>Estimation du matériel</span><strong>{euro.format(total)}</strong></div><p>{unknownPrices > 0 ? `${unknownPrices} équipement${unknownPrices > 1 ? "s" : ""} sans prix exclu${unknownPrices > 1 ? "s" : ""} du total.` : "Hors baie, livraison et accessoires non ajoutés."}</p></div><RackCabinet config={config} disabled={!ready || !!error} renderFace={item => <DeviceFace reference={item.reference} name={item.name} />} onMove={move} onRemove={id => setConfig(c => ({ ...c, items: c.items.filter(item => item.id !== id) }))} /><p className="rack-note">Vue de face indicative. La profondeur et la compatibilité de montage restent à vérifier.</p></section></div>
    </main></div>;
}

