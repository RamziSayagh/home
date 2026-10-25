import { SUPPLIERS, formatPrice, priceDateLabel, supplierPrice, type SupplierId } from "../lib/pricing";

function SupplierPriceLine({ referenceCode, supplier }: { referenceCode: string; supplier: SupplierId }) {
  const price = supplierPrice(referenceCode, supplier);
  const name = SUPPLIERS.find(item => item.id === supplier)!.name;
  if (price?.unitPriceCents == null || !price.source) return <span className="te-price-unavailable">Prix {name} non trouvé</span>;
  return <a className="te-supplier-price" href={price.source} target="_blank" rel="noreferrer" title={`Prix unitaire TTC relevé le ${priceDateLabel(supplier, referenceCode)}, hors livraison`} aria-label={`Prix ${name} ${referenceCode} : ${formatPrice(price.unitPriceCents)} TTC`}>
    <strong>{formatPrice(price.unitPriceCents)}</strong> <span>TTC · {name} ↗</span>
  </a>;
}

export default function SupplierPrice({ referenceCode, supplier }: { referenceCode: string; supplier?: SupplierId }) {
  if (supplier) return <SupplierPriceLine referenceCode={referenceCode} supplier={supplier} />;
  return <div className="te-supplier-prices">{SUPPLIERS.map(item => <SupplierPriceLine key={item.id} referenceCode={referenceCode} supplier={item.id} />)}</div>;
}
