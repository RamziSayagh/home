export const CATALOG_VERSION = "resi9-xe-2026-10-24-v2";
export const manufacturerUrl = (reference: string) => `https://www.se.com/fr/fr/product/${reference}/`;

export const GTL_OPTIONS = [
  { reference: "R9HKT13", name: "Kit GTL Resi9 · 13 modules", modules: 13 },
  { reference: "R9HKT18", name: "Kit GTL Resi9 · 18 modules", modules: 18 },
] as const;
export const GTL_ACCESSORIES = [
  { reference: "R9H13535", name: "Jonction sol/plafond · GTL 13 modules", compatibleWith: "R9HKT13" },
  { reference: "R9H13537", name: "Kit de supports universels · GTL 13 modules", compatibleWith: "R9HKT13" },
  { reference: "R9H13539", name: "Embout de goulotte · GTL 13 modules", compatibleWith: "R9HKT13" },
  { reference: "R9H13540", name: "Épanouisseur de câble · GTL 13 modules", compatibleWith: "R9HKT13" },
  { reference: "R9H18535", name: "Jonction sol/plafond · GTL 18 modules", compatibleWith: "R9HKT18" },
  { reference: "R9H13541", name: "Kit de supports universels · GTL 18 modules", compatibleWith: "R9HKT18" },
  { reference: "R9H18539", name: "Embout de goulotte · GTL 18 modules", compatibleWith: "R9HKT18" },
] as const;
export type GtlReference = (typeof GTL_OPTIONS)[number]["reference"];
export type GtlAccessoryReference = (typeof GTL_ACCESSORIES)[number]["reference"];

export const COMMUNICATION_CABINETS = [
  { reference: "R9H13402VDIXS", name: "Resi9 Connect · 13 modules · Grade 3TV", detail: "6 RJ45 Cat 6A · switch PoE 5 ports · 2 prises de courant", grade: "Grade 3TV · Cat 6A", switchPorts: 5, source: "https://www.se.com/fr/fr/product/R9H13402VDIXS/resi9-connect-coffret-13m2r-switch-5-ports-poe-2-pc-grade-3tv-6xrj45-cat6a/" },
  { reference: "R9H18402VDIXS", name: "Resi9 Connect · 18 modules · Grade 3TV", detail: "8 RJ45 Cat 6A · switch PoE 9 ports · 2 prises de courant", grade: "Grade 3TV · Cat 6A", switchPorts: 9, source: "https://www.se.com/fr/fr/product/R9H18402VDIXS/resi9-connect-coffret-18m2r-switch-9-ports-poe-2-pc-grade-3tv-8xrj45-cat6a/" },
] as const;
export type CommunicationCabinetReference = (typeof COMMUNICATION_CABINETS)[number]["reference"];
export const communicationCabinet = (reference: string) => COMMUNICATION_CABINETS.find(cabinet => cabinet.reference === reference);

export type Product = {
  reference: string;
  name: string;
  short: string;
  kind: "breaker" | "rcd" | "spd" | "impulse" | "domotics";
  range?: string;
  modules: number;
  dimensions?: string;
  ratedCurrentA?: number;
  rating: string;
  detail: string;
  source: string;
  verifiedAt: string;
};

