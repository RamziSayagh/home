import elec44 from "../data/elec44-prices.json";
import oneTwoThreeElec from "../data/123elec-prices.json";
import elecdirect from "../data/elecdirect-prices.json";
import type { Material } from "./model";

export type SupplierId = "elec44" | "123elec" | "elecdirect";
export type SupplierPrice = { unitPriceCents: number | null; source: string | null; status: string; checkedAt?: string };
type SupplierSnapshot = { supplier: string; checkedAt: string; items: Record<string, SupplierPrice> };

const snapshots: Record<SupplierId, SupplierSnapshot> = { elec44, "123elec": oneTwoThreeElec, elecdirect };
export const SUPPLIERS: { id: SupplierId; name: string; checkedAt: string }[] = [
  { id: "elec44", name: "Elec44", checkedAt: elec44.checkedAt },
  { id: "123elec", name: "123elec", checkedAt: oneTwoThreeElec.checkedAt },
  { id: "elecdirect", name: "Elecdirect", checkedAt: elecdirect.checkedAt },
];
export const PRICE_DATE = elec44.checkedAt;
const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const formatPrice = (cents: number) => euros.format(cents / 100);
export function priceDate(supplier: SupplierId, reference?: string) { return (reference ? supplierPrice(reference, supplier)?.checkedAt : undefined) ?? snapshots[supplier].checkedAt; }
export function priceDateLabel(supplier: SupplierId, reference?: string) { return priceDate(supplier, reference).split("-").reverse().join("/"); }
export const PRICE_DATE_LABEL = priceDateLabel("elec44");

export function supplierPrice(reference: string, supplier: SupplierId = "elec44"): SupplierPrice | undefined {
  const prices = snapshots[supplier].items;
  return Object.hasOwn(prices, reference) ? prices[reference] : undefined;
}

export function materialBudget(materials: Material[], supplier: SupplierId = "elec44") {
  let totalCents = 0;
  let missingQuantity = 0;
  let pricedQuantity = 0;
  for (const item of materials) {
    const cents = supplierPrice(item.reference, supplier)?.unitPriceCents;
    if (cents == null) missingQuantity += item.quantity;
    else { totalCents += cents * item.quantity; pricedQuantity += item.quantity; }
  }
  return { totalCents, missingQuantity, pricedQuantity };
}

// Uses only identical, priced lines so an unavailable item cannot make one supplier look cheaper.
export function comparableBudget(materials: Material[]) {
  let elec44Cents = 0;
  let oneTwoThreeElecCents = 0;
  let quantity = 0;
  for (const item of materials) {
    const elec44Price = supplierPrice(item.reference, "elec44")?.unitPriceCents;
    const oneTwoThreeElecPrice = supplierPrice(item.reference, "123elec")?.unitPriceCents;
    if (elec44Price == null || oneTwoThreeElecPrice == null) continue;
    elec44Cents += elec44Price * item.quantity;
    oneTwoThreeElecCents += oneTwoThreeElecPrice * item.quantity;
    quantity += item.quantity;
  }
  return { elec44Cents, oneTwoThreeElecCents, quantity, differenceCents: oneTwoThreeElecCents - elec44Cents };
}

export function comparableSuppliersBudget(materials: Material[]) {
  const totals: Record<SupplierId, number> = { elec44: 0, "123elec": 0, elecdirect: 0 };
  let quantity = 0;
  for (const item of materials) {
    const prices = SUPPLIERS.map(supplier => supplierPrice(item.reference, supplier.id)?.unitPriceCents);
    if (prices.some(price => price == null)) continue;
    SUPPLIERS.forEach((supplier, index) => { totals[supplier.id] += prices[index]! * item.quantity; });
    quantity += item.quantity;
  }
  return { totals, quantity };
}

export function materialsCsv(materials: Material[]) {
  const decimal = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
  const rows: (string | number)[][] = [["Référence", "Désignation", "Quantité", ...SUPPLIERS.flatMap(s => [`Prix unitaire TTC ${s.name} (€)`, `Total TTC ${s.name} (€)`]), "État du prix", ...SUPPLIERS.map(s => `Source ${s.name}`), "Dates des relevés", "État de l’assemblage"], ...materials.map(item => {
    const prices = SUPPLIERS.map(s => supplierPrice(item.reference, s.id));
    return [item.reference, item.name, item.quantity, ...prices.flatMap(p => p?.unitPriceCents == null ? ["", ""] : [decimal(p.unitPriceCents), decimal(p.unitPriceCents * item.quantity)]), prices.every(p => p?.unitPriceCents == null) ? "Non chiffré" : "Prix indicatifs TTC", ...prices.map(p => p?.source ?? ""), SUPPLIERS.map((s, i) => prices[i]?.unitPriceCents == null ? "" : `${s.name} : ${priceDate(s.id, item.reference)}`).filter(Boolean).join(" · "), item.status];
  })];
  for (const supplier of SUPPLIERS) {
    const budget = materialBudget(materials, supplier.id);
    rows.push([budget.missingQuantity ? `SOUS-TOTAL CONNU TTC ${supplier.name.toUpperCase()}` : `TOTAL ESTIMÉ TTC ${supplier.name.toUpperCase()}`, "", "", ...SUPPLIERS.flatMap(s => ["", s.id === supplier.id ? decimal(budget.totalCents) : ""]), budget.missingQuantity ? `${budget.missingQuantity} élément(s) non chiffré(s)` : "Tous les éléments chiffrés", ...SUPPLIERS.map(s => s.id === supplier.id ? `${s.name} · hors livraison` : ""), "Voir dates des lignes", ""]);
  }
  const cell = (value: string | number) => `"${String(typeof value === "string" && /^[=+@\\-\\t\\r]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
  return `\uFEFF${rows.map(row => row.map(cell).join(";")).join("\r\n")}`;
}
