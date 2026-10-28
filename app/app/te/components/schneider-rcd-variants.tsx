import { useId } from "react";
import type { Product } from "../data/catalog";

// Decorative front elevations based on Schneider's product photographs.
export function SchneiderXpRcdFront({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const body = `url(#${id}-body)`;
  return <div className={`te-equipment-face te-r9era263 ${compact ? "compact" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 90 180" preserveAspectRatio="none" focusable="false" fontFamily="Arial, sans-serif">
      <defs><linearGradient id={`${id}-body`} x2=".2" y2="1"><stop stopColor="#fff" /><stop offset=".65" stopColor="#f4f5f1" /><stop offset="1" stopColor="#d8dbd3" /></linearGradient></defs>
      <path d="M4 3h82v160H4z" fill={body} stroke="#ccd1c8" />
      <path d="M6 9h78v38H6z" fill="#fbfcf8" stroke="#e1e4dc" />
      {[25, 64].map(x => <g key={x}><ellipse cx={x} cy="27" rx="9" ry="11" fill="#e1e5dd" /><circle cx={x} cy="27" r="6.5" fill="#b0b8ae" /><circle cx={x} cy="26" r="5" fill="#ebeee8" /><path d={`M${x-3} 26h6m-3-3v6`} stroke="#808a7d" strokeWidth="1.5" /></g>)}
      <path d="M5 51h80v101H5z" fill={body} stroke="#d7dcd3" />
      <path d="M10 57h35v91H10z" fill="#cbd1c8" /><path d="M13 59h29v86H13z" fill="#f9faf7" stroke="#b9c2b6" />
      <path d="M16 61h23v24H16z" fill="#f4f5f1" stroke="#c5ccc2" /><text x="27.5" y="79" textAnchor="middle" fontSize="18" fill="#879285">T</text>
      <text x="27.5" y="91" textAnchor="middle" fontSize="5.5" fill="#596353">Test régulier</text>
      <path d="M16 94h23l-1 24 1 24H16l1-24z" fill="#fff" stroke="#c2c9be" />
      <text x="27.5" y="113" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#3b4436">O.OFF</text>
      <path d="M15 130h25v14H15z" fill="#e7eae3" stroke="#c7cfc3" />
      <g fill="#008b32"><text x="49" y="62" fontSize="9" fontWeight="700" textLength="33" lengthAdjust="spacingAndGlyphs">Schneider</text><text x="52" y="70" fontSize="6.5">Electric</text></g>
      <text x="49" y="81" fontSize="8" fill="#495348">Resi9 XP</text><text x="49" y="90" fontSize="6.5" fill="#606b5c">R9PRF263</text>
      <g fill="#263522" textAnchor="middle"><text x="66" y="111" fontSize="9.5" fontWeight="600">Type Fsi</text><text x="66" y="127" fontSize="14" fontWeight="700">63 A</text><text x="66" y="141" fontSize="11" fontWeight="600">30 mA</text></g>
      <path d="M5 152h80v22H5z" fill="#eed400" stroke="#d1bc00" /><path d="M10 152h70" stroke="#fff176" /><path d="M17 168l6-11 6 11z M64 170v-12m-4 4 4-4 4 4" fill="none" stroke="#a39700" strokeWidth="1.5" />
    </svg>
  </div>;
}

export function SchneiderActiRcdFront({ product, compact = false }: { product: Product; compact?: boolean }) {
  const id = useId();
  const isEv = product.reference === "A9Z51240";
  return <div className={`te-equipment-face te-r9era263 ${compact ? "compact" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 180 180" preserveAspectRatio="none" focusable="false" fontFamily="Arial, sans-serif">
      <defs><linearGradient id={`${id}-body`} x2=".12" y2="1"><stop stopColor="#fff" /><stop offset=".6" stopColor="#f7f8f5" /><stop offset="1" stopColor="#daddd5" /></linearGradient></defs>
      <rect x="2" y="2" width="176" height="176" rx="3" fill={`url(#${id}-body)`} stroke="#bdc5b9" />
      <path d="M4 5h172v33H4zM4 151h172v25H4z" fill="#f2f4ef" stroke="#d7ddd3" />
      {[25, 65, 105, 145].map((x, i) => <g key={x}>
        <circle cx={x} cy="22" r="9" fill="#e5e9e1" stroke="#c3ccc0" />
        <circle cx={x} cy="162" r="8" fill="#e5e9e1" stroke="#c3ccc0" />
        {i < 2 ? <><circle cx={x} cy="22" r="6" fill="#a8b1a6" /><circle cx={x} cy="162" r="5" fill="#a8b1a6" /><path d={`M${x-4} 22h8m-4-4v8M${x-3} 162h6m-3-3v6`} stroke="#f7f8f5" strokeWidth="1.5" /></> : null}
      </g>)}
      <rect x="16" y="4" width="14" height="4" rx="1" fill="#e5cb00" /><rect x="140" y="4" width="14" height="4" rx="1" fill="#e5cb00" />
      <rect x="5" y="40" width="170" height="108" rx="2" fill="#fbfcf9" stroke="#d5ddd2" />
      <path d="M7 90h166" stroke="#d1d9ce" /><path d="M8 92h164" stroke="#fff" />
      <rect x="12" y="53" width="25" height="12" rx="1" fill="#f9faf7" stroke="#b6c0b3" />
      <text x="24.5" y="62" textAnchor="middle" fontSize="9" fill="#758271">T</text>
      <text x="24.5" y="71" textAnchor="middle" fontSize="6" fill="#4d584a">Test régulier</text>
      <g fill="#008b32"><text x="48" y="52" fontSize="11" fontWeight="700">Schneider</text><text x="55" y="60" fontSize="6" fontWeight="600">Electric</text></g>
      <rect x="110" y="45" width="55" height="3" rx="1.5" fill="#059838" />
      <text x="48" y="71" fontSize="8" fill="#495548">Acti9 iID</text>
      <text x="48" y="80" fontSize="6.8" fill="#596557">{product.reference}</text>
      <path d="M12 99h38v40H12z" fill="#d3d9d0" stroke="#b8c2b4" /><path d="M17 100h27v28H17z" fill="#fafbf8" stroke="#c4cec1" />
      <path d="M18 101h25v7H18z" fill="#178a42" /><text x="30.5" y="106.5" textAnchor="middle" fontSize="5.8" fontWeight="700" fill="#fff">O · OFF</text>
      <path d="M13 128h35v12H13z" fill="#424a43" stroke="#313a32" /><path d="M15 129h31" stroke="#7b867c" />
      <rect x="65" y="98" width="24" height="26" rx="2" fill="#e8ece5" stroke="#b7c2b5" />
      <path d="M69 102h16v18H69zM72 105h3v3h-3zM79 112h3v3h-3zM72 115h4v3h-4z" fill="none" stroke="#89978a" strokeWidth="1" />
      <rect x="130" y="55" width="29" height="50" rx="3" fill="#009b3e" />
      <text x="144.5" y="69" textAnchor="middle" fontSize="7" fontWeight="600" fill="#fff">{isEv ? "EV" : "SI"}</text>
      <text x="144.5" y="96" textAnchor="middle" fontSize="27" fontWeight="700" fill="#fff">B</text>
      <g fill="#263522"><text x="57" y="136" fontSize="10" fontWeight="700">Type {isEv ? "B-EV" : "B-SI"}</text><text x="57" y="146" fontSize="10" fontWeight="700">{product.short}</text><text x="101" y="146" fontSize="9" fontWeight="600">30 mA</text></g>
    </svg>
  </div>;
}
