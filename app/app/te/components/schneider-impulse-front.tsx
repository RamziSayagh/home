import { useId } from "react";
import type { Product } from "../data/catalog";

// Decorative front views based on Schneider's product photographs.
export default function SchneiderImpulseFront({ product, compact = false }: { product: Product; compact?: boolean }) {
  const id = useId();
  const silent = product.reference === "R9PCL2S";
  const body = `url(#${id}-body)`;
  const screw = (x: number, y: number) => <g key={`${x}-${y}`}>
    <circle cx={x} cy={y} r="5.5" fill="#d6ddd2" stroke="#fdfefa" strokeWidth=".8" />
    <circle cx={x} cy={y} r="3.7" fill="#b2bbb0" />
    <path d={`M${x-2.4} ${y}h4.8M${x} ${y-2.4}v4.8`} stroke="#f8faf6" strokeWidth="1" />
  </g>;

  return <div className={`te-equipment-face te-impulse-front ${compact ? "compact" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 50 180" preserveAspectRatio="none" focusable="false" fontFamily="Arial, Helvetica, sans-serif">
      <defs><linearGradient id={`${id}-body`}><stop stopColor="#d6dbd2" /><stop offset=".1" stopColor="#fff" /><stop offset=".8" stopColor="#f9faf6" /><stop offset="1" stopColor="#dce0d8" /></linearGradient></defs>
      <rect x="2" y="3" width="46" height="174" rx="2" fill={body} stroke="#c8d0c5" />
      {silent ? <>
        {/* Silent TL+: three upper and three lower terminals, round manual button. */}
        <path d="M3 5h44v40H3zM3 153h44v22H3z" fill="#f5f7f2" stroke="#e0e5dc" />
        {[12,25,38].map(x => screw(x, 27))}{[12,25,38].map(x => screw(x, 164))}
        <g fill="#768172" textAnchor="middle" fontSize="5"><text x="12" y="16">1</text><text x="25" y="16">3</text><text x="38" y="16">A1</text><text x="12" y="174">2</text><text x="25" y="174">4</text><text x="38" y="174">A2</text></g>
        <path d="M3 49h44v101H3z" fill="#fafbf8" stroke="#e0e5dc" />
        <text x="5" y="61" fontSize="8.5" fontWeight="700" fill="#008b32" textLength="39" lengthAdjust="spacingAndGlyphs">Schneider</text>
        <text x="9" y="69" fontSize="6.5" fontWeight="600" fill="#008b32" textLength="31" lengthAdjust="spacingAndGlyphs">Electric</text>
        <text x="6" y="80" fontSize="8" fill="#475448">Resi9</text><text x="6" y="89" fontSize="7" fill="#475448">TL+</text>
        <text x="6" y="98" fontSize="6" fill="#657160" textLength="37" lengthAdjust="spacingAndGlyphs">R9PCL2S</text>
        <circle cx="22" cy="118" r="10" fill="#dbe1d8" stroke="#b8c3b4" /><circle cx="22" cy="117" r="8.5" fill="#fbfcf9" stroke="#fff" />
        <text x="35" y="112" fontSize="6.5" fill="#63705e">0</text><text x="35" y="125" fontSize="6.5" fill="#63705e">I</text>
        <text x="6" y="145" fontSize="12" fontWeight="700" fill="#293b2a">16 A</text><text x="32" y="145" fontSize="6.5" fill="#505c4e">230 V~</text>
      </> : <>
        {/* Standard TL: blue upper terminal, small manual I/O lever. */}
        <path d="M3 5h44v43H3z" fill="#f5f7f2" stroke="#e0e5dc" />
        <path d="M11 7h28v9H11z" fill="#e6eae3" /><path d="M8 18h15v10H8z" fill="#198bc2" stroke="#087bae" />
        {screw(15, 38)}{screw(35, 38)}
        <rect x="16" y="3" width="18" height="3" rx="1" fill="#d6c600" />
        <path d="M3 50h44v101H3z" fill="#fafbf8" stroke="#e0e5dc" />
        <text x="5" y="62" fontSize="8.5" fontWeight="700" fill="#008b32" textLength="39" lengthAdjust="spacingAndGlyphs">Schneider</text>
        <text x="9" y="70" fontSize="6.5" fontWeight="600" fill="#008b32" textLength="31" lengthAdjust="spacingAndGlyphs">Electric</text>
        <text x="6" y="81" fontSize="8" fill="#475448">Resi9</text><text x="6" y="90" fontSize="7" fill="#475448">TL</text>
        <text x="6" y="99" fontSize="6" fill="#657160" textLength="37" lengthAdjust="spacingAndGlyphs">R9PCL216</text>
        <path d="M4 105h42" stroke="#d6ddd2" />
        <text x="25" y="115" textAnchor="middle" fontSize="7" fill="#4d5949">I</text>
        <rect x="17" y="118" width="16" height="16" rx="1" fill="#d5dcd2" stroke="#b9c4b6" /><path d="M20 120h10v10H20z" fill="#fafbf8" />
        <text x="25" y="142" textAnchor="middle" fontSize="7" fill="#4d5949">O</text>
        <path d="M3 151h44v26H3z" fill="#edf1ea" stroke="#d1d9ce" />
        <text x="5" y="164" fontSize="12" fontWeight="700" fill="#293b2a">16 A</text><text x="31" y="164" fontSize="6.5" fill="#505c4e">230 V~</text>
        {screw(15, 171)}{screw(35, 171)}
      </>}
    </svg>
  </div>;
}