// Widths use 18 mm modules. Sources and verification notes are in README.md.
export const PRODUCTS: Product[] = [
  { reference: "R9ERA263", name: "Différentiel 63 A · type A", short: "63 A", kind: "rcd", modules: 2, rating: "30 mA · type A", detail: "2P · 36 mm · embrochable XE", source: manufacturerUrl("R9ERA263"), verifiedAt: "2026-10-24" },
  { reference: "R9ERC263", name: "Différentiel 63 A · type AC", short: "63 A", kind: "rcd", modules: 2, rating: "30 mA · type AC", detail: "2P · 36 mm · embrochable XE", source: manufacturerUrl("R9ERC263"), verifiedAt: "2026-10-24" },
  { reference: "R9ERF263", name: "Différentiel 63 A · type Fsi · XE", short: "63 A", kind: "rcd", modules: 2, rating: "30 mA · type Fsi", detail: "2P · 36 mm · embrochable XE", source: manufacturerUrl("R9ERF263"), verifiedAt: "2026-10-24" },
  { reference: "R9PRF263", name: "Différentiel 63 A · type Fsi · peignable", short: "63 A", kind: "rcd", range: "Resi9 XP", modules: 2, rating: "30 mA · type Fsi", detail: "2P · 36 mm · peignable XP · à vis", source: manufacturerUrl("R9PRF263"), verifiedAt: "2026-10-24" },
  { reference: "A9Z61263", name: "Différentiel 63 A · type B-SI", short: "63 A", kind: "rcd", range: "Acti9 iID", modules: 4, rating: "30 mA · type B-SI", detail: "2P · 230 V · 72 mm · rail DIN · raccordement à bornes", source: manufacturerUrl("A9Z61263"), verifiedAt: "2026-10-24" },
  { reference: "A9Z61240", name: "Différentiel 40 A · type B-SI", short: "40 A", kind: "rcd", range: "Acti9 iID", modules: 4, ratedCurrentA: 40, rating: "30 mA · type B-SI", detail: "2P · 230 V · 72 mm · rail DIN · raccordement à bornes", source: manufacturerUrl("A9Z61240"), verifiedAt: "2026-10-25" },
  { reference: "A9Z51240", name: "Différentiel 40 A · type B-EV", short: "40 A", kind: "rcd", range: "Acti9 iID", modules: 4, ratedCurrentA: 40, rating: "30 mA · type B-EV", detail: "2P · 230 V · 72 mm · rail DIN · raccordement à bornes", source: manufacturerUrl("A9Z51240"), verifiedAt: "2026-10-25" },
  ...[2, 10, 16, 20, 32].flatMap((amps): Product[] => ["XE", "XP"].map((family): Product => {
    const xe = family === "XE";
    const reference = `R9${xe ? "E" : "P"}FC6${String(amps).padStart(2, "0")}`;
    return { reference, name: `Disjoncteur ${amps} A · ${family}`, short: `C${amps}`, kind: "breaker", ...(xe ? {} : { range: "Resi9 XP" }), modules: 1, ratedCurrentA: amps, rating: "Courbe C · 1P+N", detail: xe ? "18 mm · embrochable XE" : "18 mm · peignable XP · à vis", source: manufacturerUrl(reference), verifiedAt: "2026-10-24" };
  })),
  { reference: "A9F77240", name: "Disjoncteur 40 A · Acti9", short: "C40", kind: "breaker", range: "Acti9 iC60N", modules: 2, ratedCurrentA: 40, rating: "Courbe C · 2P", detail: "36 mm · rail DIN · raccordement à bornes", source: manufacturerUrl("A9F77240"), verifiedAt: "2026-10-25" },
  { reference: "R9PLC", name: "Parafoudre type 2 · 10 kA", short: "T2", kind: "spd", range: "Resi9 XP PF", modules: 2, rating: "Type 2 · 1P+N · 10 kA", detail: "36 mm · rail DIN · avec accessoires", source: manufacturerUrl("R9PLC"), verifiedAt: "2026-10-24" },
  { reference: "R9PCL216", name: "Télérupteur 16 A · 2NO", short: "TL", kind: "impulse", range: "Resi9 XP TL", modules: 1, rating: "16 A · 2NO · commande 230 V", detail: "18 mm · rail DIN · raccordement à vis", source: manufacturerUrl("R9PCL216"), verifiedAt: "2026-10-24" },
  { reference: "R9PCL2S", name: "Télérupteur silencieux 16 A · 1NO", short: "TLS", kind: "impulse", range: "Resi9 XP TL", modules: 1, rating: "16 A · 1NO · commande 230 V", detail: "18 mm · rail DIN · électronique · à vis", source: manufacturerUrl("R9PCL2S"), verifiedAt: "2026-10-24" },
  // Shelly Pro devices are independent DIN-rail equipment: placement never validates their wiring or protection.
  { reference: "SHELLY-PRO-1", name: "Shelly Pro 1", short: "Pro 1", kind: "domotics", range: "Shelly Pro", modules: 1, dimensions: "94 × 19 × 69 mm", rating: "Relais · 1 canal · 16 A", detail: "Contact sec (libre de potentiel), idéal pour remplacer un télérupteur classique.", source: "https://www.shelly.com/collections/professional-devices", verifiedAt: "2026-10-26" },
  { reference: "SHELLY-PRO-1PM", name: "Shelly Pro 1PM", short: "1PM", kind: "domotics", range: "Shelly Pro", modules: 1, dimensions: "94 × 19 × 69 mm", rating: "Relais · 1 canal · 16 A", detail: "Mesure de consommation intégrée.", source: "https://www.shelly.com/collections/professional-devices", verifiedAt: "2026-10-26" },
  { reference: "SHELLY-PRO-2", name: "Shelly Pro 2", short: "Pro 2", kind: "domotics", range: "Shelly Pro", modules: 1, dimensions: "94 × 19 × 69 mm", rating: "Relais · 2 canaux · 16 A/canal", detail: "Contacts secs indépendants, 25 A max. au total.", source: "https://www.shelly.com/products/shelly-pro-2", verifiedAt: "2026-10-27" },
  { reference: "SHELLY-PRO-2PM", name: "Shelly Pro 2PM", short: "2PM", kind: "domotics", range: "Shelly Pro", modules: 1, dimensions: "94 × 19 × 69 mm", rating: "Relais · 2 canaux · 16 A/canal", detail: "Mesure de consommation intégrée.", source: "https://www.shelly.com/products/shelly-pro-2pm", verifiedAt: "2026-10-27" },
  { reference: "SHELLY-PRO-3", name: "Shelly Pro 3", short: "Pro 3", kind: "domotics", range: "Shelly Pro", modules: 3, dimensions: "94 × 57 × 69 mm", rating: "Relais · 3 canaux · 16 A/canal", detail: "Contacts secs indépendants pour triphasé ou trois zones.", source: "https://www.shelly.com/collections/professional-devices", verifiedAt: "2026-10-26" },
  { reference: "SHELLY-PRO-4PM", name: "Shelly Pro 4PM", short: "4PM", kind: "domotics", range: "Shelly Pro", modules: 3, dimensions: "94 × 57 × 69 mm", rating: "Relais · 4 canaux · 16 A/canal", detail: "Mesure de consommation et écran couleur en façade.", source: "https://www.shelly.com/collections/professional-devices", verifiedAt: "2026-10-26" },
  { reference: "SHELLY-PRO-DIMMER-1PM", name: "Shelly Pro Dimmer 1PM", short: "Dim 1", kind: "domotics", range: "Shelly Pro", modules: 1, dimensions: "94 × 19 × 69 mm", rating: "Variateur · 1 circuit", detail: "Variateur de lumière avec mesure de consommation.", source: "https://www.shelly.com/products/shelly-pro-dimmer-1pm", verifiedAt: "2026-10-27" },
  { reference: "SHELLY-PRO-DIMMER-2PM", name: "Shelly Pro Dimmer 2PM", short: "Dim 2", kind: "domotics", range: "Shelly Pro", modules: 1, dimensions: "94 × 19 × 69 mm", rating: "Variateur · 2 circuits", detail: "Deux circuits indépendants avec mesure de consommation.", source: "https://www.shelly.com/fr/products/shelly-pro-dimmer-2pm", verifiedAt: "2026-10-27" },
  { reference: "SHELLY-PRO-DIMMER-0-1-10V-PM", name: "Shelly Pro Dimmer 0/1-10V PM", short: "0/1–10", kind: "domotics", range: "Shelly Pro", modules: 1, dimensions: "94 × 19 × 69 mm", rating: "Variateur · 0/1–10 V", detail: "Contrôle de ballasts ou pilotes de luminaires professionnels.", source: "https://www.shelly.com/fr/products/shelly-pro-dimmer-0-1-10v-pm", verifiedAt: "2026-10-27" },
  { reference: "SHELLY-PRO-RGBWW-PM", name: "Shelly Pro RGBWW PM", short: "RGBWW", kind: "domotics", range: "Shelly Pro", modules: 1, dimensions: "94 × 19 × 69 mm", rating: "LED · 5 canaux", detail: "Gestion avancée des bandeaux LED couleur et blanc.", source: "https://www.shelly.com/products/shelly-pro-rgbww-pm", verifiedAt: "2026-10-27" },
  { reference: "SHELLY-PRO-DUAL-COVER-SHUTTER-PM", name: "Shelly Pro Dual Cover/Shutter PM", short: "Cover", kind: "domotics", range: "Shelly Pro", modules: 3, dimensions: "96 × 53 × 59 mm", rating: "Volets/stores · 2 moteurs", detail: "Contrôle bidirectionnel avec mesure de puissance.", source: "https://www.shelly.com/fr/products/shelly-pro-dual-cover-shutter-pm", verifiedAt: "2026-10-27" },
  { reference: "SHELLY-PRO-EM-50", name: "Shelly Pro EM-50", short: "EM-50", kind: "domotics", range: "Shelly Pro", modules: 1, dimensions: "94 × 19 × 69 mm", rating: "Énergie · 2 canaux", detail: "Compteur monophasé livré avec deux pinces de 50 A.", source: "https://www.shelly.com/collections/professional-devices", verifiedAt: "2026-10-26" },
  { reference: "SHELLY-LAN-SWITCH", name: "Shelly LAN Switch", short: "LAN", kind: "domotics", range: "Shelly", modules: 3, dimensions: "96 × 53 × 59 mm", rating: "Réseau · 5 ports RJ45", detail: "Commutateur réseau alimenté en 230 V pour distribuer Internet dans le tableau.", source: "https://kb.shelly.cloud/knowledge-base/shelly-lan-switch", verifiedAt: "2026-10-26" },
];

