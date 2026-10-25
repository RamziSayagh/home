import type { DISTRIBUTORS } from "../data/catalog";

type IllustratedProduct = Pick<typeof DISTRIBUTORS[number], "kind" | "modules" | "connector">;

// Schematic shapes identify distribution families, not terminal geometry or wiring.
export default function DistributionIllustration({ product, fit = false }: { product: IllustratedProduct; fit?: boolean }) {
  const comb = product.kind === "comb";
  const pitch = 16;
  const width = product.modules * pitch;
  const center = 4 + width / 2;
  return <svg className={`te-distribution-illustration ${comb ? "comb" : "xe"}`} viewBox={`0 0 ${fit ? width + 10 : 298} 46`} aria-hidden="true" focusable="false">
    {comb ? <>
      <rect x="4" y="5" width={width} height="15" rx="3" fill="#e9e5d9" stroke="#a99e84" />
      <path d={`M 7 11 H ${width + 1}`} stroke="#89714b" strokeWidth="2" />
      {Array.from({ length: product.modules }, (_, index) => <path key={index} d={`M ${11 + index * pitch} 20 V 37 h 5 V 20`} fill="#c99548" stroke="#95672e" />)}
    </> : <>
      <rect x="4" y="12" width={width} height="26" rx="3" fill="#e4e9de" stroke="#73866b" />
      <rect x="4" y="12" width={width} height="6" rx="2" fill="#3f7650" />
      {Array.from({ length: product.modules }, (_, index) => <g key={index}>
        <rect x={9 + index * pitch} y="23" width="6" height="10" rx="1" fill="#475345" />
        <path d={`M ${12 + index * pitch} 25 V 31`} stroke="#c4b07a" strokeWidth="1.5" />
      </g>)}
      {product.connector && <g>
        <rect x={center - 17} y="1" width="34" height="18" rx="3" fill="#f7f4ea" stroke="#847b63" />
        {[-8, 8].map(offset => <g key={offset}><circle cx={center + offset} cy="10" r="5" fill="#b6ad91" stroke="#726a52" /><path d={`M ${center + offset - 3.5} 10 h 7`} stroke="#5f5b4c" strokeWidth="1.5" /></g>)}
      </g>}
    </>}
  </svg>;
}

export function DistributionVisualGuide() {
  return <div className="te-distribution-visual-guide" aria-label="Repères visuels des distributions">
    <div><DistributionIllustration fit product={{ kind: "xe", modules: 8, connector: true }} /><span><i className="te-connector-dot" />Avec connecteur</span></div>
    <div><DistributionIllustration fit product={{ kind: "xe", modules: 8, connector: false }} /><span>Sans connecteur</span></div>
    <div><DistributionIllustration fit product={{ kind: "comb", modules: 8, connector: false }} /><span>Peigne XP · dents</span></div>
    <p>Illustrations simplifiées · le bloc à vis repère le connecteur.</p>
    <div className="te-distribution-example" aria-label="Exemple de deux répartiteurs sur une rangée de treize modules"><span style={{ flex: 5 }}>5 modules</span><span style={{ flex: 8 }}>8 modules</span></div>
    <p>5 + 8 = une rangée de 13 modules. Glissez pour placer · × pour retirer.</p>
  </div>;
}
