export const CATALOG_VERSION = "resi9-xe-2026-10-24-v1";
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

export type Product = {
  reference: string;
  name: string;
  short: string;
  kind: "breaker" | "rcd" | "spd" | "impulse";
  range?: string;
  modules: number;
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