export const PRODUCT_BY_REF: Record<string, Product> = Object.assign(Object.create(null), Object.fromEntries(PRODUCTS.map((p) => [p.reference, p])));

export const DISTRIBUTORS = [
  { reference: "R9EXHC05", name: "XE · 5 modules · avec connecteur", modules: 5, connector: true, kind: "xe" },
  { reference: "R9EXHS05", name: "XE · 5 modules · sans connecteur", modules: 5, connector: false, kind: "xe" },
  { reference: "R9EXHC08", name: "XE · 8 modules · avec connecteur", modules: 8, connector: true, kind: "xe" },
  { reference: "R9EXHS08", name: "XE · 8 modules · sans connecteur", modules: 8, connector: false, kind: "xe" },
  { reference: "R9EXHS10", name: "XE · 10 modules · sans connecteur", modules: 10, connector: false, kind: "xe" },
  { reference: "R9EXHC13", name: "XE · 13 modules · avec connecteur", modules: 13, connector: true, kind: "xe" },
  { reference: "R9EXHS13", name: "XE · 13 modules · sans connecteur", modules: 13, connector: false, kind: "xe" },
  { reference: "R9EXHC18", name: "XE · 18 modules · avec connecteur", modules: 18, connector: true, kind: "xe" },
  { reference: "R9PXH213", name: "Peigne XP · 1P+N · 63 A · 13 modules", modules: 13, connector: true, kind: "comb" },
  { reference: "R9PXH218", name: "Peigne XP · 1P+N · 63 A · 18 modules", modules: 18, connector: true, kind: "comb" },
];

export function enclosureReference(rows: number, capacity: number) {
  // Standard Resi9 enclosures: one to four rows, 13 or 18 modules per row.
  if (rows >= 1 && rows <= 2 && Number.isInteger(rows) && [13, 18].includes(capacity)) return `R9H${capacity}40${rows}`;
  if (rows === 4 && capacity === 13) return "R9H13404";
  if (rows === 4 && capacity === 18) return "R9H18404";
  if (rows !== 3) return null;
  return capacity === 13 ? "R9H13403" : "R9H18403";
}
