import { manufacturerUrl, type DISTRIBUTORS } from "../data/catalog";
import type { Distribution, Row } from "../lib/model";
import DistributionIllustration from "./distribution-illustration";
import SupplierPrice from "./supplier-price";

type Props = { product: typeof DISTRIBUTORS[number]; row?: Row; segment?: Distribution; panelIndex: number; onRemove?: () => void; onAdd?: () => void };

export default function DistributionDetails({ product, row, segment, panelIndex, onRemove, onAdd }: Props) {
  const comb = product.kind === "comb";
  return <div className="te-distribution-details">
    <div className="te-distribution-detail-illustration"><DistributionIllustration fit product={product} /></div>
    <span className="te-badge">{comb ? "RESI9 XP" : "RESI9 XE"}</span>
    <h3>{product.name}</h3><p className="te-distribution-reference">{product.reference}</p>
    <SupplierPrice referenceCode={product.reference} />
    <dl><div><dt>Équipement</dt><dd>{comb ? "Peigne horizontal" : "Répartiteur embrochable"}</dd></div><div><dt>Largeur nominale</dt><dd>{product.modules} modules</dd></div>
      {!comb && <div><dt>Connecteur intégré</dt><dd>{product.connector ? "Oui · avec connecteur" : "Non · sans connecteur"}</dd></div>}
      {row && segment ? <><div><dt>Emplacement</dt><dd>Tableau {panelIndex + 1} · {row.name}</dd></div><div><dt>Positions occupées</dt><dd>{segment.slot + 1} à {segment.slot + product.modules}</dd></div></> : <div><dt>Sélection</dt><dd>Produit du catalogue</dd></div>}
    </dl>
    <p className="te-info">{row && segment ? "Glissez cet élément pour le déplacer. Les flèches gauche et droite permettent un déplacement au clavier." : "Glissez ce produit sur la bande de distribution d’une rangée pour le placer."}</p>
    {onAdd && <div className="te-inspector-actions"><button type="button" onClick={onAdd}>Ajouter à la rangée active</button></div>}
    {onRemove && <div className="te-inspector-actions"><button type="button" className="te-danger" onClick={onRemove}>Supprimer la distribution</button></div>}
    <a className="te-source" href={manufacturerUrl(product.reference)} target="_blank" rel="noreferrer">Consulter la fiche Schneider ↗</a>
  </div>;
}
